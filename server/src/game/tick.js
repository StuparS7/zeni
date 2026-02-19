const { EVENTS } = require('../shared/schema');
const { TICK_RATE, SNAPSHOT_RATE, PLAYER_SPEED, WORLD_BOUNDS } = require('../shared/constants');
const { resolvePlayerCollisions } = require('./map');
const { updateShooting } = require('./combat');
const { updateWeaponPickups } = require('./weapons');
const { updateZombies } = require('./zombies');
const { updateVehicles } = require('./vehicles');
const { updateAmmoPickups } = require('./ammo');

function startGameLoops(io, rooms) {
  const tickMs = 1000 / TICK_RATE;
  const snapshotMs = 1000 / SNAPSHOT_RATE;

  setInterval(() => {
    rooms.forEachRoom((room) => {
      const dt = tickMs / 1000;
      const now = Date.now();
      updateVehicles(room.state, dt, now);
      stepPlayers(room.state, dt);
      updateZombies(room.state, dt, now);
      updateAmmoPickups(room.state, now);
      updateWeaponPickups(room.state, now);
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
    if (!p.alive) return;
    if (p.inVehicle) return;
    const sdx = (p.input.right ? 1 : 0) + (p.input.left ? -1 : 0);
    const sdy = (p.input.down ? 1 : 0) + (p.input.up ? -1 : 0);
    if (sdx !== 0 || sdy !== 0) {
      const mag = Math.hypot(sdx, sdy) || 1;
      p.x += (sdx / mag) * PLAYER_SPEED * dt;
      p.y += (sdy / mag) * PLAYER_SPEED * dt;
    }
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
      lastInputSeq: p.lastInputSeq,
      score: p.score,
      weaponId: p.weaponId,
      ammo: p.ammo,
      hp: p.hp,
      alive: p.alive,
      inVehicle: p.inVehicle,
      vehicleId: p.vehicleId
    })),
    vehicles: room.state.vehicles.map((v) => ({
      id: v.id,
      x: v.x,
      y: v.y,
      angle: v.angle,
      driverId: v.driverId,
      steer: v.steer || 0
    })),
    ammoPickups: room.state.ammoPickups.map((a) => ({
      id: a.id,
      x: a.x,
      y: a.y,
      active: a.active
    })),
    zombies: Array.from(room.state.zombies.values()).map((z) => ({
      id: z.id,
      x: z.x,
      y: z.y,
      hp: z.hp
    })),
    round: room.state.round,
    roundActive: room.state.roundActive,
    roundTimeLeft: room.state.roundActive ? Math.max(0, room.state.roundEndsAt - Date.now()) : 0,
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
