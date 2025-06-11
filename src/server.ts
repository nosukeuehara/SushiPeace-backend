import express from 'express';
import { Server } from 'socket.io';
import http from 'http';
import cors from 'cors';
import { nanoid } from 'nanoid';
import { db } from './firebase';
import { roomStore } from './store';

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' },
});

// ルーム作成API
app.post('/api/room', async (req, res) => {
  const { groupName, members } = req.body;
  const roomId = nanoid();

  await db.collection('rooms').doc(roomId).set({
    groupName,
    members,
    createdAt: new Date(),
  });

  roomStore[roomId] = {
    members: Object.fromEntries(
      members.map((m: any) => [m.userId, { name: m.name, counts: {} }])
    ),
  };

  res.json({
    roomId,
    shareUrl: `http://localhost:3000/group/${roomId}`,
  });
});

// Socket.io イベント
io.on('connection', (socket) => {
  console.log('🟢 Socket connected:', socket.id);

  socket.on('join', ({ roomId, userId }) => {
    socket.join(roomId);
    console.log(`👤 ${userId} joined ${roomId}`);
  });

  socket.on('count', ({ roomId, userId, color }) => {
    const room = roomStore[roomId];
    if (!room) return;
    const user = room.members[userId];
    if (!user) return;

    user.counts[color] = (user.counts[color] || 0) + 1;

    io.to(roomId).emit('sync', room.members);
  });
});

// 起動
const PORT = 3000;
server.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
