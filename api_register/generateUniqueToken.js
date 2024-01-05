const crypto = require("crypto");

function generateUniqueToken() {
  const token = crypto.randomBytes(32).toString("hex"); // 32 байта в шестнадцатеричном формате
  return token;
}

module.exports = generateUniqueToken;
