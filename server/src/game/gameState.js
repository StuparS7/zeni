const { WORLD_BOUNDS, DEFAULT_WEAPON_ID, PLAYER_MAX_HP, WEAPONS } = require('../shared/constants');
const { createVehicles } = require('./vehicles');
const { createAmmoPickups } = require('./ammo');

function createGameState() {
  return {
    players: new Map(),
    zombies: new Map(),
    vehicles: createVehicles(),
    ammoPickups: createAmmoPickups(),
    lastSnapshot: 0,
    nextZombieId: 1,
    spawnEnabled: false,
    spawnStartAt: 0,
    nextSpawnAt: 0,
    round: 0,
    roundEndsAt: 0,
    roundActive: false
  };
}

function spawnPosition(index = 0) {
  // Simple fan-out spawn points inside bounds
  const offsets = [
    { x: 0, y: 0 },
    { x: 4, y: 0 },
    { x: -4, y: 0 },
    { x: 0, y: -4 }
  ];
  const pick = offsets[index % offsets.length];
  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
  return {
    x: clamp(pick.x, WORLD_BOUNDS.minX, WORLD_BOUNDS.maxX),
    y: clamp(pick.y, WORLD_BOUNDS.minY, WORLD_BOUNDS.maxY)
  };
}

function createPlayer(id, name, index) {
  const pos = spawnPosition(index);
  return {
    id,
    name,
    x: pos.x,
    y: pos.y,
    dir: 0,
    lastInputSeq: 0,
    lastShotAt: 0,
    lastInteractAt: 0,
    score: 0,
    hp: PLAYER_MAX_HP,
    alive: true,
    inVehicle: false,
    vehicleId: null,
    weaponId: DEFAULT_WEAPON_ID,
    ammo: initAmmo(),
    input: {
      up: false,
      down: false,
      left: false,
      right: false,
      shoot: false,
      angle: 0,
      interact: false
    }
  };
}

function initAmmo() {
  const ammo = {};
  Object.values(WEAPONS).forEach((w) => {
    ammo[w.id] = {
      mag: w.magSize,
      reserve: 0
    };
  });
  return ammo;
}

module.exports = {
  createGameState,
  createPlayer
};
