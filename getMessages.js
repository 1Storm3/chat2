const { Pool } = require("pg");
// const pool = new Pool({
//   connectionString: process.env.DATABASE_URL,
//   ssl: {
//     require: true,
//   },
// });

const pool = new Pool({
  user: "storm",
  host: "localhost",
  database: "test",
  password: "meepo2014",
  port: 5432,
});

async function getMessages(room) {
  let newMessages = await pool.query(
    // `SELECT * FROM messages WHERE room = $1 ORDER BY timedata ASC LIMIT 100`,
    `SELECT message, username, to_char(timedata, 'YYYY-MM-DD HH24:MI') as timedata, room
     FROM messages WHERE room = $1 ORDER BY timedata ASC LIMIT 100`,
    [room]
  );
  // newMessages = JSON.stringify(newMessages.rows);
  // return newMessages;

  return JSON.stringify(newMessages.rows);
}

module.exports = getMessages;
