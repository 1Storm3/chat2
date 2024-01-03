const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const moment = require("moment");
const { Pool } = require("pg");
const route = require("./route");
const bodyParser = require("body-parser");
const metautil = require("metautil");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
require("dotenv").config();

const { addUser, findUser, getRoomUsers, removeUser } = require("./users");
const createUser = require("./middlewares/createUser");
const getMessages = require("./getMessages");
const saveMessage = require("./saveMessage");

const app = express();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    require: true,
  },
});
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// const pool = new Pool({
//   user: "storm",
//   host: "localhost",
//   database: "test",
//   password: "meepo2014",
//   port: 5432,
// });
app.use(cors({ origin: "*" }));

app.use(route);

// регистрация пользователя через добавление в базу данных

// const addPassword = async () => {
//   const password = "evgeny";
//   const username = "evgeny";
//   const hash = await metautil.hashPassword(password);
//   try {
//     const query = "INSERT INTO users(username, password) VALUES ($1, $2)";
//     await pool.query(query, [username, hash]);
//   } catch (error) {
//     console.error("error:", error);
//     throw error;
//   }
// };

// addPassword();

// Сначала мы получаем в теле запроса логин и пароль с клиента
// затем мы проверяем в бд по логину  пароль, если пароль верный
// осуществляем вход и генерируем токен на 15 секунд
// затем мы отправляем в базу данных id юзера, время создания токена +15 секунд и сам токен
// далее мы отправляем куки на фронт,в которых лежит токен
app.post("/", async (req, res) => {
  const { username, password } = req.body;
  try {
    const query = "SELECT * FROM users WHERE username = $1";
    const result = await pool.query(query, [username]);

    if (result.rows.length > 0) {
      const storedHash = result.rows[0].password;

      const valid = await metautil.validatePassword(password, storedHash);

      if (valid) {
        const accessToken = jwt.sign({ username }, "secret_key", {
          expiresIn: "15s",
        });

        const user_id = result.rows[0].id;

        const expirationDate = new Date(Date.now() + 15 * 1000);
        await pool.query(
          "INSERT INTO tokens (user_id, token, expiration) VALUES ($1, $2, $3)",
          [user_id, accessToken, expirationDate]
        );
        res.cookie("access_token", accessToken, {
          httpOnly: true,
          secure: true,
          sameSite: "strict",
        });

        res.status(200).json({ message: "true" });
      }
    } else {
      res.status(401).json({ message: "false" });
    }
  } catch (error) {
    res.status(500).json({ message: "error server" });
  }
});

// Проверка токена в бд
app.use(async (req, res, next) => {
  const token = req.cookies.access_token;

  if (!token) {
    return res.status(401).json({ message: "Token null" });
  }
  try {
    const query =
      "SELECT * FROM tokens WHERE token = $1 AND expiration > NOW()";
    const tokenData = await pool.query(query, [token]);

    if (tokenData.rows.length === 0) {
      return res.status(401).json({ message: "token nedestvitelen" });
    }
    next();
  } catch (error) {
    console.error("error pri proverke", error);
    res.status(500).json({ message: "error server" });
  }
});

// защищенный маршрут через доступ по авторизации по токену в куках
app.get("/sign", (req, res) => {
  const accessToken = req.cookies.access_token;

  if (!accessToken) {
    return res.status(401).json({ message: "access denied" });
  }

  try {
    const decoded = jwt.verify(accessToken, "secret_key");

    res.status(200).json({ message: "access +" });
  } catch (error) {
    res.status(401).json({ message: "invalid -" });
  }
});

app.use(express.json());

// app.use("/login", createUser);
// app.get("/users", async function getUsers(req, res) {
//   const users = await pool.query("SELECT * FROM person");
//   res.send(users.rows);
// });

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  socket.on("join", ({ name, room }) => {
    socket.join(room);

    getMessages(room)
      .then((last100Messages) => {
        socket.emit("last_100_messages", last100Messages);
      })
      .catch((err) => console.log(err));

    const { user, isExist } = addUser({ name, room });

    let time = moment().format("HH:mm");

    const userMessage = isExist
      ? `${user.name}, Вы снова здесь`
      : `Добро пожаловать в чат, ${user.name}`;

    socket.emit("message", {
      data: {
        user: { name: "Администратор" },
        message: userMessage,
        time: time,
      },
    });

    socket.broadcast.to(user.room).emit("message", {
      data: {
        user: { name: "Администратор" },
        message: `${user.name} присоединился`,
        time: time,
      },
    });

    io.to(user.room).emit("room", {
      data: { users: getRoomUsers(user.room) },
    });
  });

  socket.on("sendMessage", ({ message, params }) => {
    const user = findUser(params);
    let time = moment().format("HH:mm");
    if (user) {
      io.to(user.room).emit("message", {
        data: { user, message, time },
      });
      const data = { user, message, time };
      saveMessage(data)
        .then((response) => console.log(response))
        .catch((err) => console.log(err));
    }
  });

  socket.on("leftRoom", ({ params }) => {
    const user = removeUser(params);

    if (user) {
      const { room, name } = user;
      let time = moment().format("HH:mm");
      io.to(room).emit("message", {
        data: {
          user: { name: "Администратор" },
          message: `${name} покинул чат`,
          time: time,
        },
      });

      io.to(room).emit("room", {
        data: { users: getRoomUsers(room) },
      });
    }
  });

  io.on("disconnect", () => {
    console.log("Disconnect");
  });
});

server.listen(81, () => {
  console.log("Server is running");
});
