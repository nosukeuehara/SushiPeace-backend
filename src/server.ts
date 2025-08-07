import express from "express";
import {Server} from "socket.io";
import http from "http";
import cors from "cors";
import {db} from "./infrastructure/config/firebase";
import {logger} from "./infrastructure/logging/logger";
import {errorHandler} from "./presentation/middleware/errorHandler";

// Repositories
import {FirebaseRoomRepository} from "./infrastructure/database/FirebaseRoomRepository";
import {InMemoryTemplateRepository} from "./infrastructure/memory/InMemoryTemplateRepository";
import {InMemoryRoomStateRepository} from "./infrastructure/memory/InMemoryRoomStateRepository";

// Use Cases
import {CreateRoomUseCase} from "./application/usecases/CreateRoomUseCase";
import {GetRoomUseCase} from "./application/usecases/GetRoomUseCase";
import {UpdateCountUseCase} from "./application/usecases/UpdateCountUseCase";

// Controllers
import {SocketController} from "./presentation/controllers/SocketController";
import {RoomController} from "./presentation/controllers/RoomControllers";

const app = express();
// cors設定
app.use(
  cors({
    origin: ["http://localhost:5173", "https://sushi-peace.web.app"],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type"],
  })
);

app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: ["https://sushi-peace.web.app", "http://localhost:5173"],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  },
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
app.post("/api/room", (req, res) => roomController.createRoom(req, res));
app.get("/api/room/:roomId", (req, res) => roomController.getRoom(req, res));
app.get("/api/templates", (req, res) => roomController.getTemplates(req, res));

// Error handling middleware
app.use(errorHandler);

// Socket Events
io.on("connection", (socket) => {
  socketController.handleConnection(io, socket);
});

// 起動
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  logger.info(`🚀 Server running at http://localhost:${PORT}`);
});

process.on("uncaughtException", (err) => {
  logger.error("Uncaught exception:", err);
});

process.on("unhandledRejection", (reason) => {
  logger.error("Unhandled rejection:", reason);
});
