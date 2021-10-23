const { Schema, model } = require("mongoose");
const { RequiredString } = require("../constants/mongoose-types");

const otpSchema = new Schema(
  {
    otpcode: RequiredString,
    expiredat: {
      type: Date,
      required: true,
    },
    appid: RequiredString,
    userid: RequiredString,
    status: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

module.exports = model("Otp", otpSchema);
