const {
  ZOMBIE_SPEED,
  ZOMBIE_HP,
  ZOMBIE_RADIUS,
  ZOMBIE_SPAWN_DELAY_MS,
  ZOMBIE_SPAWN_INTERVAL_MS,
  ZOMBIE_MAX,
  WORLD_BOUNDS
} = require('../shared/constants');

const SPAWN_POINTS = [
  { x: WORLD_BOUNDS.minX + 1, y: WORLD_BOUNDS.minY + 1 },
  { x: 0, y: WORLD_BOUNDS.minY + 1 },
  { x: WORLD_BOUNDS.maxX - 1, y: WORLD_BOUNDS.minY + 1 },
  { x: WORLD_BOUNDS.minX + 1, y: 0 },
  { x: WORLD_BOUNDS.maxX - 1, y: 0 },
  { x: WORLD_BOUNDS.minX + 1, y: WORLD_BOUNDS.maxY - 1 },
  { x: 0, y: WORLD_BOUNDS.maxY - 1 },
  { x: WORLD_BOUNDS.maxX - 1, y: WORLD_BOUNDS.maxY - 1 }
];

function updateZombies(state, dt, now) {
  handleSpawning(state, now);
  if (state.zombies.size === 0) return;
  const players = Array.from(state.players.values());
  if (players.length === 0) return;

  state.zombies.forEach((z) => {
    const target = findNearestPlayer(z, players);
    if (!target) return;
    const dx = target.x - z.x;
    const dy = target.y - z.y;
    const mag = Math.hypot(dx, dy) || 1;
    z.x += (dx / mag) * ZOMBIE_SPEED * dt;
    z.y += (dy / mag) * ZOMBIE_SPEED * dt;
  });
}

function handleSpawning(state, now) {
  if (state.players.size < 2) return;

  if (!state.spawnEnabled) {
    state.spawnEnabled = true;
    state.spawnStartAt = now + ZOMBIE_SPAWN_DELAY_MS;
    state.nextSpawnAt = state.spawnStartAt;
  }

  if (now < state.spawnStartAt) return;
  if (now < state.nextSpawnAt) return;
  if (state.zombies.size >= ZOMBIE_MAX) return;

  spawnBatch(state);
  state.nextSpawnAt = now + ZOMBIE_SPAWN_INTERVAL_MS;
}

function spawnBatch(state) {
  for (let i = 0; i < SPAWN_POINTS.length; i += 1) {
    if (state.zombies.size >= ZOMBIE_MAX) return;
    const p = SPAWN_POINTS[i];
    const id = `z${state.nextZombieId++}`;
    state.zombies.set(id, {
      id,
      x: p.x,
      y: p.y,
      hp: ZOMBIE_HP,
      r: ZOMBIE_RADIUS
    });
  }
}

function findNearestPlayer(z, players) {
  let best = null;
  let bestDist = Infinity;
  for (let i = 0; i < players.length; i += 1) {
    const p = players[i];
    const dx = p.x - z.x;
    const dy = p.y - z.y;
    const d2 = dx * dx + dy * dy;
    if (d2 < bestDist) {
      bestDist = d2;
      best = p;
    }
  }
  return best;
}

module.exports = {
  updateZombies
};
