const { Pool } = require("pg");
const moment = require("moment");
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
  const currentDate = new Date().toISOString().slice(0, 10);
  const dateTime = `${currentDate}T${time}`;

  await pool.query(
    "INSERT INTO messages (message, username, timedata, room) VALUES (%L, %L, %s, %L) RETURNING *",
    [message, user.name, dateTime, user.room]
  );
}

module.exports = saveMessage;
