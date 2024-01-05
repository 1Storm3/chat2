const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const moment = require("moment");
const route = require("./route");
const bodyParser = require("body-parser");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
require("dotenv").config();
const { addUser, findUser, getRoomUsers, removeUser } = require("./users");
const getMessages = require("./messages/getMessages");
const saveMessage = require("./messages/saveMessage");
const loginUser = require("./api_Login/loginUser");
const registerUser = require("./api_register/register");
const app = express();
const pool = require("./db");
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const corsOptions = {
  origin: [
    "https://chaoschatix.netlify.app",
    "http://chaoschatix.netlify.app",
    "http://localhost:3000",
    "https://localhost:3000",
  ],
};

app.use(cors(corsOptions));

app.post("/register", registerUser);

app.use(route);

// Сначала мы получаем в теле запроса логин и пароль с клиента
// затем мы проверяем в бд по логину  пароль, если пароль верный
// осуществляем вход и генерируем токен на 15 секунд
// затем мы отправляем в базу данных id юзера, время создания токена +15 секунд и сам токен
// далее мы отправляем куки на фронт,в которых лежит токен
app.post("/login", loginUser);

// Проверка токена в бд
app.use("/sign", async (req, res, next) => {
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

app.post("/refresh", async (req, res) => {
  const refreshToken = req.cookies.refresh_token;

  if (!refreshToken) {
    return res.status(401).json({ message: "Отсутствует refresh-токен" });
  }

  try {
    // Поиск refresh-токена в базе данных
    const query = "SELECT * FROM tokens WHERE refresh_token = $1";
    const tokenData = await pool.query(query, [refreshToken]);

    if (tokenData.rows.length === 0) {
      return res
        .status(403)
        .json({ message: "Недействительный refresh-токен" });
    }

    const username = tokenData.rows[0].username;

    // Создание нового access-токена
    const newAccessToken = jwt.sign({ username }, "secret_key", {
      expiresIn: "15s", // Новый access-токен
    });

    // Обновление access-токена в базе данных (опционально)
    // Например, если вам нужно обновить access-токен в базе данных для текущей сессии

    res.cookie("access_token", newAccessToken, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
    });

    res.status(200).json({ message: "true" });
  } catch (error) {
    console.error("Ошибка при обновлении токена:", error);
    res.status(500).json({ message: "Ошибка сервера" });
  }
});

app.get("/getting", async (req, res) => {
  try {
    const query = "SELECT username FROM users WHERE username =$1";
    const username = req.body;

    const result = await pool.query(query, [username]);

    if (result.rows.length > 0) {
      const username = result.rows[0].username;
      res.status(200).json({ username });
    } else {
      res.status(404).json({ message: "user not find" });
    }
  } catch (error) {
    console.error("error usera", error);
    res.status(500).json({ message: "error serveras" });
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

const server = http.createServer(app);
const io = new Server(server, {
  cors: {},
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
