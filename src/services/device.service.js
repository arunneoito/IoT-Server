/* eslint-disable no-unused-vars */
const crypto = require("crypto");
const mongoose = require("mongoose");
const Sections = require("../models/section.model");
const Device = require("../models/device.model");
const DeviceType = require("../models/deviceTypes.model");
const { validateValue } = require("../../utils/helpers");

function createSecret() {
  const currentDate = new Date().valueOf().toString();
  const random = Math.random().toString();
  return crypto
    .createHash("sha1")
    .update(currentDate + random)
    .digest("hex");
}

async function createDevice({ user, name, sectionId }) {
  const section = await Sections.findOne({ _id: sectionId });
  if (!section) {
    throw new Error("invalid section id");
  }
  const newDevice = new Device({
    account_id: user.account.id,
    section_id: sectionId,
    name,
    connected: false,
    secret: createSecret(),
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  const device = await newDevice.save();
  return device;
}

async function updateDevice(update, deviceId) {
  if (!mongoose.isValidObjectId(deviceId)) return false;
  const device = await Device.findOneAndUpdate({ _id: deviceId }, update, {
    new: true,
  });
  return device;
}

async function findByIdAndSecret(id, secret) {
  if (!mongoose.isValidObjectId(id)) return null;
  const device = await Device.findOne({ _id: id, secret });
  return device;
}

async function findById(deviceId) {
  if (!mongoose.isValidObjectId(deviceId)) return null;
  const device = await Device.findOne({ _id: deviceId });
  return device;
}

async function updateSubscription(id, clientId, connected) {
  await Device.updateOne({ _id: id }, { client_id: clientId, connected });
}

async function getDeviceChannels({ user, device, name }) {
  const deviceChannel = await DeviceType.findOne({ name });
  if (!deviceChannel) {
    throw new Error("invalid device name provided");
  }
  const deviceUpdated = await Device.findOneAndUpdate(
    { _id: device.id },
    {
      $push: {
        channels: {
          $each: deviceChannel.channels,
        },
      },
    },
    { new: true }
  );
  return deviceUpdated;
}

async function addDeviceChannels({ user, deviceId, channels }) {
  channels.forEach((element) => {
    if (!validateValue(element.value, element.value_type)) {
      throw new Error("Invalid value for device value type");
    }
  });

  const device = await findById(deviceId);
  if (!device) throw new Error("Device not found!");
  if (device.account_id !== user.account.id) {
    throw new Error("User Not Authorized !");
  }
  await Device.updateOne(
    { _id: device.id },
    {
      $push: {
        channels: {
          $each: channels,
        },
      },
    }
  );
}

async function getUserDevices({ user, sectionId }) {
  const filter = { account_id: user.account.id };
  if (sectionId) filter.section_id = sectionId;
  const devices = await Device.find(filter);
  return devices;
}

async function deleteDevice(accountId, deviceId) {
  const types = await Device.deleteOne({
    _id: deviceId,
    account_id: accountId,
  });
  if (types.ok === 1 && types.deletedCount > 0) {
    return "Device Deleted";
  }
  return "No device found for this id !";
}
async function deleteChannel(accountId, deviceId, channelId) {
  if (
    !mongoose.isValidObjectId(deviceId) ||
    !mongoose.isValidObjectId(channelId)
  ) {
    throw new Error("not found");
  }
  const device = await Device.updateOne(
    {
      _id: deviceId,
      account_id: accountId,
    },
    {
      $pull: { channels: { _id: channelId } },
    }
  );
  return device.nModified > 0
    ? "Channle Deleted"
    : "No device found for this id !";
}

async function updateChannel(deviceId, channelId, value) {
  const updated = await Device.findOneAndUpdate(
    {
      _id: deviceId,
      "channels._id": channelId,
    },
    {
      $set: { "channels.$.value": value },
    },
    { new: true }
  );
  return updated;
}

module.exports = {
  createDevice,
  findByIdAndSecret,
  updateSubscription,
  getUserDevices,
  findById,
  addDeviceChannels,
  deleteDevice,
  updateDevice,
  deleteChannel,
  updateChannel,
  getDeviceChannels,
};
