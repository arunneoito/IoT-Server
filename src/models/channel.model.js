const mongoose = require("mongoose");

const { Schema } = mongoose;

module.exports = new Schema({
  value_type: { type: String, required: true },
  value: { type: String, required: false },
  name: { type: String, required: true },
  port: { type: Number, required: true },
  inout: { type: Boolean, required: true },
});
