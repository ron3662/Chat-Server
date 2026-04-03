// server.js
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const WebSocket = require("ws");
const multer = require("multer");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ===== MONGOOSE CONNECTION =====
mongoose.connect(process.env.MONGO_URI);

// ===== MODELS =====
const User = mongoose.model("User", new mongoose.Schema({
  username: String,
  password: String,
  avatar: String,
  tagline: String,
  lastActive: Date,
}));

const Message = mongoose.model("Message", new mongoose.Schema({
  from: String,
  to: String,
  text: String,
  media: String,
  type: String,
  time: Date,
}));

// ===== MULTER FILE UPLOAD =====
const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (req, file, cb) => cb(null, Date.now() + "_" + file.originalname),
});
const upload = multer({ storage });

// ===== ROUTES =====

// Register
app.post("/register", async (req, res) => {
  try {
    const user = new User({ ...req.body, lastActive: new Date() });
    await user.save();
    res.send({ userId: user._id });
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// Login
app.post("/login", async (req, res) => {
  try {
    const user = await User.findOne(req.body);
    if (!user) return res.status(400).send("Invalid credentials");
    user.lastActive = new Date();
    await user.save();
    res.send({ userId: user._id, username: user.username, avatar: user.avatar, tagline: user.tagline });
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// Get all users except logged-in
app.get("/users/:userId", async (req, res) => {
  const { userId } = req.params;
  const users = await User.find({ _id: { $ne: userId } });
  res.send(users);
});

// Get online users
app.get("/online-users", async (req, res) => {
  // online users are tracked via WS
  const onlineIds = Object.keys(clients);
  const users = await User.find({ _id: { $in: onlineIds } });
  res.send(users);
});

// Get single user profile
app.get("/user/:userId", async (req, res) => {
  const user = await User.findById(req.params.userId);
  if (!user) return res.status(404).send("User not found");
  res.send(user);
});

// Update user profile
app.post("/user/:userId/update", upload.single("avatar"), async (req, res) => {
  const update = { ...req.body };
  if (req.file) update.avatar = `https://yourserver.com/uploads/${req.file.filename}`;
  const user = await User.findByIdAndUpdate(req.params.userId, update, { new: true });
  res.send(user);
});

// Get messages between two users
app.get("/messages/:user1/:user2", async (req, res) => {
  const { user1, user2 } = req.params;
  const msgs = await Message.find({
    $or: [
      { from: user1, to: user2 },
      { from: user2, to: user1 },
    ]
  }).sort({ time: 1 });
  res.send(msgs);
});

// Upload media
app.post("/upload", upload.single("file"), (req, res) => {
  res.send({ url: `https://yourserver.com/uploads/${req.file.filename}` });
});

// ===== WEBSOCKET =====
const server = app.listen(3000, () => console.log("Server running on port 3000"));
const wss = new WebSocket.Server({ server });
let clients = {};

wss.on("connection", (ws) => {
  ws.on("message", async (msg) => {
    const data = JSON.parse(msg);

    // Authenticate
    if (data.type === "auth") {
      ws.userId = data.userId;
      clients[ws.userId] = ws;

      const online = Object.keys(clients);
      wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({ type: "online", users: online }));
        }
      });
    }

    // Chat message
    if (data.type === "message") {
      const message = new Message({ ...data, time: new Date() });
      await message.save();
      if (clients[data.to]) clients[data.to].send(JSON.stringify(message));
    }

    // Typing indicator
    if (data.type === "typing") {
      if (clients[data.to]) clients[data.to].send(JSON.stringify({ type: "typing", from: data.from }));
    }
  });

  ws.on("close", () => delete clients[ws.userId]);
});