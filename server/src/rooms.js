const { MAX_PLAYERS } = require('./shared/constants');
const { createGameState, createPlayer } = require('./game/gameState');

class Rooms {
  constructor() {
    this.rooms = new Map();
    this.socketToRoom = new Map();
  }

  ensureRoom(code) {
    if (!this.rooms.has(code)) {
      this.rooms.set(code, { code, state: createGameState() });
    }
    return this.rooms.get(code);
  }

  getRoom(code) {
    return this.rooms.get(code);
  }

  addPlayer(code, socketId, name) {
    const room = this.ensureRoom(code);
    if (room.state.players.size >= MAX_PLAYERS) {
      return { ok: false, reason: 'full' };
    }
    const player = createPlayer(socketId, name, room.state.players.size);
    room.state.players.set(socketId, player);
    this.socketToRoom.set(socketId, code);
    return { ok: true, room, player };
  }

  removePlayer(socketId) {
    const code = this.socketToRoom.get(socketId);
    if (!code) return;
    const room = this.rooms.get(code);
    if (!room) return;
    room.state.players.delete(socketId);
    this.socketToRoom.delete(socketId);
    if (room.state.players.size === 0) {
      this.rooms.delete(code);
    }
  }

  forEachRoom(cb) {
    this.rooms.forEach(cb);
  }
}

module.exports = Rooms;
