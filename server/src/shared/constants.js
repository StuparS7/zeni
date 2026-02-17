module.exports = {
  TICK_RATE: 20, // physics ticks per second
  SNAPSHOT_RATE: 10, // snapshots to clients per second
  MAX_PLAYERS: 4,
  PLAYER_SPEED: 6, // units per second
  PLAYER_RADIUS: 0.6,
  SHOOT_RANGE: 18,
  SHOOT_COOLDOWN_MS: 180,
  SHOOT_DAMAGE: 10,
  ZOMBIE_SPEED: 2.2,
  ZOMBIE_RADIUS: 0.7,
  ZOMBIE_HP: 30,
  ZOMBIE_SPAWN_DELAY_MS: 3000,
  ZOMBIE_SPAWN_INTERVAL_MS: 3500,
  ZOMBIE_MAX: 24,
  WORLD_BOUNDS: { minX: -20, maxX: 20, minY: -12, maxY: 12 }
};
