/* eslint-disable no-use-before-define */

const express = require("express");
const Joi = require("joi");
const authorize = require("../middlewares/auth.middleware");
const validateRequest = require("../middlewares/validation.middleware");
const deviceService = require("../services/device.service");

const router = express.Router();

router.post("/create", authorize(), deviceSchema, createDevice);
router.post("/getUserDevices", authorize(), getUserDevices);

function createDevice(req, res, next) {
  deviceService.createDevice({ user: req.user, ...req.body })
    .then((d) => {
      res.status(200).send({ message: "Created Succesfully", data: d, error: false });
    })
    .catch((e) => {
      next(e);
    });
}

function getUserDevices(req, res, next) {
  deviceService.getUserDevices({ user: req.user, ...req.body })
    .then((d) => {
      res.status(200).send({ message: "Succes", data: d, error: false });
    })
    .catch((e) => {
      next(e);
    });
}

function deviceSchema(req, res, next) {
  const schema = Joi.object({
    name: Joi.string().required(),
    sectionId: Joi.string().required()
  });
  validateRequest(req, next, schema);
}
module.exports = router;
