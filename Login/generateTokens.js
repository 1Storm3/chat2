const jwt = require("jsonwebtoken");
require("dotenv").config();

// генерация токенов для определенного имени
function generateAccessToken(user) {
  const secretKey = process.env.SECRET_KEY;
  const expiresIn = "15s";

  const token = jwt.sign({ user }, secretKey, { expiresIn });

  return token;
}

function generateRefreshToken(user) {
  const secretKey = process.env.REFRESH_SECRET_KEY;
  const expiresIn = "7d";

  const token = jwt.sign({ user }, secretKey, { expiresIn });

  return token;
}

module.exports = { generateAccessToken, generateRefreshToken };
