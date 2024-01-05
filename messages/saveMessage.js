const pool = require("../db");

async function saveMessage(data) {
  const { message, time, user } = data;
  const currentDate = new Date().toISOString().slice(0, 10);
  const dateTime = `${currentDate}T${time}`;

  await pool.query(
    "INSERT INTO messages (message, username, timedata, room) values ($1, $2, $3, $4) RETURNING *",
    [message, user.name, dateTime, user.room]
  );
}

module.exports = saveMessage;
