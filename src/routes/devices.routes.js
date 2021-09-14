/* eslint-disable no-use-before-define */

const express = require("express");
const Joi = require("joi");
const mongoose = require("mongoose");
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

router.post("/updateChannel", authorize(), sendMsgSchema, sendMessageToDevice);
router.put("/update/:device_id", authorize(), updateDevice);

router.delete("/delete/:device_id", authorize(), deleteDevice);

function createDevice(req, res, next) {
  deviceService
    .createDevice({ user: req.user, ...req.body })
    .then((d) => {
      res
        .status(200)
        .send({ message: "Created Succesfully", data: d, error: false });
    })
    .catch((e) => {
      next(e);
    });
}

function getUserDevices(req, res, next) {
  deviceService
    .getUserDevices({ user: req.user, ...req.body })
    .then((d) => {
      res.status(200).send({ message: "Success", data: d, error: false });
    })
    .catch((e) => {
      next(e);
    });
}

function addDeviceChannel(req, res, next) {
  deviceService
    .addDeviceChannel({ user: req.user, ...req.body })
    .then((d) => {
      res.status(200).send({ message: "Success", data: d, error: false });
    })
    .catch(next);
}

function deleteDevice(req, res, next) {
  if (!req.params.device_id) throw new Error("Invalid REquest");
  deviceService
    .deleteDevice(req.user.id, req.params.device_id)
    .then((d) => {
      res.status(200).send({ message: d, error: false });
    })
    .catch(next);
}

function updateDevice(req, res, next) {
  if (!mongoose.isValidObjectId(req.params.device_id)) {
    throw new Error("Invalid device id !");
  }
  const { name } = req.body;
  if (!name) {
    throw new Error("Invalid Request ! update parameters missing");
  }
  deviceService
    .updateSection({
      user: req.user,
      name,
      sectionId: req.params.section_id
    })
    .then((d) => {
      res.status(d ? 200 : 404).send({
        message: d ? "Section Updated" : "Section Not Found !",
        error: false
      });
    })
    .catch((e) => {
      next(e);
    });
}
async function sendMessageToDevice(req, res, next) {
  try {
    const { message, deviceId } = req.body;
    const device = await deviceService.findById(deviceId);
    if (!device) throw new Error("Invalid Device Id");
    if (!device.connected) throw new Error("Device Offline");
    mqttService.publishToTopic(helpers.getDeviceTopic(device), message);
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
    message: Joi.object().required(),
    deviceId: Joi.string().required()
  });
  validateRequest(req, next, schema);
}

function channelSchema(req, res, next) {
  const schema = Joi.object({
    type: Joi.string().required(),
    value: Joi.string().required(),
    name: Joi.string().required(),
    port: Joi.number().require(),
    deviceId: Joi.string().required()
  });
  validateRequest(req, next, schema);
}

module.exports = router;
