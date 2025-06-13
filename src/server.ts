import express, { Request, Response } from 'express';
import { Server } from 'socket.io';
import http from 'http';
import cors from 'cors';
import { nanoid } from 'nanoid';
import { db } from './firebase';
import { roomStore } from './store';
import { templates } from './templates';

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' },
});

// ルーム情報取得API
app.get('/api/room/:roomId', async (req, res) => {
  const { roomId } = req.params;
  const doc = await db.collection('rooms').doc(roomId).get();
  res.json(doc.data());
});

// ルーム作成API
app.post('/api/room', async (req, res): Promise<void> => {
  try {
    const { groupName, members, templateId } = req.body;

    if (!templateId) {
      res.status(400).json({ error: "テンプレートが選択されていません" });
      return;
    }

    const roomId = nanoid();

    await db.collection('rooms').doc(roomId).set({
      groupName,
      members,
      templateId,
      createdAt: new Date(),
    });

    roomStore[roomId] = {
      members: Object.fromEntries(
        members.map((m: any) => [m.userId, { name: m.name, counts: m.counts || {} }])
      ),
    };

    res.json({
      roomId,
      shareUrl: `http://localhost:3000/group/${roomId}`,
    });
  } catch (err) {
    console.error('🔥 Error creating room:', err);
    res.status(500).json({ error: 'ルーム作成中にエラーが発生しました' });
  }
});


app.get('/api/templates', (req, res) => {
  res.json(templates);
});

// ルームカウント追加API
app.put('/api/room/:roomId/counts', async (req, res) => {
  const { roomId } = req.params;
  const { members } = req.body;

  try {
    await db.collection('rooms').doc(roomId).update({ members });
    res.json({ ok: true });
  } catch (error) {
    console.error('🔥 Firestore update error:', error);
    res.status(500).json({ error: 'Failed to update counts' });
  }
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
