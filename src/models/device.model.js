const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const schema = new Schema({
  account_id: { type: String, required: true },
  section_id: { type: String, required: true },
  name: { type: String, required: true },
  createdAt: { type: Date },
  updatedAt: { type: Date }
});

module.exports = mongoose.model("Device", schema);
