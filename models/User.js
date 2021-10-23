const { Schema, model } = require("mongoose");
const { RequiredString } = require("../constants/mongoose-types");

const userSchema = new Schema(
  {
    appid: RequiredString,
    companyid: RequiredString,
    companyname: RequiredString,
    userid: RequiredString,
    username: RequiredString,
    password: RequiredString,
    otpservice: {
      ...RequiredString,
      enum: ["email", "mobile", "none"],
      default: "email",
    },
    role: {
      ...RequiredString,
      enum: ["admin", "normaluser", "superadmin"],
      default: "normaluser",
    },
    accountstatus: {
      ...RequiredString,
      enum: ["freeze", "active", "inactive"],
      default: "active",
    },
  },
  { timestamps: true }
);

module.exports = model("User", userSchema);
