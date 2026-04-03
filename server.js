const express = require("express");
const WebSocket = require("ws");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(cors());

// ===== CONNECT TO MONGODB =====
mongoose.connect(process.env.MONGO_URI);

// ===== USER MODEL =====
const User = mongoose.model("User", {
  username: String,
  password: String,
  avatar: String,
  tagline: String,
  lastActive: Date,
});

// ===== MESSAGE MODEL =====
const Message = mongoose.model("Message", {
  from: String,
  to: String,
  text: String,
  media: String,
  time: Date,
});

// ===== REGISTER =====
app.post("/register", async (req, res) => {
  const user = new User(req.body);
  await user.save();
  res.send("User created");
});

// ===== LOGIN =====
app.post("/login", async (req, res) => {
  const user = await User.findOne(req.body);
  if (!user) return res.status(400).send("Invalid");
  user.lastActive = new Date();
  await user.save();
  res.json({ userId: user._id, username: user.username, avatar: user.avatar, tagline: user.tagline });
});

// ===== GET ONLINE USERS =====
app.get("/users", async (req, res) => {
  const users = await User.find();
  res.json(users);
});

// ===== GET CHAT HISTORY =====
app.get("/messages/:from/:to", async (req, res) => {
  const { from, to } = req.params;
  const msgs = await Message.find({ $or: [{ from, to }, { from: to, to: from }] }).sort({ time: 1 });
  res.json(msgs);
});

// ===== START SERVER =====
const server = app.listen(3000, () => console.log("Server running"));

// ===== WEBSOCKET =====
const wss = new WebSocket.Server({ server });
let clients = {};

wss.on("connection", (ws) => {
  ws.on("message", async (msg) => {
    const data = JSON.parse(msg);

    // Authenticate user
    if (data.type === "auth") {
      ws.userId = data.userId;
      clients[ws.userId] = ws;

      // Broadcast online users
      const onlineIds = Object.keys(clients);
      Object.values(clients).forEach(client => client.send(JSON.stringify({ type: "online", users: onlineIds })));
    }

    // Handle text/media message
    if (data.type === "message") {
      const message = new Message({
        from: data.from,
        to: data.to,
        text: data.text || "",
        media: data.media || "",
        time: new Date(),
      });
      await message.save();

      // Send to receiver if online
      if (clients[data.to]) clients[data.to].send(JSON.stringify(message));
    }

    // Typing indicator
    if (data.type === "typing" && clients[data.to]) {
      clients[data.to].send(JSON.stringify({ type: "typing", from: data.from }));
    }
  });

  ws.on("close", () => {
    delete clients[ws.userId];
    const onlineIds = Object.keys(clients);
    Object.values(clients).forEach(client => client.send(JSON.stringify({ type: "online", users: onlineIds })));
  });
});