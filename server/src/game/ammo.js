const { AMMO_PICKUP_RADIUS, AMMO_PICKUP_AMOUNT, AMMO_PICKUP_RESPAWN_MS, WEAPONS, MAP_SCALE } = require('../shared/constants');

const AMMO_SPAWNS = [
  { id: 'ammo-1', x: -6, y: -2 },
  { id: 'ammo-2', x: 6, y: -2 },
  { id: 'ammo-3', x: -40, y: -30 },
  { id: 'ammo-4', x: 40, y: 30 },
  { id: 'ammo-5', x: 78, y: -8 }
].map(scaleSpawn);

function createAmmoPickups() {
  return AMMO_SPAWNS.map((s) => ({
    id: s.id,
    x: s.x,
    y: s.y,
    active: true,
    respawnAt: 0
  }));
}

function updateAmmoPickups(state, now) {
  state.ammoPickups.forEach((a) => {
    if (!a.active && now >= a.respawnAt) {
      a.active = true;
    }
  });

  state.players.forEach((p) => {
    if (!p.input.interact) return;
    if (now - p.lastInteractAt < 250) return;
    const pickup = findNearestAmmo(p, state.ammoPickups);
    if (!pickup) return;
    pickup.active = false;
    pickup.respawnAt = now + AMMO_PICKUP_RESPAWN_MS;
    p.lastInteractAt = now;

    const weapon = WEAPONS[p.weaponId] || WEAPONS.pistol;
    const ammo = p.ammo[weapon.id];
    const newReserve = Math.min(weapon.reserveMax, ammo.reserve + AMMO_PICKUP_AMOUNT);
    ammo.reserve = newReserve;
  });
}

function findNearestAmmo(p, ammoPickups) {
  let best = null;
  let bestD2 = AMMO_PICKUP_RADIUS * AMMO_PICKUP_RADIUS;
  ammoPickups.forEach((a) => {
    if (!a.active) return;
    const dx = a.x - p.x;
    const dy = a.y - p.y;
    const d2 = dx * dx + dy * dy;
    if (d2 <= bestD2) {
      bestD2 = d2;
      best = a;
    }
  });
  return best;
}

module.exports = {
  createAmmoPickups,
  updateAmmoPickups
};

function scaleSpawn(s) {
  return { ...s, x: s.x * MAP_SCALE, y: s.y * MAP_SCALE };
}
