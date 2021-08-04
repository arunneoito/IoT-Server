const express = require("express");
const router = express.Router();
const authorize = require("../middlewares/auth.middleware");
const validateRequest = require("../middlewares/validation.middleware");

router.post("/create", sectionSchema, authorize(), (req, res) => {
  res.send("express server test pass");
});

function sectionSchema(req, res, next) {
  const schema = Joi.object({
    name: Joi.string().required(),
    typeId: Joi.string().required()
  });
  validateRequest(req, next, schema);
}

module.exports = router;
