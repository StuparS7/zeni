const { WORLD_BOUNDS } = require('../shared/constants');

function createGameState() {
  return {
    players: new Map(),
    zombies: new Map(),
    lastSnapshot: 0,
    nextZombieId: 1,
    spawnEnabled: false,
    spawnStartAt: 0,
    nextSpawnAt: 0
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
    input: {
      up: false,
      down: false,
      left: false,
      right: false,
      shoot: false,
      angle: 0
    }
  };
}

module.exports = {
  createGameState,
  createPlayer
};
