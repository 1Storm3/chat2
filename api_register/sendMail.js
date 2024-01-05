const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  service: "gmail",
  port: 587,
  secure: false,
  auth: {
    user: "chaoschatix@gmail.com",
    pass: "meepo2014",
  },
});

// Функция для отправки письма с токеном
function sendConfirmationEmail(email, token) {
  const mailOptions = {
    from: "chaoschatix@gmail.com", // замените на вашу почту
    to: email,
    subject: "Подтверждение регистрации",
    text: `Пожалуйста, перейдите по ссылке для завершения регистрации: http://localhost:3000/confirm?token=${token}`,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error("Ошибка при отправке письма:", error);
    } else {
      console.log("Письмо с токеном отправлено: ", info.response);
    }
  });
}

module.exports = sendConfirmationEmail;
