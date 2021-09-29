const mongoose = require("mongoose");
const { deviceUpdated } = require("../events/device.events");

const { Schema } = mongoose;

const channelSchema = new Schema({
  value: { type: Schema.Types.Mixed, required: false },
  name: { type: String, required: true },
  port: { type: Number, required: true },
  inout: { type: Boolean, required: true }, // if port is input inout = true otherwise false
  value_type: { type: String, required: true }, // string | number | boolean
});

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
schema.post("updateOne", deviceUpdated);

module.exports = mongoose.model("Device", schema);
