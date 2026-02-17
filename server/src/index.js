const path = require('path');
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const Rooms = require('./rooms');
const { EVENTS } = require('./shared/schema');
const { MAX_PLAYERS } = require('./shared/constants');
const { startGameLoops } = require('./game/tick');
const { OBSTACLES } = require('./game/map');

const PORT = process.env.PORT || 3000;
const DEFAULT_ROOM = 'DEMO';

const app = express();
app.use(express.static(path.join(__dirname, '../../client')));

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' }
});

const rooms = new Rooms();
startGameLoops(io, rooms);

io.on('connection', (socket) => {
  const ip = socket.handshake.address;
  console.log(`Client connected ${socket.id} from ${ip}`);

  socket.on(EVENTS.JOIN_ROOM, (payload = {}) => {
    const roomCode = (payload.roomCode || DEFAULT_ROOM).toUpperCase();
    const name = (payload.name || 'Player').slice(0, 16);
    const result = rooms.addPlayer(roomCode, socket.id, name);
    if (!result.ok) {
      socket.emit(EVENTS.ROOM_FULL, { roomCode, max: MAX_PLAYERS });
      return;
    }
    socket.join(roomCode);
    const room = result.room;
    socket.emit(EVENTS.ROOM_JOINED, {
      roomCode,
      playerId: socket.id,
      players: Array.from(room.state.players.values()),
      map: { obstacles: OBSTACLES }
    });
    sendPlayersUpdate(roomCode);
  });

  socket.on(EVENTS.INPUT, (data = {}) => {
    const roomCode = rooms.socketToRoom.get(socket.id);
    if (!roomCode) return;
    const room = rooms.getRoom(roomCode);
    if (!room) return;
    const player = room.state.players.get(socket.id);
    if (!player) return;
    const input = sanitizeInput(data.input || {});
    player.input = input;
    player.lastInputSeq = typeof data.seq === 'number' ? data.seq : player.lastInputSeq;
  });

  socket.on('disconnect', () => {
    const code = rooms.socketToRoom.get(socket.id);
    rooms.removePlayer(socket.id);
    if (code) sendPlayersUpdate(code);
  });
});

function sendPlayersUpdate(roomCode) {
  const room = rooms.getRoom(roomCode);
  if (!room) return;
  const players = Array.from(room.state.players.values()).map((p) => ({
    id: p.id,
    name: p.name
  }));
  io.to(roomCode).emit(EVENTS.PLAYERS_UPDATE, { roomCode, players });
}

function sanitizeInput(raw) {
  return {
    up: !!raw.up,
    down: !!raw.down,
    left: !!raw.left,
    right: !!raw.right,
    shoot: !!raw.shoot,
    angle: typeof raw.angle === 'number' ? clampAngle(raw.angle) : 0
  };
}

function clampAngle(a) {
  if (!Number.isFinite(a)) return 0;
  const twoPi = Math.PI * 2;
  let v = a % twoPi;
  if (v > Math.PI) v -= twoPi;
  if (v < -Math.PI) v += twoPi;
  return v;
}

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Serving client from /client (open in browser)`);
});
