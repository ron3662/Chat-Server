// server.js
const express = require("express");
const WebSocket = require("ws");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcrypt");

const app = express();
app.use(express.json());
app.use(cors());

// ===== CONNECT TO MONGODB =====
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.error("MongoDB connection error:", err));

// ===== USER MODEL =====
const User = mongoose.model("User", {
  username: { type: String, unique: true },
  password: String,
  avatar: String,
});

// ===== MESSAGE MODEL =====
const Message = mongoose.model("Message", {
  from: String,
  to: String,
  text: String,
  time: Date,
});

// ===== REGISTER =====
app.post("/register", async (req, res) => {
  try {
    const hashed = await bcrypt.hash(req.body.password, 10);
    const user = new User({ username: req.body.username, password: hashed });
    await user.save();
    res.status(201).send("User created");
  } catch (err) {
    res.status(400).send("Registration failed");
  }
});

// ===== LOGIN =====
app.post("/login", async (req, res) => {
  const user = await User.findOne({ username: req.body.username });
  if (!user) return res.status(400).send("Invalid username");

  const match = await bcrypt.compare(req.body.password, user.password);
  if (!match) return res.status(400).send("Invalid password");

  res.json({ userId: user._id, username: user.username });
});

// ===== GET USERS =====
app.get("/users", async (req, res) => {
  const users = await User.find();
  res.json(users);
});

// ===== GET MESSAGES =====
app.get("/messages/:user1/:user2", async (req, res) => {
  const { user1, user2 } = req.params;
  const msgs = await Message.find({
    $or: [
      { from: user1, to: user2 },
      { from: user2, to: user1 },
    ],
  }).sort({ time: 1 });
  res.json(msgs);
});

// ===== START SERVER =====
const server = app.listen(3000, () => console.log("Server running"));

// ===== WEBSOCKET =====
const wss = new WebSocket.Server({ server });
let clients = {}; // userId => ws

wss.on("connection", (ws) => {

  ws.on("message", async (msg) => {
    const data = JSON.parse(msg);

    // Save connection
    if (data.type === "auth") {
      ws.userId = data.userId;
      clients[ws.userId] = ws;

      // Broadcast online users
      const online = Object.keys(clients);
      Object.values(clients).forEach(client => client.send(JSON.stringify({ type: "online", users: online })));
    }

    // Typing
    if (data.type === "typing" && clients[data.to]) {
      clients[data.to].send(JSON.stringify({ type: "typing", from: data.from }));
    }

    // Message
    if (data.type === "message") {
      const message = new Message({ from: data.from, to: data.to, text: data.text, time: new Date() });
      await message.save();
      if (clients[data.to]) clients[data.to].send(JSON.stringify(message));
    }
  });

  ws.on("close", () => {
    if (ws.userId) delete clients[ws.userId];
    // Broadcast updated online users
    const online = Object.keys(clients);
    Object.values(clients).forEach(client => client.send(JSON.stringify({ type: "online", users: online })));
  });
});