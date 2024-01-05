// регистрация пользователя через добавление в базу данных
const metautil = require("metautil");
const generateUniqueToken = require("./generateUniqueToken");
const pool = require("../db");
const sendConfirmationEmail = require("./sendMail");

const registerUser = async (req, res) => {
  const { username, password } = req.body;
  const hash = await metautil.hashPassword(password);

  res.setHeader("Access-Control-Allow-Origin", "*");
  try {
    const checkUser = "SELECT * FROM users WHERE username = $1";
    const existUser = await pool.query(checkUser, [username]);

    if (existUser.rows.length > 0) {
      return res.status(400).json("user exist");
    }
    // const confirmationToken = generateUniqueToken();

    // sendConfirmationEmail(email, confirmationToken);

    const query = "INSERT INTO users(username, password) VALUES ($1, $2)";

    await pool.query(query, [username, hash]);

    return res.json("1");
  } catch (error) {
    console.error("error:", error);
    throw error;
  }
};

module.exports = registerUser;
