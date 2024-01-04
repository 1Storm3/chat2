// регистрация пользователя через добавление в базу данных
const { Pool } = require("pg");
const metautil = require("metautil");

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

const registerUser = async (req, res) => {
  const { username, password } = req.body;
  const hash = await metautil.hashPassword(password);
  res.setHeader("Access-Control-Allow-Origin", "*");
  try {
    const query = "INSERT INTO users(username, password) VALUES ($1, $2)";
    await pool.query(query, [username, hash]);
    return res.json("1");
  } catch (error) {
    console.error("error:", error);
    throw error;
  }
};

module.exports = registerUser;
