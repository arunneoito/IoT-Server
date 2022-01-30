const mongoose = require("mongoose");
const { deviceUpdated } = require("../events/device.events");
const channelSchema = require("./channel.model");

const { Schema } = mongoose;

const schema = new Schema({
  account_id: { type: String, required: true },
  section_id: { type: String, required: true },
  name: { type: String, required: true },
  secret: { type: String, required: true },
  client_id: { type: String, required: false },
  connected: { type: Boolean, required: true },
  channels: [channelSchema],
  createdAt: { type: Date },
  updatedAt: { type: Date },
});

schema.post("findOneAndUpdate", deviceUpdated);

module.exports = mongoose.model("Device", schema);
