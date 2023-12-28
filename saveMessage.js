const { Pool } = require("pg");
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    require: true,
  },
});

async function saveMessage(data) {
  const { message, time, username } = data;
  await pool.query(
    "INSERT INTO messages (message, username, timedata, room) values ($1, $2, $3, $4) RETURNING *",
    [message, username.name, time, username.room]
  );
}

module.exports = saveMessage;
