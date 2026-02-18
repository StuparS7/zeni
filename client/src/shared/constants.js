export const PLAYER_SPEED = 9;
export const INPUT_RATE_MS = 33; // ~30 Hz
export const SMOOTHING = 0.18;
export const PLAYER_RADIUS = 0.6;
export const SHOT_TTL = 0.12;
export const ZOMBIE_RADIUS = 0.7;
export const RENDER_SCALE = 20;
export const ISO_TILE_W = RENDER_SCALE * 2;
export const ISO_TILE_H = RENDER_SCALE;
export const DEFAULT_WEAPON_ID = 'pistol';
export const WEAPONS = {
  pistol: { id: 'pistol', name: 'Pistol', damage: 12, range: 22, cooldownMs: 360, magSize: 15, reserveMax: 45 },
  rifle: { id: 'rifle', name: 'Rifle', damage: 32, range: 28, cooldownMs: 120, magSize: 30, reserveMax: 120 },
  shotgun: { id: 'shotgun', name: 'Shotgun', damage: 80, range: 14, cooldownMs: 550, magSize: 8, reserveMax: 40 }
};
export const WEAPON_PICKUP_RADIUS = 2.2;
export const AMMO_PICKUP_RADIUS = 2.0;
export const VEHICLE_INTERACT_RADIUS = 2.2;
export const PLAYER_MAX_HP = 100;
export const WORLD_BOUNDS = { minX: -120, maxX: 120, minY: -80, maxY: 80 };
