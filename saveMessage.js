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

async function saveMessage(data) {
  const { message, time, user } = data;
  await pool.query(
    "INSERT INTO messages (message, username, timedata, room) values ($1, $2, $3, $4) RETURNING *",
    [message, user.name, time, user.room]
  );
}

module.exports = saveMessage;
