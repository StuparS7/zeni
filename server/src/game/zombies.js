const {
  ZOMBIE_SPEED,
  ZOMBIE_HP,
  ZOMBIE_RADIUS,
  ZOMBIE_SPAWN_DELAY_MS,
  ZOMBIE_SPAWN_INTERVAL_MS,
  ZOMBIE_MAX,
  ROUND_DURATION_MS,
  ZOMBIE_DAMAGE,
  ZOMBIE_HIT_COOLDOWN_MS,
  PLAYER_RADIUS,
  PLAYER_MAX_HP
} = require('../shared/constants');
const { resolveCircleCollisions, ZOMBIE_SPAWNS } = require('./map');

function updateZombies(state, dt, now) {
  handleRound(state, now);
  handleSpawning(state, now);
  if (state.zombies.size === 0) return;
  const players = Array.from(state.players.values()).filter((p) => p.alive);
  if (players.length === 0) return;

  state.zombies.forEach((z) => {
    const target = findNearestPlayer(z, players);
    if (!target) return;
    const dx = target.x - z.x;
    const dy = target.y - z.y;
    const mag = Math.hypot(dx, dy) || 1;
    z.x += (dx / mag) * ZOMBIE_SPEED * dt;
    z.y += (dy / mag) * ZOMBIE_SPEED * dt;
    const pushed = resolveCircleCollisions(z.x, z.y, ZOMBIE_RADIUS);
    z.x = pushed.x;
    z.y = pushed.y;
    tryDealDamage(z, target, now);
  });
}

function handleSpawning(state, now) {
  if (!state.spawnEnabled) return;
  if (now < state.spawnStartAt) return;
  if (now < state.nextSpawnAt) return;
  if (state.zombies.size >= ZOMBIE_MAX) return;

  spawnBatch(state);
  state.nextSpawnAt = now + ZOMBIE_SPAWN_INTERVAL_MS;
}

function spawnBatch(state) {
  for (let i = 0; i < ZOMBIE_SPAWNS.length; i += 1) {
    if (state.zombies.size >= ZOMBIE_MAX) return;
    const p = ZOMBIE_SPAWNS[i];
    const id = `z${state.nextZombieId++}`;
    state.zombies.set(id, {
      id,
      x: p.x,
      y: p.y,
      hp: ZOMBIE_HP,
      r: ZOMBIE_RADIUS,
      lastHitAt: 0
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

function handleRound(state, now) {
  if (state.players.size < 1) {
    state.spawnEnabled = false;
    state.round = 0;
    state.roundEndsAt = 0;
    state.roundActive = false;
    state.zombies.clear();
    return;
  }

  if (!state.roundActive) return;

  if (now >= state.roundEndsAt) {
    state.spawnEnabled = false;
    state.roundActive = false;
    state.zombies.clear();
    state.players.forEach((p) => {
      p.alive = true;
      p.hp = PLAYER_MAX_HP;
    });
  }
}

function startRound(state, now) {
  state.round = state.round > 0 ? state.round + 1 : 1;
  state.roundEndsAt = now + ROUND_DURATION_MS;
  state.spawnStartAt = now + ZOMBIE_SPAWN_DELAY_MS;
  state.nextSpawnAt = state.spawnStartAt;
  state.spawnEnabled = true;
  state.roundActive = true;
  state.players.forEach((p) => {
    p.alive = true;
    p.hp = PLAYER_MAX_HP;
  });
}

function tryDealDamage(zombie, player, now) {
  const dx = player.x - zombie.x;
  const dy = player.y - zombie.y;
  const dist = Math.hypot(dx, dy);
  const hitDist = ZOMBIE_RADIUS + PLAYER_RADIUS;
  if (dist > hitDist) return;
  if (now - zombie.lastHitAt < ZOMBIE_HIT_COOLDOWN_MS) return;
  zombie.lastHitAt = now;
  player.hp = Math.max(0, player.hp - ZOMBIE_DAMAGE);
  if (player.hp === 0) {
    player.alive = false;
  }
}

module.exports = {
  updateZombies,
  startRound
};
