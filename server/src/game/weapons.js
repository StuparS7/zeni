const { WEAPONS, WEAPON_PICKUP_RADIUS } = require('../shared/constants');

const WEAPON_SPAWNS = [
  { id: 'wp-0', x: 2, y: 2, weaponId: 'pistol' },
  { id: 'wp-1', x: -12, y: -10, weaponId: 'rifle' },
  { id: 'wp-2', x: 12, y: -10, weaponId: 'shotgun' },
  { id: 'wp-3', x: -12, y: 12, weaponId: 'pistol' },
  { id: 'wp-4', x: 12, y: 12, weaponId: 'rifle' },

  // Inside buildings (hollow interiors)
  { id: 'wp-hn1', x: -50, y: -30, weaponId: 'shotgun' },
  { id: 'wp-hn3', x: -10, y: -30, weaponId: 'rifle' },
  { id: 'wp-hn5', x: 30, y: -30, weaponId: 'rifle' },
  { id: 'wp-hs2', x: -30, y: 30, weaponId: 'pistol' },
  { id: 'wp-hs4', x: 10, y: 30, weaponId: 'rifle' },
  { id: 'wp-hs6', x: 50, y: 30, weaponId: 'shotgun' },
  { id: 'wp-bw1', x: -78, y: -8, weaponId: 'rifle' },
  { id: 'wp-be2', x: 78, y: 18, weaponId: 'shotgun' }
];

function updateWeaponPickups(state, now) {
  state.players.forEach((p) => {
    if (!p.input.interact) return;
    if (now - p.lastInteractAt < 250) return;
    const spawn = findClosestSpawn(p.x, p.y);
    if (!spawn) return;
    const w = WEAPONS[spawn.weaponId];
    if (!w) return;
    p.weaponId = w.id;
    p.lastInteractAt = now;
  });
}

function findClosestSpawn(x, y) {
  let best = null;
  let bestDist = WEAPON_PICKUP_RADIUS * WEAPON_PICKUP_RADIUS;
  for (let i = 0; i < WEAPON_SPAWNS.length; i += 1) {
    const s = WEAPON_SPAWNS[i];
    const dx = s.x - x;
    const dy = s.y - y;
    const d2 = dx * dx + dy * dy;
    if (d2 <= bestDist) {
      bestDist = d2;
      best = s;
    }
  }
  return best;
}

module.exports = {
  WEAPON_SPAWNS,
  updateWeaponPickups
};
