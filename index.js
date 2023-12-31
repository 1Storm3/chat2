const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const moment = require("moment");
const { Pool } = require("pg");
const route = require("./route");
const { addUser, findUser, getRoomUsers, removeUser } = require("./users");
const createUser = require("./middlewares/createUser");
require("dotenv").config();
const app = express();
const saveMessage = require("./saveMessage");
app.use(cors({ origin: "*" }));

const getMessages = require("./getMessages");

app.use(route);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    require: true,
  },
});

app.use(express.json());

app.use("/login", createUser);

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
