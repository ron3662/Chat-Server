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
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/chat-app");

const User = mongoose.model("User", {
  username: String,
  password: String,
  avatar: String,
  tagline: String,
  lastActive: Date,
});

const Message = mongoose.model("Message", {
  from: String,
  to: String,
  text: String,
  media: String,
  type: String,
  time: Date,
});

// Multer for file uploads
const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (req, file, cb) => cb(null, Date.now() + "_" + file.originalname),
});
const upload = multer({ storage });

// Register
app.post("/register", upload.single("file"), async (req, res) => {
  try {
    const { username, password, tagline } = req.body;

    const existing = await User.findOne({ username });
    if (existing) return res.status(400).send("User already exists");

    let avatar = "";
    if (req.file) {
      avatar = `https://chat-server-jznv.onrender.com/uploads/${req.file.filename}`;
    }

    const user = new User({ username, password, avatar, tagline });
    await user.save();

    res.send({
      userId: user._id,
      username,
      avatar,
      tagline,
    });
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// Login
app.post("/login", upload.single("file"), async (req, res) => {
  try {
    const { username, password, tagline } = req.body;

    const user = await User.findOne({ username });
    if (!user) return res.status(400).send("User not found");

    if (user.password !== password)
      return res.status(400).send("Wrong password");

    let avatar = user.avatar;

    if (req.file) {
      avatar = `https://chat-server-jznv.onrender.com/uploads/${req.file.filename}`;
      user.avatar = avatar;
    }

    if (tagline) user.tagline = tagline;

    user.lastActive = new Date();
    await user.save();

    res.send({
      userId: user._id,
      username: user.username,
      avatar: user.avatar,
      tagline: user.tagline,
    });
  } catch (err) {
    res.status(500).send(err.message);
  }
});

app.post("/updateProfile", async (req, res) => {
  try {
    const { userId, username, avatar, tagline } = req.body;

    // ✅ correct: use _id
    const user = await User.findById(userId);
    if (!user) return res.status(400).send("User not found");

    // ✅ update fields
    if (username) user.username = username;
    if (avatar) user.avatar = avatar;
    if (tagline) user.tagline = tagline;

    await user.save();

    // ✅ correct response
    res.send({ message: "Profile updated", user });
  } catch (err) {
    console.error(err);
    res.status(500).send(err.message);
  }
});

app.post("/upload", upload.single("file"), (req, res) => {
  if (!req.file) return res.status(400).send("No file uploaded");

  res.send({
    url: `https://chat-server-jznv.onrender.com/uploads/${req.file.filename}`, // ✅ FIXED
  });
});

// Users
app.get("/users", async (req, res) => {
  try {
    const users = await User.find({}, "-password -__v");

    const formatted = users.map((u) => ({
      id: u._id,
      username: u.username,
      avatar: u.avatar,
      tagline: u.tagline,
    }));

    res.status(200).json(formatted);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch users" });
  }
});

// Messages
app.get("/messages/:user1/:user2", async (req, res) => {
  const { user1, user2 } = req.params;
  const msgs = await Message.find({
    $or: [
      { from: user1, to: user2 },
      { from: user2, to: user1 },
    ],
  }).sort({ time: 1 });
  res.send(msgs);
});

// Upload Media
const SERVER_URL = "http://localhost:3000";
app.post("/upload", upload.single("file"), (req, res) => {
  if (!req.file) return res.status(400).send("No file uploaded");
  res.send({ url: `${SERVER_URL}/uploads/${req.file.filename}` });
});

// WebSocket
const server = app.listen(3000, () => console.log("Server running on port 3000"));
const wss = new WebSocket.Server({ server });
let clients = {};

wss.on("connection", (ws) => {
  ws.on("message", async (msg) => {
    const data = JSON.parse(msg);

    if (data.type === "auth") {
      ws.userId = data.userId;
      clients[ws.userId] = ws;
      const online = Object.keys(clients);
      wss.clients.forEach((c) => c.readyState === WebSocket.OPEN && c.send(JSON.stringify({ type: "online", users: online })));
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