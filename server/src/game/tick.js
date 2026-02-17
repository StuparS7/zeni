const { EVENTS } = require('../shared/schema');
const { TICK_RATE, SNAPSHOT_RATE, PLAYER_SPEED, WORLD_BOUNDS } = require('../shared/constants');
const { resolvePlayerCollisions } = require('./map');
const { updateShooting } = require('./combat');
const { updateZombies } = require('./zombies');

function startGameLoops(io, rooms) {
  const tickMs = 1000 / TICK_RATE;
  const snapshotMs = 1000 / SNAPSHOT_RATE;

  setInterval(() => {
    rooms.forEachRoom((room) => {
      const dt = tickMs / 1000;
      const now = Date.now();
      stepPlayers(room.state, dt);
      updateZombies(room.state, dt, now);
      updateShooting(io, room, now);
      room.state.lastSnapshot += tickMs;
      if (room.state.lastSnapshot >= snapshotMs) {
        room.state.lastSnapshot = 0;
        sendSnapshot(io, room);
      }
    });
  }, tickMs);
}

function stepPlayers(state, dt) {
  state.players.forEach((p) => {
    const dx = (p.input.right ? 1 : 0) + (p.input.left ? -1 : 0);
    const dy = (p.input.down ? 1 : 0) + (p.input.up ? -1 : 0);
    const mag = Math.hypot(dx, dy) || 1;
    const nx = dx / mag;
    const ny = dy / mag;
    p.x += nx * PLAYER_SPEED * dt;
    p.y += ny * PLAYER_SPEED * dt;
    p.x = clamp(p.x, WORLD_BOUNDS.minX, WORLD_BOUNDS.maxX);
    p.y = clamp(p.y, WORLD_BOUNDS.minY, WORLD_BOUNDS.maxY);
    resolvePlayerCollisions(p);
  });
}

function sendSnapshot(io, room) {
  const payload = {
    roomCode: room.code,
    players: Array.from(room.state.players.values()).map((p) => ({
      id: p.id,
      name: p.name,
      x: p.x,
      y: p.y,
      lastInputSeq: p.lastInputSeq
    })),
    zombies: Array.from(room.state.zombies.values()).map((z) => ({
      id: z.id,
      x: z.x,
      y: z.y,
      hp: z.hp
    })),
    serverTime: Date.now()
  };
  io.to(room.code).emit(EVENTS.SNAPSHOT, payload);
}

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

module.exports = {
  startGameLoops
};
