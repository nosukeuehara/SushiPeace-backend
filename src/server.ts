import express from "express";
import {Server} from "socket.io";
import http from "http";
import cors from "cors";
import {db} from "@/infrastructure/config/firebase";
import {logger} from "@/infrastructure/logging/logger";
import {errorHandler} from "@/presentation/middleware/errorHandler";
import dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

// Repositories
import {FirebaseRoomRepository} from "@/infrastructure/database/FirebaseRoomRepository";
import {InMemoryTemplateRepository} from "@/infrastructure/memory/InMemoryTemplateRepository";
import {InMemoryRoomStateRepository} from "@/infrastructure/memory/InMemoryRoomStateRepository";

// Use Cases
import {CreateRoomUseCase} from "@/application/usecases/CreateRoomUseCase";
import {RoomUseCase} from "@/application/usecases/RoomUseCase";
import {UpdateCountUseCase} from "@/application/usecases/UpdateCountUseCase";

// Controllers
import {SocketController} from "@/presentation/controllers/SocketController";
import {RoomController} from "@/presentation/controllers/RoomControllers";
import {GetTemplateUseCase} from "./application/usecases/GetTemplateUseCase";

const app = express();

// CORS設定（Cloud Run対応）
const allowedOrigins = [process.env.PROD_URL, process.env.DEV_URL].filter(
  (v): v is string => !!v
);
const corsOptions = {
  origin: allowedOrigins.length ? allowedOrigins : true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type"],
};

// CORSミドルウェアを適用
app.use(cors(corsOptions));

app.options("/api/room", cors(corsOptions));
app.options("/api/room/:roomId", cors(corsOptions));
app.options("/api/templates", cors(corsOptions));

app.use(express.json());

// サーバー & Socket.IO
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
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
const roomUseCase = new RoomUseCase(roomRepository, roomStateRepository);
const updateCountUseCase = new UpdateCountUseCase(
  roomRepository,
  roomStateRepository
);
const getTemplateUseCase = new GetTemplateUseCase(templateRepository);

// Controllers
const roomController = new RoomController(
  createRoomUseCase,
  roomUseCase,
  getTemplateUseCase
);
const socketController = new SocketController(updateCountUseCase, roomUseCase);

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
const PORT =
  Number(process.env.PORT) ||
  (process.env.NODE_ENV === "production" ? 8080 : 3000);
const HOST = process.env.NODE_ENV === "production" ? "0.0.0.0" : "localhost";

logger.info(
  `Booting... NODE_ENV=${process.env.NODE_ENV} PORT=${PORT} HOST=${HOST}`
);

server.listen(PORT, HOST, () =>
  logger.info(`🚀 Server running at http://${HOST}:${PORT}`)
);

process.on("uncaughtException", (err) => {
  logger.error("Uncaught exception:", err);
});

process.on("unhandledRejection", (reason) => {
  logger.error("Unhandled rejection:", reason);
});
