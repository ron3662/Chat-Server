// server.js
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const WebSocket = require("ws");
const multer = require("multer"); // for file uploads
const path = require("path");
const fs = require("fs");

const app = express();
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

mongoose.connect(process.env.MONGO_URI);

const User = mongoose.model("User", {
  username: String,
  password: String,
  avatar: String,
  tagline: String,
  lastActive: Date
});

const Message = mongoose.model("Message", {
  from: String,
  to: String,
  text: String,
  media: String,
  type: String,
  time: Date
});

// ===== FILE UPLOAD =====
const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (req, file, cb) => cb(null, Date.now() + "_" + file.originalname)
});
const upload = multer({ storage });

// ===== REGISTER =====
app.post("/register", async (req, res) => {
  const user = new User({ ...req.body, lastActive: new Date() });
  await user.save();
  res.send({ userId: user._id });
});

// ===== LOGIN =====
app.post("/login", async (req, res) => {
  const user = await User.findOne(req.body);
  if (!user) return res.status(400).send("Invalid credentials");
  user.lastActive = new Date();
  await user.save();
  res.send({ userId: user._id, username: user.username, avatar: user.avatar, tagline: user.tagline });
});

// ===== USERS =====
app.get("/users", async (req, res) => {
  const users = await User.find({});
  res.send(users);
});

// ===== MESSAGES =====
app.get("/messages/:user1/:user2", async (req, res) => {
  const { user1, user2 } = req.params;
  const msgs = await Message.find({
    $or: [
      { from: user1, to: user2 },
      { from: user2, to: user1 }
    ]
  }).sort({ time: 1 });
  res.send(msgs);
});

// ===== UPLOAD MEDIA =====
app.post("/upload", upload.single("file"), (req, res) => {
  res.send({ url: `https://yourserver.com/uploads/${req.file.filename}` });
});

// ===== START SERVER =====
const server = app.listen(3000, () => console.log("Server running on port 3000"));

// ===== WEBSOCKET =====
const wss = new WebSocket.Server({ server });
let clients = {};

wss.on("connection", (ws) => {
  ws.on("message", async (msg) => {
    const data = JSON.parse(msg);

    if (data.type === "auth") {
      ws.userId = data.userId;
      clients[ws.userId] = ws;

      // broadcast online users
      const online = Object.keys(clients);
      wss.clients.forEach(client => client.readyState === WebSocket.OPEN && client.send(JSON.stringify({ type: "online", users: online })));
    }

    if (data.type === "message") {
      const message = new Message({ ...data, time: new Date() });
      await message.save();
      if (clients[data.to]) clients[data.to].send(JSON.stringify(message));
    }

    if (data.type === "typing") {
      if (clients[data.to]) clients[data.to].send(JSON.stringify({ type: "typing", from: data.from }));
    }
  });

  ws.on("close", () => delete clients[ws.userId]);
});