/* eslint-disable camelcase */
/* eslint-disable implicit-arrow-linebreak */
/* eslint-disable function-paren-newline */
/* eslint-disable consistent-return */
/* eslint-disable no-unused-vars */
/* eslint-disable no-use-before-define */
/* eslint-disable no-shadow */

const express = require("express");

const router = express.Router();
const Joi = require("joi");
const fs = require("fs");
const validateRequest = require("../middlewares/validation.middleware");
const authorize = require("../middlewares/auth.middleware");
const Role = require("../../utils/roles");
const accountService = require("../services/authentication.service");
const {
  google_client_id,
  google_client_secret,
  google_redirect_url,
} = require("../../config.json");
const authenticationService = require("../services/authentication.service");

// google login

router.get("/login", (req, res) => {
  fs.readFile(
    `${__dirname.replace("src/routes", "public/login.html")}`,
    "utf8",
    (err, text) => {
      res.send(text);
    }
  );
});
router.all("/token", linkGoogle);
// routes
router.get("/getUser", authorize(), getUser);
router.get("/:id", authorize(), getById);

router.post("/authenticate", authenticateSchema, authenticate);
router.post("/refresh-token", refreshSchema, refreshToken);
router.post("/revoke-token", authorize(), revokeTokenSchema, revokeToken);
router.post("/register", registerSchema, register);
router.post("/verify-email", verifyEmailSchema, verifyEmail);
router.post("/forgot-password", forgotPasswordSchema, forgotPassword);
router.post(
  "/validate-reset-token",
  validateResetTokenSchema,
  validateResetToken
);
router.post("/reset-password", resetPasswordSchema, resetPassword);
router.post("/", authorize(Role.Admin), createSchema, create);
router.put("/:id", authorize(), updateSchema, update);

module.exports = router;

function authenticateSchema(req, res, next) {
  const schema = Joi.object({
    email: Joi.string().required(),
    password: Joi.string().required(),
  });
  validateRequest(req, next, schema);
}

async function linkGoogle(req, res, next) {
  const grantType = req.query.grant_type
    ? req.query.grant_type
    : req.body.grant_type;

  const validateRequest = ({ redirect_uri, client_id, client_secret }) => {
    return (
      client_id !== google_client_id ||
      client_secret !== google_client_secret ||
      redirect_uri !== google_redirect_url
    );
  };

  const secondsInDay = 86400; // 60 * 60 * 24
  const HTTP_STATUS_OK = 200;

  let token;

  console.log(req.body);
  console.log(req.query);

  if (grantType === "authorization_code") {
    if (validateRequest(req.body)) {
      res.status(400).send({ error: "invalid_grant" });
      return;
    }

    const { code } = req.body;

    const user = await authenticationService.getUserByJwt(code);

    if (!user) {
      res.status(400).send({ error: "invalid_request" });
      return;
    }

    token = {
      access_token: accountService.generateJwtToken(user, "1d", "access"),
      refresh_token: accountService.generateJwtToken(user, null, "refresh"),
    };
  } else if (grantType === "refresh_token") {
    if (validateRequest(req.query)) {
      res.status(400).send({ error: "invalid_grant" });
      return;
    }

    const { refresh_token } = req.query;

    const user = await authenticationService.getUserByJwt(refresh_token);

    if (!user) {
      res.status(404).send({ error: "user not found" });
      return;
    }

    token = {
      access_token: accountService.generateJwtToken(user, "1d", "access"),
    };
  }
  // functions.logger.debug('token:', token);
  res
    .status(HTTP_STATUS_OK)
    .json({ ...token, expiresIn: secondsInDay, token_type: "Bearer" });
}

function authenticate(req, res, next) {
  const { email, password } = req.body;
  const ipAddress = req.ip;
  accountService
    .authenticate({ email, password, ipAddress })
    .then(({ ...account }) => {
      res.json(account);
    })
    .catch((e) => {
      next(e);
    });
}

function getUser(req, res, next) {
  res.status(200).send({
    message: "success",
    data: {
      id: req.user.account.id,
      firstName: req.user.account.firstName,
      lastName: req.user.account.lastName,
      email: req.user.account.email,
      role: req.user.account.role,
      created: req.user.account.created,
      isVerified: req.user.account.isVerified,
    },
  });
}

function refreshToken(req, res, next) {
  const token = req.body.refreshToken;
  const ipAddress = req.ip;
  accountService
    .refreshToken({ token, ipAddress })
    .then(({ refreshToken, ...account }) => {
      setTokenCookie(res, refreshToken);
      res.json({ ...account, refreshToken });
    })
    .catch(next);
}

function revokeTokenSchema(req, res, next) {
  const schema = Joi.object({
    token: Joi.string().empty(""),
  });
  validateRequest(req, next, schema);
}

function revokeToken(req, res, next) {
  // accept token from request body or cookie
  const token = req.body.token || req.cookies.refreshToken;
  const ipAddress = req.ip;

  if (!token) return res.status(400).json({ message: "Token is required" });

  // users can revoke their own tokens and admins can revoke any tokens
  if (!req.user.ownsToken(token) && req.user.role !== Role.Admin) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  accountService
    .revokeToken({ token, ipAddress })
    .then(() => res.json({ message: "Token revoked" }))
    .catch(next);
}

function refreshSchema(req, res, next) {
  const schema = Joi.object({
    refreshToken: Joi.string().required(),
  });
  validateRequest(req, next, schema);
}

function registerSchema(req, res, next) {
  const schema = Joi.object({
    firstName: Joi.string().required(),
    lastName: Joi.string().required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    confirmPassword: Joi.string().valid(Joi.ref("password")).required(),
  });
  validateRequest(req, next, schema);
}

function register(req, res, next) {
  accountService
    .register(req.body, req.get("origin"))
    .then(() =>
      // eslint-disable-next-line implicit-arrow-linebreak
      res.json({
        message:
          "Registration successful, please check your email for verification instructions",
      })
    )
    .catch(next);
}

function verifyEmailSchema(req, res, next) {
  const schema = Joi.object({
    token: Joi.string().required(),
  });
  validateRequest(req, next, schema);
}

function verifyEmail(req, res, next) {
  accountService
    .verifyEmail(req.body)
    .then(() =>
      res.json({ message: "Verification successful, you can now login" })
    )
    .catch(next);
}

function forgotPasswordSchema(req, res, next) {
  const schema = Joi.object({
    email: Joi.string().email().required(),
  });
  validateRequest(req, next, schema);
}

function forgotPassword(req, res, next) {
  accountService
    .forgotPassword(req.body, req.get("origin"))
    .then(() =>
      res.json({
        message: "Please check your email for password reset instructions",
      })
    )
    .catch(next);
}

function validateResetTokenSchema(req, res, next) {
  const schema = Joi.object({
    token: Joi.string().required(),
  });
  validateRequest(req, next, schema);
}

function validateResetToken(req, res, next) {
  accountService
    .validateResetToken(req.body)
    .then(() => res.json({ message: "Token is valid" }))
    .catch(next);
}

function resetPasswordSchema(req, res, next) {
  const schema = Joi.object({
    token: Joi.string().required(),
    password: Joi.string().min(6).required(),
    confirmPassword: Joi.string().valid(Joi.ref("password")).required(),
  });
  validateRequest(req, next, schema);
}

function resetPassword(req, res, next) {
  accountService
    .resetPassword(req.body)
    .then(() =>
      res.json({ message: "Password reset successful, you can now login" })
    )
    .catch(next);
}

function getById(req, res, next) {
  // users can get their own account and admins can get any account
  if (req.params.id !== req.user.id && req.user.role !== Role.Admin) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  accountService
    .getById(req.params.id)
    .then((account) => (account ? res.json(account) : res.sendStatus(404)))
    .catch(next);
}

function createSchema(req, res, next) {
  const schema = Joi.object({
    firstName: Joi.string().required(),
    lastName: Joi.string().required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    confirmPassword: Joi.string().valid(Joi.ref("password")).required(),
  });
  validateRequest(req, next, schema);
}

function create(req, res, next) {
  accountService
    .create(req.body)
    .then((account) => res.json(account))
    .catch(next);
}

function updateSchema(req, res, next) {
  const schemaRules = {
    title: Joi.string().empty(""),
    firstName: Joi.string().empty(""),
    lastName: Joi.string().empty(""),
    email: Joi.string().email().empty(""),
    password: Joi.string().min(6).empty(""),
    confirmPassword: Joi.string().valid(Joi.ref("password")).empty(""),
  };

  // only admins can update role
  if (req.user.role === Role.Admin) {
    schemaRules.role = Joi.string().valid(Role.Admin, Role.User).empty("");
  }

  const schema = Joi.object(schemaRules).with("password", "confirmPassword");
  validateRequest(req, next, schema);
}

function update(req, res, next) {
  // users can update their own account and admins can update any account
  if (req.params.id !== req.user.id && req.user.role !== Role.Admin) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  accountService
    .update(req.params.id, req.body)
    .then((account) => res.json(account))
    .catch(next);
}

function setTokenCookie(res, token) {
  // create cookie with refresh token that expires in 7 days
  const cookieOptions = {
    httpOnly: true,
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  };
  res.cookie("refreshToken", token, cookieOptions);
}
