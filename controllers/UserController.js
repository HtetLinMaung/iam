const express = require("express");
const isAuth = require("../middlewares/is-auth");
const router = express.Router();

const {
  checkCredential,
  sendOtp,
  createUser,
  checkOtp,
  generateToken,
  checkToken,
  isUserExisted,
  getUser,
  resendOtp,
  isOtpExist,
} = require("../services/UserService");

router.post("/create-superadmin", async (req, res) => {
  const isExisted = await isUserExisted(req.body.appid, req.body.userid);
  if (isExisted) {
    return res
      .status(400)
      .json({ code: 400, message: "User already existed." });
  }
  const user = await createUser({
    appid: req.body.appid,
    userid: req.body.userid,
    password: req.body.password,
    companyid: req.body.companyid,
    username: req.body.username,
    companyname: req.body.companyname,
    otpservice: req.body.otpservice,
    role: "superadmin",
  });

  return res.json({
    code: 200,
    message: "User created successful.",
    data: user,
  });
});

router.post("/create-user", isAuth, async (req, res) => {
  try {
    if (
      (req.tokenData.role == "admin" &&
        ["admin", "superadmin"].includes(req.body.role)) ||
      req.tokenData.role == "normaluser"
    ) {
      return res.status(401).json({ code: 401, message: "Unauthorized." });
    }
    const isExisted = await isUserExisted(req.body.appid, req.body.userid);
    if (isExisted) {
      return res
        .status(400)
        .json({ code: 400, message: "User already existed." });
    }
    const user = await createUser({
      appid: req.body.appid,
      userid: req.body.userid,
      password: req.body.password,
      companyid: req.body.companyid,
      username: req.body.username,
      companyname: req.body.companyname,
      otpservice: req.body.otpservice,
      role: req.body.role,
    });

    return res.json({
      code: 200,
      message: "User created successful.",
      data: user,
    });
  } catch (err) {
    res.status(500).json({ code: 500, message: "Internal Server Error" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { success, message } = await checkCredential(
      req.body.appid,
      req.body.userid,
      req.body.password
    );
    if (!success) {
      return res.status(401).json({
        code: 401,
        message,
      });
    }
    const user = await getUser(req.body.appid, req.body.userid);
    if (user.otpservice != "none") {
      const otp = await sendOtp(
        req.body.appid,
        req.body.userid,
        user.otpservice
      );

      return res.json({
        otpsession: otp._id,
        code: 200,
        message: "Successful.",
        token: "",
      });
    } else {
      const { success, message, token } = await generateToken(
        req.body.appid,
        req.body.userid
      );
      if (!success) {
        return res.status(401).json({
          code: 401,
          message,
        });
      }
      return res.json({
        otpsession: otp._id,
        code: 200,
        message: "Successful.",
        token,
      });
    }
  } catch (err) {
    res.status(500).json({ code: 500, message: "Internal Server Error" });
  }
});

router.post("/resend-otp", async (req, res) => {
  try {
    const existed = await isOtpExist(req.body.otpsession);
    if (!existed) {
      return res.status(401).json({
        code: 401,
        message: "Unauthorized.",
      });
    }
    const otp = await resendOtp(req.body.appid, req.body.userid);
    return res.json({
      otpsession: otp._id,
      code: 200,
      message: "Successful.",
    });
  } catch (err) {
    res.status(500).json({ code: 500, message: "Internal Server Error" });
  }
});

router.post("/check-otp", async (req, res) => {
  try {
    const isOtpAuth = await checkOtp(req.body.otpcode, req.body.otpsession);
    if (!isOtpAuth) {
      return res.status(401).json({
        code: 401,
        message: "Invalid OTP.",
      });
    }
    const { success, message, token } = await generateToken(
      req.body.appid,
      req.body.userid
    );
    if (!success) {
      return res.status(400).json({
        code: 400,
        message,
      });
    }
    return res.json({
      code: 200,
      message: "Successful.",
      token,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ code: 500, message: "Internal Server Error" });
  }
});

router.post("/check-token", async (req, res) => {
  try {
    const { success, message, data } = await checkToken(req.body.token);
    if (!success) {
      return res.status(401).json({
        code: 401,
        message,
        data,
      });
    }
    return res.json({
      code: 200,
      message: "Successful.",
      data,
    });
  } catch (err) {
    res.status(500).json({ code: 500, message: "Internal Server Error" });
  }
});

module.exports = router;
