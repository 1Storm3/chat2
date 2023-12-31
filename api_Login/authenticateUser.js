const metautil = require("metautil");
const pool = require("../db");

// Поиск пользователя в базе данных и валидация введенного пароля
async function authenticateUser(username, password) {
  const query = "SELECT * FROM users WHERE username = $1";
  const result = await pool.query(query, [username]);

  const isAuthenticated =
    result.rows.length > 0 &&
    (await metautil.validatePassword(password, result.rows[0].password));

  return { isAuthenticated, user: result.rows[0] };
}

module.exports = authenticateUser;
