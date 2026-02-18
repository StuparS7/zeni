module.exports = {
  TICK_RATE: 20, // physics ticks per second
  SNAPSHOT_RATE: 10, // snapshots to clients per second
  MAX_PLAYERS: 4,
  PLAYER_SPEED: 9, // units per second
  PLAYER_RADIUS: 0.6,
  PLAYER_MAX_HP: 100,
  DEFAULT_WEAPON_ID: 'pistol',
  WEAPONS: {
    pistol: { id: 'pistol', name: 'Pistol', damage: 12, range: 22, cooldownMs: 360, magSize: 15, reserveMax: 45 },
    rifle: { id: 'rifle', name: 'Rifle', damage: 32, range: 28, cooldownMs: 120, magSize: 30, reserveMax: 120 },
    shotgun: { id: 'shotgun', name: 'Shotgun', damage: 80, range: 14, cooldownMs: 550, magSize: 8, reserveMax: 40 }
  },
  WEAPON_PICKUP_RADIUS: 2.2,
  AMMO_PICKUP_RADIUS: 2.0,
  AMMO_PICKUP_AMOUNT: 20,
  AMMO_PICKUP_RESPAWN_MS: 12000,
  VEHICLE_SPEED: 16,
  VEHICLE_ACCEL: 28,
  VEHICLE_TURN_SPEED: 4.5,
  VEHICLE_DRAG: 2.2,
  VEHICLE_RADIUS: 1.6,
  VEHICLE_INTERACT_RADIUS: 2.2,
  ZOMBIE_SPEED: 2.7,
  ZOMBIE_RADIUS: 0.7,
  ZOMBIE_HP: 18,
  ZOMBIE_DAMAGE: 16,
  ZOMBIE_HIT_COOLDOWN_MS: 900,
  ZOMBIE_SPAWN_DELAY_MS: 1500,
  ZOMBIE_SPAWN_INTERVAL_MS: 1200,
  ZOMBIE_MAX: 30,
  ROUND_DURATION_MS: 120000,
  KILL_POINTS: 60,
  WORLD_BOUNDS: { minX: -120, maxX: 120, minY: -80, maxY: 80 }
};
