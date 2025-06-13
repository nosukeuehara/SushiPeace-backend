import express, { Request, Response } from 'express';
import { Server } from 'socket.io';
import http from 'http';
import cors from 'cors';
import { nanoid } from 'nanoid';
import { db } from './firebase';
import { roomStore } from './store';
import { templates } from './templates';
import { createInitialCounts } from './utils/initCounts';
import { plateTemplates } from './constants/templates';

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
      return
    }

    const roomId = nanoid();

    await db.collection('rooms').doc(roomId).set({
      groupName,
      members,
      templateId,
      createdAt: new Date(),
    });

    // roomStore に登録
    const template = plateTemplates.find(t => t.id === templateId);
    if (!template) {
      res.status(400).json({ error: "テンプレートが不正です" });
      return;
    }

    roomStore[roomId] = {
      members: Object.fromEntries(
        members.map((m: any) => [
          m.userId,
          {
            name: m.name,
            counts: createInitialCounts(template),
          },
        ])
      ),
    };

    res.json({
      roomId,
      shareUrl: `http://localhost:3000/group/${roomId}`,
    });
  } catch (err) {
    res.status(500).json({ error: "ルーム作成中にエラーが発生しました" });
  }
});

app.get('/api/room/:roomId', async (req, res): Promise<void> => {
  const { roomId } = req.params;

  try {
    const doc = await db.collection('rooms').doc(roomId).get();

    if (!doc.exists) {
      res.status(404).json({ error: 'ルームが存在しません' });
      return;
    }

    const data = doc.data();
    const createdAt = data?.createdAt?.toDate?.();

    const now = new Date();
    const TWO_HOURS = 1000 * 60 * 60 * 2;

    if (createdAt && now.getTime() - createdAt.getTime() > TWO_HOURS) {
      // 期限切れ：Firestoreから削除して404を返す
      await db.collection('rooms').doc(roomId).delete();
      res.status(410).json({ error: 'ルームの有効期限が切れています' });
      return
    }

    res.json(data);
    return
  } catch (err) {
    console.error('🔥 Error fetching room:', err);
    res.status(500).json({ error: 'ルーム情報の取得に失敗しました' });
  }
});




app.get('/api/templates', (req, res) => {
  res.json(templates);
});

// Socket.io イベント
io.on('connection', (socket) => {

  socket.on('join', async ({ roomId, userId }) => {
    // roomStore に roomId がなければ Firestore から復元
    if (!roomStore[roomId]) {
      const doc = await db.collection('rooms').doc(roomId).get();
      if (!doc.exists) return;

      const roomData = doc.data();
      if (!roomData || !roomData.members) return;

      roomStore[roomId] = {
        members: Object.fromEntries(
          roomData.members.map((m: any) => [
            m.userId,
            {
              name: m.name,
              counts: m.counts ?? { 赤: 0, 青: 0, 黄: 0 },
            },
          ])
        ),
      };
    }

    socket.join(roomId);
  });

  socket.on("count", async ({ roomId, userId, color, remove }) => {
    const room = roomStore[roomId];
    if (!room) return;

    const user = room.members[userId];
    if (!user) return;

    // 加算 or 減算
    const current = user.counts[color] ?? 0;
    user.counts[color] = Math.max(0, current + (remove ? -1 : 1));

    // Firestoreに反映
    const membersArray = Object.entries(room.members).map(([userId, member]) => ({
      userId,
      name: member.name,
      counts: member.counts,
    }));

    try {
      await db.collection("rooms").doc(roomId).update({ members: membersArray });
    } catch (error) {
      console.error("🔥 Firestore update error:", error);
    }

    // クライアントに同期イベントを送信
    io.to(roomId).emit("sync", membersArray);
  });
});

// 起動
const PORT = 3000;
server.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
