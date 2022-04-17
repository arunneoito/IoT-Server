const accountService = require("../services/authentication.service");
const authenticationService = require("../services/authentication.service");

const {
  google_client_id,
  google_client_secret,
  google_redirect_url,
} = require("../../config.json");

const validateRequest = ({ redirect_uri, client_id, client_secret }) => {
  return (
    client_id !== google_client_id ||
    client_secret !== google_client_secret ||
    redirect_uri !== google_redirect_url
  );
};

exports.googelAccountLlink = async (req, res) => {
  const grantType = req.query.grant_type
    ? req.query.grant_type
    : req.body.grant_type;

  const secondsInDay = 900;
  const HTTP_STATUS_OK = 200;

  let token;

  if (grantType === "authorization_code") {
    if (validateRequest(req.body)) {
      res.status(400).send({ error: "invalid_grant" });
      return;
    }

    const { code } = req.body;

    const user = await authenticationService.getUserByJwt(code);

    if (!user) {
      console.log("user not found or invalid token");
      res.status(400).send({ error: "invalid_request" });
      return;
    }

    token = {
      access_token: accountService.generateJwtToken(user, "15m", "access"),
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
      console.log("user not found or invalid token");
      res.status(404).send({ error: "user not found" });
      return;
    }

    token = {
      access_token: accountService.generateJwtToken(user, "15m", "access"),
    };
  }

  res
    .status(HTTP_STATUS_OK)
    .json({ ...token, expires_in: secondsInDay, token_type: "Bearer" });
};
