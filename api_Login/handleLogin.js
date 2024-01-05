// Создание токенов и сохранение их в базу данных

const {
  generateAccessToken,
  generateRefreshToken,
} = require("./generateTokens");
const saveTokensDB = require("./saveTokensDB");

async function handleLogin(req, res, user) {
  const user_id = user.id;
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);
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

    res.status(200).json({ message: "true" }, { access_token: accessToken });
  }
}

module.exports = handleLogin;
