const pool = require("../db");

async function saveTokensDB(
  user_id,
  accessToken,
  refreshToken,
  sessionStart,
  sessionEnd
) {
  try {
    await pool.query(
      "INSERT INTO tokens (user_id, token, refresh_token, session_start, session_end) VALUES ($1, $2, $3, $4, $5)",
      [user_id, accessToken, refreshToken, sessionStart, sessionEnd]
    );
    return true;
  } catch (error) {
    console.error("Ошибка при сохранении токенов:", error);
    return false;
  }
}

module.exports = saveTokensDB;
