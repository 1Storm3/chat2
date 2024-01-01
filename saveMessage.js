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
  // const currentDate = new Date().toISOString().slice(0, 10);
  // const dateTime = `${currentDate}T${time}`;
  // Получаем текущую дату
  const currentDate = moment().format("YYYY-MM-DD");

  // Форматируем переданное время в часах и минутах
  const formattedTime = moment(`2000-01-01T${time}`).format("HH:mm");

  // Создаем строку с датой и временем в нужном формате
  const dateTime = `${currentDate} ${formattedTime}`;
  await pool.query(
    "INSERT INTO messages (message, username, timedata, room) values ($1, $2, $3, $4) RETURNING *",
    [message, user.name, dateTime, user.room]
  );
}

module.exports = saveMessage;
