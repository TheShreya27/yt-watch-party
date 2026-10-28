require("dotenv").config();

const cors = require("cors");
const express = require("express");
const { createServer } = require("node:http");
const { Server } = require("socket.io");
const RoomManager = require("./RoomManager");
const registerRoomHandlers = require("./socket/roomHandler");

const CLIENT_URL = process.env.CLIENT_URL;
const PORT = process.env.PORT || 3001;

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, or same-origin)
    // and allow all localhost / 127.0.0.1 ports in local development
    if (
      !origin ||
      origin.startsWith("http://localhost:") ||
      origin.startsWith("http://127.0.0.1:") ||
      origin === CLIENT_URL
    ) {
      return callback(null, true);
    }
    return callback(new Error("CORS blocked this origin"));
  },
  methods: ["GET", "POST"],
  credentials: true,
};

const app = express();
app.use(cors(corsOptions));
app.use(express.json());

app.get("/health", (request, response) => {
  response.json({ status: "ok" });
});

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: corsOptions,
});
const roomManager = new RoomManager();

io.on("connection", (socket) => {
  registerRoomHandlers(io, socket, roomManager);
});

if (require.main === module) {
  httpServer.on("error", (err) => {
    if (err.code === "EADDRINUSE") {
      console.error(`\n❌ Port ${PORT} is already in use.`);
      console.error(`Run this to fix: Stop-Process -Id (Get-NetTCPConnection -LocalPort ${PORT}).OwningProcess -Force\n`);
      process.exit(0);
    } else {
      throw err;
    }
  });

  httpServer.listen(PORT, () => {
    console.log(`✅ Server listening on port ${PORT}`);
  });
}

module.exports = { app, httpServer, io, roomManager };
