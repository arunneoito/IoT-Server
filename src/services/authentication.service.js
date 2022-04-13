/* eslint-disable no-param-reassign */
/* eslint-disable consistent-return */
/* eslint-disable no-shadow */
/* eslint-disable no-use-before-define */
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const sendEmail = require("../../utils/send-email");
const Role = require("../../utils/roles");
const Account = require("../models/account.model");
const RefreshToken = require("../models/refreshToken.model");
const config = require("../../config.json");

async function authenticate({ email, password, ipAddress }) {
  const account = await Account.findOne({ email });

  if (!account || !bcrypt.compareSync(password, account.passwordHash)) {
    throw new Error("Email or password is incorrect");
  }
  if (!account.isVerified) {
    throw new Error("Please verify your email address");
  }

  // authentication successful so generate jwt and refresh tokens
  const jwtToken = generateJwtToken(account, "15min", "access");
  const refreshToken = generateRefreshToken(account, ipAddress);

  // save refresh token
  await refreshToken.save();

  // return basic details and tokens
  return {
    ...basicDetails(account),
    jwtToken,
    refreshToken: refreshToken.token,
  };
}

async function getUserByJwt(token) {
  const payload = jwt.verify(token, config.secret);
  console.log(payload);
  return await Account.findById(payload.id);
}

async function refreshToken({ token, ipAddress }) {
  const refreshToken = await getRefreshToken(token);
  const { account } = refreshToken;

  // replace old refresh token with a new one and save
  const newRefreshToken = generateRefreshToken(account, ipAddress);
  refreshToken.revoked = Date.now();
  refreshToken.revokedByIp = ipAddress;
  refreshToken.replacedByToken = newRefreshToken.token;
  await refreshToken.save();
  await newRefreshToken.save();

  // generate new jwt
  const jwtToken = generateJwtToken(account, "15min", "access");

  // return basic details and tokens
  return {
    ...basicDetails(account),
    jwtToken,
    refreshToken: newRefreshToken.token,
  };
}

async function revokeToken({ token, ipAddress }) {
  const refreshToken = await getRefreshToken(token);

  // revoke token and save
  refreshToken.revoked = Date.now();
  refreshToken.revokedByIp = ipAddress;
  await refreshToken.save();
}

async function register(params, origin) {
  // validate
  if (await Account.findOne({ email: params.email })) {
    // send already registered error in email to prevent account enumeration
    // eslint-disable-next-line no-return-await
    return await sendAlreadyRegisteredEmail(params.email, origin);
  }

  // create account object
  const account = new Account(params);

  // first registered account is an admin
  const isFirstAccount = (await Account.countDocuments({})) === 0;
  account.role = isFirstAccount ? Role.Admin : Role.User;
  account.verificationToken = randomTokenString();

  // hash password
  account.passwordHash = hash(params.password);
  account.keys = {
    secretKey: hash(`${params.password} ${params.email}`),
    createdAt: new Date(),
  };

  // save account
  await account.save();

  // send email
  await sendVerificationEmail(account, origin);
}

async function verifyEmail({ token }) {
  const account = await Account.findOne({ verificationToken: token });

  if (!account) throw new Error("Verification failed");

  account.verified = Date.now();
  account.verificationToken = undefined;
  await account.save();
}

async function forgotPassword({ email }, origin) {
  const account = await Account.findOne({ email });

  // always return ok response to prevent email enumeration
  if (!account) return;

  // create reset token that expires after 24 hours
  account.resetToken = {
    token: randomTokenString(),
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
  };
  await account.save();

  // send email
  await sendPasswordResetEmail(account, origin);
}

async function validateResetToken({ token }) {
  const account = await Account.findOne({
    "resetToken.token": token,
    "resetToken.expires": { $gt: Date.now() },
  });

  if (!account) throw new Error("Invalid token");
}

async function resetPassword({ token, password }) {
  const account = await Account.findOne({
    "resetToken.token": token,
    "resetToken.expires": { $gt: Date.now() },
  });

  if (!account) throw new Error("Invalid token");

  // update password and remove reset token
  account.passwordHash = hash(password);
  account.passwordReset = Date.now();
  account.resetToken = undefined;
  await account.save();
}

async function getAll() {
  const accounts = await Account.find();
  return accounts.map((x) => basicDetails(x));
}

async function getById(id) {
  const account = await getAccount(id);
  return basicDetails(account);
}

async function create(params) {
  // validate
  if (await Account.findOne({ email: params.email })) {
    throw new Error(`Email "${params.email}" is already registered`);
  }

  const account = new Account(params);
  account.verified = Date.now();

  // hash password
  account.passwordHash = hash(params.password);

  console.log(account);
  // save account
  await account.save();

  return basicDetails(account);
}

async function update(id, params) {
  const account = await getAccount(id);

  // validate (if email was changed)
  if (
    params.email &&
    account.email !== params.email &&
    (await Account.findOne({ email: params.email }))
  ) {
    throw new Error(`Email "${params.email}" is already taken`);
  }

  // hash password if it was entered
  if (params.password) {
    params.passwordHash = hash(params.password);
  }

  // copy params to account and save
  Object.assign(account, params);
  account.updated = Date.now();
  await account.save();

  return basicDetails(account);
}

// eslint-disable-next-line no-underscore-dangle
async function _delete(id) {
  const account = await getAccount(id);
  await account.remove();
}

// helper functions

async function getAccount(id) {
  const account = await Account.findById(id);
  if (!account) throw new Error("Account not found");
  return account;
}

async function getRefreshToken(token) {
  const refreshToken = await RefreshToken.findOne({ token }).populate(
    "account"
  );
  if (!refreshToken || !refreshToken.isActive) throw new Error("Invalid token");
  return refreshToken;
}

function hash(password) {
  return bcrypt.hashSync(password, 10);
}

function generateJwtToken(account, expiresIn, type) {
  let expire = {};
  if (expiresIn) expire.expiresIn = expiresIn;
  // create a jwt token containing the account id that expires in 15 minutes
  return jwt.sign(
    { sub: account.id, id: account.id, type },
    expire,
    config.secret
  );
}

function generateRefreshToken(account, ipAddress) {
  // create a refresh token that expires in 7 days
  return new RefreshToken({
    account: account.id,
    token: randomTokenString(),
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    createdByIp: ipAddress,
  });
}

function randomTokenString() {
  return crypto.randomBytes(40).toString("hex");
}

function basicDetails(account) {
  const {
    id,
    title,
    firstName,
    lastName,
    email,
    role,
    created,
    updated,
    isVerified,
  } = account;
  return {
    id,
    title,
    firstName,
    lastName,
    email,
    role,
    created,
    updated,
    isVerified,
  };
}

async function sendVerificationEmail(account, origin) {
  let message;
  if (origin) {
    const verifyUrl = `${origin}/account/verify-email?token=${account.verificationToken}`;
    message = `<p>Please click the below link to verify your email address:</p>
                   <p><a href="${verifyUrl}">${verifyUrl}</a></p>`;
  } else {
    message = `<p>Please use the below token to verify your email address with the <code>/account/verify-email</code> api route:</p>
                   <p><code>${account.verificationToken}</code></p>`;
  }

  await sendEmail({
    to: account.email,
    subject: "Sign-up Verification API - Verify Email",
    html: `<h4>Verify Email</h4>
               <p>Thanks for registering!</p>
               ${message}`,
  });
}

async function sendAlreadyRegisteredEmail(email, origin) {
  let message;
  if (origin) {
    message = `<p>If you don't know your password please visit the <a href="${origin}/account/forgot-password">forgot password</a> page.</p>`;
  } else {
    message =
      "<p>If you don't know your password you can reset it via the <code>/account/forgot-password</code> api route.</p>";
  }

  await sendEmail({
    to: email,
    subject: "Sign-up Verification API - Email Already Registered",
    html: `<h4>Email Already Registered</h4>
               <p>Your email <strong>${email}</strong> is already registered.</p>
               ${message}`,
  });
}

async function sendPasswordResetEmail(account, origin) {
  let message;
  if (origin) {
    const resetUrl = `${origin}/account/reset-password?token=${account.resetToken.token}`;
    message = `<p>Please click the below link to reset your password, the link will be valid for 1 day:</p>
                   <p><a href="${resetUrl}">${resetUrl}</a></p>`;
  } else {
    message = `<p>Please use the below token to reset your password with the <code>/account/reset-password</code> api route:</p>
                   <p><code>${account.resetToken.token}</code></p>`;
  }

  await sendEmail({
    to: account.email,
    subject: "Sign-up Verification API - Reset Password",
    html: `<h4>Reset Password Email</h4>
               ${message}`,
  });
}

module.exports = {
  authenticate,
  revokeToken,
  refreshToken,
  register,
  verifyEmail,
  forgotPassword,
  validateResetToken,
  resetPassword,
  getAll,
  getById,
  create,
  update,
  delete: _delete,
  getUserByJwt,
  generateJwtToken,
};
