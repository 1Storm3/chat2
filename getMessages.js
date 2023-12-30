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

async function getMessages(room) {
  let newMessages = await pool.query(
    `SELECT * FROM messages WHERE room = ${room} LIMIT 100`
  );
  newMessages = JSON.stringify(newMessages.rows);
  return newMessages;
}

module.exports = getMessages;
