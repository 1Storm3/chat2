// Создание токенов и сохранение их в базу данных
const {
  generateAccessToken,
  generateRefreshToken,
} = require("./generateTokens");
const saveTokensDB = require("./saveTokensDB");

async function handleLogin(req, res, username) {
  const user_id = req.result.rows[0].id;
  const accessToken = generateAccessToken(username);
  const refreshToken = generateRefreshToken(username);
  const sessionStart = new Date();
  const sessionEnd = new Date(Date.now() + 15 * 1000);

  const tokensSaved = await saveTokensDB(
    user_id,
    accessToken,
    refreshToken,
    sessionStart,
    sessionEnd
  );

  if (tokensSaved) {
    res.cookie("access_token", accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
    });

    res.status(200).json({ message: "true" });
  }
}

module.exports = handleLogin;
