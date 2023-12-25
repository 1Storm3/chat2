const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const { Pool } = require("pg");
const route = require("./route");
const { addUser, findUser, getRoomUsers, removeUser } = require("./users");
const app = express();
app.use(cors({ origin: "*" }));
app.use(route);
require("dotenv").config();
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    require: true,
  },
});
app.use(express.json());
app.post("/request", async function createUser(req, res) {
  const { name, surname } = req.body;
  const newPerson = await pool.query(
    "INSERT INTO person (name, surname) values ($1, $2) RETURNING *",
    [name, surname]
  );
  res.json(newPerson.rows[0]);
});

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

    const { user, isExist } = addUser({ name, room });

    const userMessage = isExist
      ? `${user.name}, Вы снова здесь`
      : `Привет, ${user.name}`;

    socket.emit("message", {
      data: { user: { name: null }, message: userMessage },
    });

    socket.broadcast.to(user.room).emit("message", {
      data: {
        user: { name: null },
        message: `${user.name} Присоединился`,
      },
    });

    io.to(user.room).emit("room", {
      data: { users: getRoomUsers(user.room) },
    });
  });

  socket.on("sendMessage", ({ message, params }) => {
    const user = findUser(params);

    if (user) {
      io.to(user.room).emit("message", { data: { user, message } });
    }
  });

  socket.on("leftRoom", ({ params }) => {
    const user = removeUser(params);

    if (user) {
      const { room, name } = user;

      io.to(room).emit("message", {
        data: { user: { name: "Админ" }, message: `${name} Покинул чат` },
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
