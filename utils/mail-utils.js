const nodemailer = require("nodemailer");

exports.sendMail = async (to, subject, html) => {
  const transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to,
    subject,
    html,
  };

  const info = await transporter.sendMail(mailOptions);
  console.log(info.response);
  return info;
};
