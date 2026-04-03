const express = require("express");
const WebSocket = require("ws");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(cors());

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.log("MongoDB connection error:", err));

// ===== MODELS =====
const User = mongoose.model("User", { username: String, password: String, avatar: String });
const Message = mongoose.model("Message", { from: String, to: String, text: String, time: Date });

// ===== AUTH ROUTES =====
app.post("/register", async (req, res) => {
  try {
    const user = new User(req.body);
    await user.save();
    res.status(201).send("User created");
  } catch {
    res.status(400).send("Registration failed");
  }
});

app.post("/login", async (req, res) => {
  const user = await User.findOne(req.body);
  if (!user) return res.status(400).send("Invalid credentials");
  res.json({ userId: user._id, username: user.username, avatar: user.avatar });
});

// ===== USERS =====
app.get("/users", async (req, res) => {
  const users = await User.find({}, "_id username avatar");
  res.json(users);
});

// ===== MESSAGES =====
app.get("/messages/:user1/:user2", async (req, res) => {
  const { user1, user2 } = req.params;
  const messages = await Message.find({
    $or: [
      { from: user1, to: user2 },
      { from: user2, to: user1 }
    ]
  }).sort({ time: 1 });
  res.json(messages);
});

// ===== SERVER & WEBSOCKET =====
const server = app.listen(process.env.PORT || 3000, () => console.log("Server running"));
const wss = new WebSocket.Server({ server });

let clients = {};

wss.on("connection", (ws) => {
  ws.on("message", async (msg) => {
    const data = JSON.parse(msg);

    if (data.type === "auth") {
      ws.userId = data.userId;
      clients[ws.userId] = ws;

      // Broadcast online users
      const onlineUsers = Object.keys(clients);
      wss.clients.forEach((client) => {
        client.send(JSON.stringify({ type: "online", users: onlineUsers }));
      });
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

  ws.on("close", () => {
    delete clients[ws.userId];
    // Update online users
    const onlineUsers = Object.keys(clients);
    wss.clients.forEach((client) => {
      client.send(JSON.stringify({ type: "online", users: onlineUsers }));
    });
  });
});