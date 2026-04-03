const express = require('express');
const WebSocket = require('ws');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

// ===== CONNECT DB =====
mongoose.connect(process.env.MONGO_URI);

// ===== MODELS =====
const User = mongoose.model('User', {
  username: String,
  password: String,
});

const Message = mongoose.model('Message', {
  from: String,
  to: String,
  text: String,
  time: Date
});

// ===== REGISTER =====
app.post('/register', async (req, res) => {
  const user = new User(req.body);
  await user.save();
  res.send('User created');
});

// ===== LOGIN =====
app.post('/login', async (req, res) => {
  const user = await User.findOne(req.body);
  if (!user) return res.status(400).send('Invalid');

  res.json({ userId: user._id });
});

// ===== GET USERS =====
app.get('/users', async (req, res) => {
  const users = await User.find({}, '_id username');
  res.json(users);
});

// ===== GET MESSAGES =====
app.get('/messages/:user1/:user2', async (req, res) => {
  const { user1, user2 } = req.params;

  const messages = await Message.find({
    $or: [
      { from: user1, to: user2 },
      { from: user2, to: user1 }
    ]
  }).sort({ time: 1 });

  res.json(messages);
});

// ===== SERVER =====
const server = app.listen(3000, () => {
  console.log('Server running');
});

// ===== WEBSOCKET =====
const wss = new WebSocket.Server({ server });

let clients = {};

wss.on('connection', (ws) => {

  ws.on('message', async (msg) => {
    const data = JSON.parse(msg);

    // AUTH
    if (data.type === 'auth') {
      ws.userId = data.userId;
      clients[ws.userId] = ws;

      // broadcast online users
      const onlineUsers = Object.keys(clients);

      wss.clients.forEach(client => {
        client.send(JSON.stringify({
          type: "online",
          users: onlineUsers
        }));
      });
    }

    // MESSAGE
    if (data.type === 'message') {
      const message = new Message({
        from: data.from,
        to: data.to,
        text: data.text,
        time: new Date()
      });

      await message.save();

      // send to receiver
      if (clients[data.to]) {
        clients[data.to].send(JSON.stringify(message));
      }
    }
  });

  ws.on('close', () => {
    delete clients[ws.userId];
  });
});