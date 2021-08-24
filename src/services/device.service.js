const crypto = require('crypto');
const Sections = require("../models/section.model");
const Device = require("../models/device.model");

function createSecret() {
  const currentDate = (new Date()).valueOf().toString();
  const random = Math.random().toString();
  return crypto.createHash('sha1').update(currentDate + random).digest('hex');
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
    updatedAt: new Date()
  });
  const device = await newDevice.save();
  return device;
}

async function findByIdAndSecret(id, secret) {
  const device = await Device.findOne({ _id: id, secret });
  return device;
}

async function updateSubscription(id, clientId, connected) {
  await Device.updateOne({ _id: id }, { client_id: clientId, connected });
}

async function getUserDevices({ user, sectionId }) {
  const filter = { account_id: user.account.id };
  if (sectionId) filter.section_id = sectionId;
  const devices = await Device.find(filter);
  return devices;
}

module.exports = {
  createDevice, findByIdAndSecret, updateSubscription, getUserDevices
};
