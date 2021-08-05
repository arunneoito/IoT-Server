const jwt = require("express-jwt");
const Account = require("../models/account.model");
const RefreshToken = require("../models/refreshToken.model");
const { secret } = require("../../config.json");

function authorize(roles = []) {
  // roles param can be a single role string (e.g. Role.User or 'User')
  // or an array of roles (e.g. [Role.Admin, Role.User] or ['Admin', 'User'])
  let roleVar = roles;
  if (typeof roleVar === "string") {
    roleVar = [roles];
  }

  return [
    // authenticate JWT token and attach user to request object (req.user)
    jwt({ secret, algorithms: ["HS256"] }),

    // authorize based on user role
    // eslint-disable-next-line consistent-return
    async (req, res, next) => {
      const account = await Account.findById(req.user.id);
      const refreshTokens = await RefreshToken.find({ account: account.id });

      if (!account || (roleVar.length && !roleVar.includes(account.role))) {
        // account no longer exists or role not authorized
        return res.status(401).json({ message: "Unauthorized" });
      }

      // authentication and authorization successful
      req.user.role = account.role;
      req.user.account = account;
      req.user.ownsToken = (token) =>
        // eslint-disable-next-line implicit-arrow-linebreak
        !!refreshTokens.find((x) => x.token === token);
      next();
    }
  ];
}
module.exports = authorize;
