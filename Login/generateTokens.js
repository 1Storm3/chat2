const jwt = require("jsonwebtoken");
require("dotenv").config();

// генерация токенов для определенного имени
function generateAccessToken(username) {
  const secretKey = process.env.SECRET_KEY;
  const expiresIn = "15s";

  const token = jwt.sign({ username }, secretKey, { expiresIn });

  return token;
}

function generateRefreshToken(username) {
  const secretKey = process.env.REFRESH_SECRET_KEY;
  const expiresIn = "7d";

  const token = jwt.sign({ username }, secretKey, { expiresIn });

  return token;
}

module.exports = { generateAccessToken, generateRefreshToken };
