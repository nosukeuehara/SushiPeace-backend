import express from 'express';
import { Server } from 'socket.io';
import http from 'http';
import cors from 'cors';
import { db } from './infrastructure/config/firebase';

// Repositories
import { FirebaseRoomRepository } from './infrastructure/database/FirebaseRoomRepository';
import { InMemoryTemplateRepository } from './infrastructure/memory/InMemoryTemplateRepository';
import { InMemoryRoomStateRepository } from './infrastructure/memory/InMemoryRoomStateRepository';

// Use Cases
import { CreateRoomUseCase } from './application/usecases/CreateRoomUseCase';
import { GetRoomUseCase } from './application/usecases/GetRoomUseCase';
import { UpdateCountUseCase } from './application/usecases/UpdateCountUseCase';

// Controllers
import { SocketController } from './presentation/controllers/SocketController';
import { RoomController } from './presentation/controllers/RoomControllers';

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' },
});

// Dependencies
const roomRepository = new FirebaseRoomRepository(db);
const templateRepository = new InMemoryTemplateRepository();
const roomStateRepository = new InMemoryRoomStateRepository();

// Use Cases
const createRoomUseCase = new CreateRoomUseCase(
  roomRepository,
  templateRepository,
  roomStateRepository
);
const getRoomUseCase = new GetRoomUseCase(roomRepository);
const updateCountUseCase = new UpdateCountUseCase(
  roomRepository,
  roomStateRepository
);

// Controllers
const roomController = new RoomController(
  createRoomUseCase,
  getRoomUseCase,
  templateRepository
);
const socketController = new SocketController(
  roomRepository,
  roomStateRepository,
  updateCountUseCase
);

// Routes
app.post('/api/room', (req, res) => roomController.createRoom(req, res));
app.get('/api/room/:roomId', (req, res) => roomController.getRoom(req, res));
app.get('/api/templates', (req, res) => roomController.getTemplates(req, res));

// Socket Events
io.on('connection', (socket) => {
  socketController.handleConnection(io, socket);
});

// 起動
const PORT = 3000;
server.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});