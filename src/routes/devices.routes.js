/* eslint-disable no-underscore-dangle */
/* eslint-disable no-use-before-define */

const express = require("express");
const Joi = require("joi");
const mongoose = require("mongoose");
const authorize = require("../middlewares/auth.middleware");
const validateRequest = require("../middlewares/validation.middleware");
const deviceService = require("../services/device.service");
const mqttService = require("../services/mqtt.services");
const helpers = require("../../utils/helpers");
const { deviceApiAuth } = require("../middlewares/mqtt.middleware");

const router = express.Router();

router.post("/create", authorize(), deviceSchema, createDevice);
router.post("/getUserDevices", authorize(), getUserDevices);
// router.post("/createChannel", deviceApiAuth(), channelSchema, addDeviceChannel);

// get channels with Device ID and Device Secret, create and return channels for new devices
router.get(
  "/getChannels",
  deviceApiAuth(),
  getChannelSchema,
  getDeviceChannels
);

router.post("/sendToDevice", authorize(), sendMsgSchema, sendMessageToDevice);
router.post(
  "/updateChannel",
  authorize(),
  updateChannelSchema,
  updateDeviceChannel
);
router.put("/update/:device_id", authorize(), updateDevice);
router.delete("/delete/:device_id", authorize(), deleteDevice);
router.delete(
  "/deleteChannel/:deviceId/:channelId",
  authorize(),
  deleteChannel
);

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

function getDeviceChannels(req, res, next) {
  deviceService
    .getDeviceChannels({
      user: req.user,
      device: req.device,
      name: req.headers.name,
    })
    .then((d) => {
      res.status(200).send({ message: "Success", data: d, error: false });
    })
    .catch(next);
}

// eslint-disable-next-line no-unused-vars
function addDeviceChannel(req, res, next) {
  deviceService
    .addDeviceChannels({ user: req.user, ...req.body })
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

function deleteChannel(req, res, next) {
  if (!req.params.deviceId) {
    throw new Error("Invalid Request , require deviceId");
  }
  if (!req.params.channelId) {
    throw new Error("Invalid Request , require channelId");
  }
  const { deviceId, channelId } = req.params;
  deviceService
    .deleteChannel(req.user.id, deviceId, channelId)
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
    .updateDevice({ name }, req.params.device_id)
    .then((d) => {
      res.status(d ? 200 : 404).send({
        message: d ? "Device Updated" : "Device Not Found !",
        error: false,
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

async function updateDeviceChannel(req, res, next) {
  try {
    const { deviceId, channelId, value } = req.body;
    const device = await deviceService.findById(deviceId);
    if (!device) throw new Error("Invalid Device Id");
    const channel = device.channels.find((d) => channelId === d._id.toString());
    if (!channel) throw new Error("Invalid channel Id");
    if (!helpers.validateValue(value, channel.value_type)) {
      throw new Error("Invalid value for device value type");
    }
    const updated = await deviceService.updateChannel(
      deviceId,
      channelId,
      value
    );
    res
      .status(200)
      .send({ message: "Message sent", data: updated, error: false });
  } catch (error) {
    console.log(error);
    next(error);
  }
}

function deviceSchema(req, res, next) {
  const schema = Joi.object({
    name: Joi.string().required(),
    sectionId: Joi.string().required(),
  });
  validateRequest(req, next, schema);
}

function sendMsgSchema(req, res, next) {
  const schema = Joi.object({
    message: Joi.object().required(),
    deviceId: Joi.string().required(),
  });
  validateRequest(req, next, schema);
}

function updateChannelSchema(req, res, next) {
  const schema = Joi.object({
    channelId: Joi.string().required(),
    deviceId: Joi.string().required(),
    value: Joi.any().required(),
  });
  validateRequest(req, next, schema);
}

function getChannelSchema(req, res, next) {
  const schema = Joi.object({
    name: Joi.string().required(),
  });
  validateRequest(req, next, schema);
}

// function channelSchema(req, res, next) {
//   const channel = Joi.object().keys({
//     value: Joi.any().required(),
//     name: Joi.string().required(),
//     port: Joi.number().required(),
//     inout: Joi.boolean().required(),
//     value_type: Joi.string().valid("string", "boolean", "number"),
//   });

//   const schema = Joi.object({
//     channels: Joi.array().items(channel).required(),
//     deviceId: Joi.string().required(),
//   });

//   validateRequest(req, next, schema);
// }

module.exports = router;
