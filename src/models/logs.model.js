const mongoose = require("mongoose");

const { Schema } = mongoose;

const schema = new Schema({
  name: { type: String, required: true },
  info: { type: String, required: true },
  account_id: { type: String, required: true },
  device_id: { type: String, required: true },
  action_type: { type: String, required: true },
  createdAt: { type: String },
  updatedAt: { type: String },
});

module.exports = mongoose.model("Logs", schema);
