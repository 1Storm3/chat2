const metautil = require("metautil");

// Поиск пользователя в базе данных и валидация введенного пароля
async function authenticateUser(username, password) {
  const query = "SELECT * FROM users WHERE username = $1";
  const result = await pool.query(query, [username]);
  return (
    result.rows.length > 0 &&
    (await metautil.validatePassword(password, result.rows[0].password))
  );
}

module.exports = authenticateUser;
