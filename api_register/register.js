// регистрация пользователя через добавление в базу данных
const { Pool } = require("pg");
const metautil = require("metautil");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    require: true,
  },
});

const registerUser = async (req, res) => {
  const { username, password } = req.body;
  const hash = await metautil.hashPassword(password);
  try {
    const query = "INSERT INTO users(username, password) VALUES ($1, $2)";
    await pool.query(query, [username, hash]);
  } catch (error) {
    console.error("error:", error);
    throw error;
  }
};

module.exports = registerUser;
