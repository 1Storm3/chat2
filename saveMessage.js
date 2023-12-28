const { Pool } = require("pg");
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    require: true,
  },
});

async function saveMessage(data) {
  const { message, time, username } = data;
  const newMessages = await pool.query(
    "INSERT INTO messages (message, username, timedata) values ($1, $2, $3) RETURNING *",
    [message, username, time]
  );
  res.json(newMessages.rows[0]);
}

module.exports = saveMessage;
