/* eslint-disable no-use-before-define */

const express = require("express");
const Joi = require("joi");
const authorize = require("../middlewares/auth.middleware");
const validateRequest = require("../middlewares/validation.middleware");
const deviceService = require("../services/device.service");
const mqttService = require("../services/mqtt.services");
const helpers = require("../../utils/helpers");

const router = express.Router();

router.post("/create", authorize(), deviceSchema, createDevice);
router.post("/getUserDevices", authorize(), getUserDevices);
router.post("/createChannel", authorize(), channelSchema, addDeviceChannel);
router.post("/sendToDevice", authorize(), sendMsgSchema, sendMessageToDevice);

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
      res.status(200).send({ message: "Success", data: d, error: false });
    })
    .catch((e) => {
      next(e);
    });
}

function addDeviceChannel(req, res, next) {
  deviceService.addDeviceChannel({ user: req.user, ...req.body }).then((d) => {
    res.status(200).send({ message: "Success", data: d, error: false });
  }).catch(next);
}

async function sendMessageToDevice(req, res, next) {
  try {
    const { message, deviceId } = req.body;
    const device = await deviceService.findById(deviceId);
    if (!device) throw new Error("Invalid Device Id");
    if (!device.connected) throw new Error("Device Offline");
    mqttService.publishToTopic(helpers.getDeviceTopic(device), { message });
    res.status(200).send({ message: "Message sent", error: false });
  } catch (error) {
    next(error);
  }
}

function deviceSchema(req, res, next) {
  const schema = Joi.object({
    name: Joi.string().required(),
    sectionId: Joi.string().required()
  });
  validateRequest(req, next, schema);
}

function sendMsgSchema(req, res, next) {
  const schema = Joi.object({
    message: Joi.string().required(),
    deviceId: Joi.string().required()
  });
  validateRequest(req, next, schema);
}

function channelSchema(req, res, next) {
  const schema = Joi.object({
    type: Joi.string().required(),
    value: Joi.string().required(),
    name: Joi.string().required(),
    deviceId: Joi.string().required()
  });
  validateRequest(req, next, schema);
}

module.exports = router;
