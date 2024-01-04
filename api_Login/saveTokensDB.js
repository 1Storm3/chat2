const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    require: true,
  },
});
// const pool = new Pool({
//   user: "storm",
//   host: "localhost",
//   database: "test",
//   password: "meepo2014",
//   port: 5432,
// });
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
