const mongoose = require("mongoose");

const { Schema } = mongoose;

const schema = new Schema({
  email: { type: String, unique: true, required: true },
  passwordHash: { type: String, required: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  role: { type: String, required: true },
  verificationToken: String,
  verified: Date,
  resetToken: {
    token: String,
    expires: Date
  },
  keys: {
    secretKey: { type: String },
    createdAt: Date
  },
  passwordReset: Date,
  created: { type: Date, default: Date.now },
  updated: Date
});

schema.virtual("isVerified").get(function () {
  return !!(this.verified || this.passwordReset);
});

schema.set("toJSON", {
  virtuals: true,
  versionKey: false,
  transform(doc, ret) {
    // remove these props when object is serialized
    delete ret._id;
    delete ret.passwordHash;
  }
});

module.exports = mongoose.model("Account", schema);
