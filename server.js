// server.js
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const WebSocket = require("ws");
const multer = require("multer");
const { v2: cloudinary } = require("cloudinary");

const app = express();
app.use(cors());
app.use(express.json());

// MongoDB connection
mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/chat-app");

// Cloudinary config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Multer memory storage
const upload = multer({ storage: multer.memoryStorage() });

const reaction = new mongoose.Schema({
  userId: String,
  reaction : String,
}, { _id: false });

const mediaSchema = new mongoose.Schema({
  mediaType: { type: String, required: true }, // image, video, pdf, file
  mediaName: { type: String },
  mediaPreviewUrl: { type: String }, // thumbnail (video/pdf)
  mediaUrl: { type: String, required: true },
  reactions: [reaction],
}, { _id: false });

const textMessage = new mongoose.Schema({
  text: String,
  reactions : [reaction],
}, { _id: false });

// Models
const User = mongoose.model("User", {
  username: String,
  password: String,
  avatar: String,
  tagline: String,
  lastActive: Date,
  pushToken: String,
});

const Message = mongoose.model("Message", {
  from: String,
  to: String,
  text: textMessage,
  media: [mediaSchema],
  time: Date,
});

// Cloudinary upload helper
const uploadToCloudinary = (buffer, resourceType = "auto") =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream({ resource_type: resourceType }, (err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
    stream.end(buffer);
  });

// Register
app.post("/register", upload.single("file"), async (req, res) => {
  try {
    const { username, password, tagline } = req.body;
    const existing = await User.findOne({ username });
    if (existing) return res.status(400).send("User already exists");

    let avatar = "";
    if (req.file) {
      const result = await uploadToCloudinary(req.file.buffer);
      avatar = result.secure_url;
    }

    const user = new User({ username, password, avatar, tagline });
    await user.save();

    res.send({ userId: user._id, username, avatar, tagline });
  } catch (err) {
    res.status(500).send(err.message);
  }
});

app.post("/update-push-token", async (req, res) => {
  try {
    const { userId, pushToken } = req.body;
    await User.findByIdAndUpdate(userId, { pushToken });
    res.send("Push token updated");
  } catch (err) {
    res.status(500).send(err.message);
  }
});

async function sendPushNotification(token, title, body) {
  if (!token) return;
  const message = {
    to: token,
    sound: 'default',
    title,
    body,
    data: { title, body },
  };
  await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(message),
  });
} 
// Login
app.post("/login", upload.single("file"), async (req, res) => {
  try {
    const { username, password, tagline } = req.body;
    const user = await User.findOne({ username });
    if (!user) return res.status(400).send("User not found");
    if (user.password !== password) return res.status(400).send("Wrong password");

    let avatar = user.avatar;
    if (req.file) {
      const result = await uploadToCloudinary(req.file.buffer);
      avatar = result.secure_url;
      user.avatar = avatar;
    }
    if (tagline) user.tagline = tagline;
    user.lastActive = new Date();
    await user.save();

    res.send({ userId: user._id, username: user.username, avatar: user.avatar, tagline: user.tagline });
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// Get users
app.get("/users", async (req, res) => {
  try {
    const users = await User.find({}, "-password -__v");
    res.json(users.map(u => ({ id: u._id, username: u.username, avatar: u.avatar, tagline: u.tagline })));
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch users" });
  }
});

// Get messages
app.get("/messages/:user1/:user2", async (req, res) => {
  const { user1, user2 } = req.params;
  const msgs = await Message.find({
    $or: [{ from: user1, to: user2 }, { from: user2, to: user1 }]
  }).sort({ time: 1 });
  res.send(msgs);
});

// Upload media
app.post("/upload", upload.single("file"), async (req, res) => {
  if (!req.file) return res.status(400).send("No file uploaded");
  try {
    const result = await uploadToCloudinary(req.file.buffer, req.body.resource_type);
    res.send({ url: result.secure_url });
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// Update message reactions
app.post("/messages/:messageId/reactions", async (req, res) => {
  try {
    const { messageId } = req.params;
    const { userId, emoji, mediaIndex, isText } = req.body;

    const message = await Message.findById(messageId);
    if (!message) return res.status(404).send("Message not found");

    // Update text reactions
    if (isText) {
      if (!message.text) message.text = { text: "", reactions: [] };
      if (!message.text.reactions) message.text.reactions = [];

      // Check if reaction already exists
      const existingIndex = message.text.reactions.findIndex(
        (r) => r.userId === userId && r.reaction === emoji
      );

      if (existingIndex !== -1) {
        // Remove reaction if it already exists (toggle)
        message.text.reactions.splice(existingIndex, 1);
      } else {
        // Add new reaction
        message.text.reactions.push({ userId, reaction: emoji });
      }
    }
    // Update media reactions
    else if (mediaIndex !== undefined && mediaIndex >= 0) {
      if (!message.media[mediaIndex].reactions) {
        message.media[mediaIndex].reactions = [];
      }

      // Check if reaction already exists
      const existingIndex = message.media[mediaIndex].reactions.findIndex(
        (r) => r.userId === userId && r.reaction === emoji
      );

      if (existingIndex !== -1) {
        // Remove reaction if it already exists (toggle)
        message.media[mediaIndex].reactions.splice(existingIndex, 1);
      } else {
        // Add new reaction
        message.media[mediaIndex].reactions.push({ userId, reaction: emoji });
      }
    }

    await message.save();
    res.send(message);
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
});

// WebSocket
const server = app.listen(process.env.PORT || 3000, () => console.log("Server running"));
const wss = new WebSocket.Server({ server });
let clients = {};

wss.on("connection", ws => {
  ws.on("message", async msg => {
    const data = JSON.parse(msg);
    if (data.type === "auth") {
      ws.userId = data.userId;
      clients[ws.userId] = ws;
      const online = Object.keys(clients);
      wss.clients.forEach(c => c.readyState === WebSocket.OPEN && c.send(JSON.stringify({ type: "online", users: online })));
    }

    if (data.type === "message") {
      const message = new Message({
        from: data.from,
        to: data.to,
        text: data.text,
        media: data.media || [],
        time: new Date(),
      });

      await message.save();
      if (clients[data.to]) 
        {
          sendPushNotification((await User.findById(data.to)).pushToken, "New message from " + (await User.findById(data.from)).username, data.text || "Sent you a media message");
          clients[data.to].send(JSON.stringify(message));
        }
    }

    if (data.type === "typing") {
      if (clients[data.to]) clients[data.to].send(JSON.stringify({ type: "typing", from: data.from }));
    }
  });

  ws.on("close", () => delete clients[ws.userId]);
});