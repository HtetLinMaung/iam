const moment = require("moment");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const Otp = require("../models/Otp");
const User = require("../models/User");

const { sendMail } = require("../utils/mail-utils");

const create6RandomDigits = () => Math.floor(100000 + Math.random() * 900000);

exports.getUser = async (appid, userid) => {
  const user = await User.findOne({ appid, userid });
  return user;
};

exports.sendOtp = async (appid, userid, otpservice) => {
  const otp = new Otp({
    otpcode: create6RandomDigits(),
    appid,
    userid,
    expiredat: moment().add(2, "minutes").toISOString(),
  });
  await otp.save();
  if (otpservice == "email") {
    sendMail(userid, "Otp", `<h1>${otp.otpcode}</h1>`);
  }
  return otp;
};

exports.isOtpExist = async (otpsession) => {
  const otp = await Otp.findById(otpsession);
  if (!otp) {
    return false;
  }
  otp.status = 2;
  otp.save();
  return true;
};

exports.resendOtp = async (appid, userid) => {
  const user = await User.findOne({ userid });
  otp = await this.sendOtp(appid, userid, user.otpservice);
  return otp;
};

exports.isUserExisted = async (appid, userid) => {
  const user = await User.findOne({ appid, userid });

  if (!user) {
    return false;
  }
  return true;
};

exports.createUser = async (user) => {
  const hashedPwd = await bcrypt.hash(user.password, 12);
  const newuser = new User({ ...user, password: hashedPwd });
  await newuser.save();
  return newuser;
};

exports.checkCredential = async (appid, userid, password) => {
  const user = await User.findOne({ appid, userid });
  if (!user) {
    return {
      success: false,
      message: "Userid does not exist.",
    };
  }
  const passwordMatched = await bcrypt.compare(password, user.password);
  if (!passwordMatched) {
    return {
      success: false,
      message: "Password is incorrect.",
    };
  }
  return {
    success: true,
    message: "Successful.",
  };
};

exports.checkOtp = async (otpcode, otpsession) => {
  const otp = await Otp.findOne({
    otpcode,
    _id: otpsession,
    status: 0,
    expiredat: {
      $gt: new Date().toISOString(),
    },
  });
  if (!otp) {
    return false;
  }
  otp.status = 1;
  await otp.save();
  return true;
};

exports.generateToken = async (appid, userid) => {
  const user = await User.find({ appid, userid });
  if (!user) {
    return {
      success: false,
      message: "Generating token failed.",
      token: "",
    };
  }
  const token = jwt.sign(
    {
      userid,
      appid,
      role: user.role,
    },
    process.env.SECRET || "secret",
    {
      expiresIn: "1d",
    }
  );
  return { success: true, message: "Successful.", token };
};

exports.checkToken = async (token) => {
  try {
    const decodedToken = jwt.verify(token, process.env.SECRET);
    if (!decodedToken) {
      return {
        message: "Invalid Token.",
        success: false,
        data: null,
      };
    }
    const user = await User.find({
      appid: decodedToken.appid,
      userid: decodedToken.userid,
    });
    return {
      message: "Successful.",
      success: true,
      data: {
        userid: user.userid,
        companyid: user.companyid,
        username: user.username,
        companyname: user.companyname,
      },
    };
  } catch (err) {
    return {
      message: "Invalid Token.",
      success: false,
      data: null,
    };
  }
};
