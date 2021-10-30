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
  getUsers,
  getHashedPassword,
  softDeleteUser,
  getCompanyAndUser,
} = require("../services/UserService");

router.post("/create-superadmin", async (req, res) => {
  const isExisted = await isUserExisted(req.body.appid, req.body.userid);
  if (isExisted) {
    return res
      .status(400)
      .json({ code: 400, message: "User already existed." });
  }
  const user = await createUser({
    ...req.body,
    role: "superadmin",
  });

  return res.json({
    code: 200,
    message: "User created successful.",
    data: user,
  });
});

router.post("/users", isAuth, async (req, res) => {
  try {
    if (
      (req.tokenData.role == "admin" &&
        ["admin", "superadmin"].includes(req.body.role)) ||
      req.tokenData.role == "normaluser"
    ) {
      return res.status(401).json({ code: 401, message: "Unauthorized." });
    }
    const isExisted = await isUserExisted(req.tokenData.appid, req.body.userid);
    if (isExisted) {
      return res
        .status(400)
        .json({ code: 400, message: "User already existed." });
    }
    const body = req.body;
    if (req.tokenData.role == "admin") {
      body.companyid = req.tokenData.companyid;
    }
    const user = await createUser({
      ...body,
      appid: req.tokenData.appid,
    });

    return res.json({
      code: 200,
      message: "User created successful.",
      data: user,
    });
  } catch (err) {
    console.log(err);
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
        otpsession: "",
        code: 200,
        message: "Successful.",
        token,
        profile: user.profile,
      });
    }
  } catch (err) {
    console.log(err);
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
    console.log(err);
    res.status(500).json({ code: 500, message: "Internal Server Error" });
  }
});

router.get("/users", isAuth, async (req, res) => {
  try {
    if (req.tokenData.role == "normaluser") {
      return res.status(401).json({ code: 401, message: "Unauthorized." });
    }
    const usersData = await getUsers(req.query, req.tokenData);
    return res.json({
      ...usersData,
      code: 200,
      message: "Successful.",
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ code: 500, message: "Internal Server Error" });
  }
});

router.get("/users/:userid", isAuth, async (req, res) => {
  try {
    if (req.tokenData.role == "normaluser") {
      return res.status(401).json({ code: 401, message: "Unauthorized." });
    }
    const user = await getUser(req.tokenData.appid, req.params.userid);
    if (!user) {
      return res.status(404).json({
        message: "User not found.",
        code: 404,
      });
    }
    return res.json({
      data: user,
      code: 200,
      message: "Successful.",
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ code: 500, message: "Internal Server Error" });
  }
});

router.put("/users/:userid", isAuth, async (req, res) => {
  try {
    if (
      req.tokenData.role == "normaluser" ||
      (req.tokenData.role == "admin" && req.body.role == "superadmin")
    ) {
      return res.status(401).json({ code: 401, message: "Unauthorized." });
    }
    const user = await getUser(req.tokenData.appid, req.params.userid);
    if (!user) {
      return res.status(404).json({
        message: "User not found.",
        code: 404,
      });
    }
    user.userid = req.body.userid;
    user.username = req.body.username;
    user.companyname = req.body.companyname;
    user.password = await getHashedPassword(req.body.password);
    user.otpservice = req.body.otpservice;
    user.role = req.body.role;
    user.accountstatus = req.body.accountstatus;
    user.contactinfo = req.body.contactinfo;
    user.contactperson = req.body.contactperson;
    user.profile = req.body.profile;
    if (req.tokenData.role == "superadmin") {
      user.companyid = req.body.companyid;
    }

    await user.save();

    return res.json({
      data: req.params.userid,
      code: 200,
      message: "User updated successful.",
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ code: 500, message: "Internal Server Error" });
  }
});

router.delete("/users/:userid", isAuth, async (req, res) => {
  try {
    if (req.tokenData.role == "normaluser") {
      return res.status(401).json({ code: 401, message: "Unauthorized." });
    }
    const deleted = await softDeleteUser(
      req.tokenData.appid,
      req.params.userid
    );
    if (!deleted) {
      return res.status(404).json({
        code: 404,
        message: "User not found.",
      });
    }
    return res.json({
      code: 204,
      message: "No Content.",
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ code: 500, message: "Internal Server Error" });
  }
});

router.get("/company-and-user", isAuth, async (req, res) => {
  try {
    if (req.tokenData.role == "normaluser") {
      return res.status(401).json({ code: 401, message: "Unauthorized." });
    }
    const users = await getCompanyAndUser(
      req.tokenData.appid,
      req.tokenData.companyid,
      req.tokenData.role
    );
    const data = [];
    for (const user of users) {
      const com = data.find((d) => d.companyid == user.companyid);
      if (com) {
        com.users.push({
          userid: user.userid,
          username: user.username,
        });
      } else {
        data.push({
          companyid: user.companyid,
          companyname: user.companyname,
          users: [],
        });
      }
    }
    return res.json({
      data,
      code: 200,
      message: "Successful.",
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ code: 500, message: "Internal Server Error" });
  }
});

module.exports = router;
