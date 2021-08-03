const nodemailer = require("nodemailer");

module.exports = sendEmail;

async function sendEmail({ to, subject, html, from }) {
  let testAccount = await nodemailer.createTestAccount();

  let config = {
    emailFrom: "iotplatform@arun.com",
    smtpOptions: {
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user, // generated ethereal user
        pass: testAccount.pass // generated ethereal password
      }
    }
  };
  const transporter = nodemailer.createTransport(config.smtpOptions);
  let info = await transporter.sendMail({
    emailFrom: from || config.emailFrom,
    to,
    subject,
    html
  });
  console.log("Message sent: %s", info.messageId);
}
