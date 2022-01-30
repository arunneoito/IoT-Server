const mongoose = require("mongoose");

const { Schema } = mongoose;

const channelSchema = require("./channel.model");

const schema = new Schema({
  name: { type: String, required: true },
  channels: [channelSchema],
  createdAt: { type: String },
  updatedAt: { type: String },
});

module.exports = mongoose.model("DeviceType", schema);

// Device Types

// DeviceModel.create({
//   name: "NSWC_04",
//   channels: [
//     {
//       name: "Switch 1",
//       port: "12",
//       value_type: "boolean",
//       inout: false,
//       value: "false",
//     },
//     {
//       name: "Switch 2",
//       port: "13",
//       value_type: "boolean",
//       inout: false,
//       value: "false",
//     },
//     {
//       name: "Switch 3",
//       port: "14",
//       value_type: "boolean",
//       inout: false,
//       value: "false",
//     },
//     {
//       name: "Switch 4",
//       port: "16",
//       value_type: "boolean",
//       inout: false,
//       value: "false",
//     },
//   ],
//   createAt: Date(),
//   updatedAt: Date(),
// });
