const {
  AMMO_PICKUP_RADIUS,
  AMMO_PICKUP_AUTO_RADIUS,
  AMMO_PICKUP_AMOUNT,
  AMMO_PICKUP_RESPAWN_MS,
  WEAPONS,
  MAP_SCALE
} = require('../shared/constants');

const AMMO_SPAWNS = [
  { id: 'ammo-1', x: -6, y: -2 },
  { id: 'ammo-2', x: 6, y: -2 },
  { id: 'ammo-3', x: -40, y: -30 },
  { id: 'ammo-4', x: 40, y: 30 },
  { id: 'ammo-5', x: 78, y: -8 }
].concat(generateAmmoSpawns()).map(scaleSpawn);

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
    if (p.inVehicle) {
      const pickup = findNearestAmmo(p, state.ammoPickups, AMMO_PICKUP_AUTO_RADIUS);
      if (!pickup) return;
      pickup.active = false;
      pickup.respawnAt = now + AMMO_PICKUP_RESPAWN_MS;
      const weapon = WEAPONS[p.weaponId] || WEAPONS.pistol;
      const ammo = p.ammo[weapon.id];
      const newReserve = Math.min(weapon.reserveMax, ammo.reserve + AMMO_PICKUP_AMOUNT);
      ammo.reserve = newReserve;
      return;
    }

    if (!p.input.interact) return;
    if (now - p.lastInteractAt < 250) return;
    const pickup = findNearestAmmo(p, state.ammoPickups, AMMO_PICKUP_RADIUS);
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

function findNearestAmmo(p, ammoPickups, radius) {
  let best = null;
  let bestD2 = radius * radius;
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

function generateAmmoSpawns() {
  const extra = [];
  let idx = 6;
  const rows = 4;
  const cols = 6;
  const startX = -80;
  const startY = -40;
  const gapX = 28;
  const gapY = 26;
  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      extra.push({ id: `ammo-${idx++}`, x: startX + c * gapX, y: startY + r * gapY });
    }
  }
  // extra scatter near edges
  extra.push(
    { id: `ammo-${idx++}`, x: 95, y: -70 },
    { id: `ammo-${idx++}`, x: -95, y: 70 },
    { id: `ammo-${idx++}`, x: 120, y: 40 },
    { id: `ammo-${idx++}`, x: -120, y: -40 }
  );
  return extra;
}
