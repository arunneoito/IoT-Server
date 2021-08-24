const mongoose = require("mongoose");

const { Schema } = mongoose;

const schema = new Schema({
  account_id: { type: String, required: true },
  section_id: { type: String, required: true },
  name: { type: String, required: true },
  secret: { type: String, required: true },
  client_id: { type: String, required: false },
  connected: { type: Boolean, required: true },
  createdAt: { type: Date },
  updatedAt: { type: Date }
});

module.exports = mongoose.model("Device", schema);
