const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const schema = new Schema({
  name: { type: String, required: true },
  typeId: { type: String, required: true },
  account_id: { type: String, required: true },
  createdAt: { type: String },
  updatedAt: { type: String }
});

module.exports = mongoose.model("Section", schema);
