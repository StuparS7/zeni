const { EVENTS } = require('../shared/schema');
const { KILL_POINTS, WEAPONS, DEFAULT_WEAPON_ID } = require('../shared/constants');
const { raycastObstacles } = require('./map');

function updateShooting(io, room, now = Date.now()) {
  room.state.players.forEach((p) => {
    if (!p.alive) return;
    if (!p.input.shoot) return;
    const weapon = WEAPONS[p.weaponId] || WEAPONS[DEFAULT_WEAPON_ID];
    if (!weapon) return;
    if (now - p.lastShotAt < weapon.cooldownMs) return;

    const ammo = p.ammo[weapon.id];
    if (!ammo) return;
    if (ammo.mag <= 0) {
      if (ammo.reserve > 0) {
        const load = Math.min(weapon.magSize, ammo.reserve);
        ammo.mag = load;
        ammo.reserve -= load;
      }
    }
    if (ammo.mag <= 0) return;
    p.lastShotAt = now;
    ammo.mag -= 1;

    const angle = Number.isFinite(p.input.angle) ? p.input.angle : 0;
    const dx = Math.cos(angle);
    const dy = Math.sin(angle);

    let maxDist = weapon.range;
    const obsHit = raycastObstacles(p.x, p.y, dx, dy, maxDist);
    if (obsHit) maxDist = obsHit.distance;

    const zombieHit = raycastZombies(room.state, p.x, p.y, dx, dy, maxDist);
    let hitDist = maxDist;
    let hitZombie = null;
    if (zombieHit && zombieHit.distance <= maxDist) {
      hitDist = zombieHit.distance;
      hitZombie = zombieHit.zombie;
    }

    const ex = p.x + dx * hitDist;
    const ey = p.y + dy * hitDist;

    if (hitZombie) {
      hitZombie.hp -= weapon.damage;
      if (hitZombie.hp <= 0) {
        room.state.zombies.delete(hitZombie.id);
        p.score += KILL_POINTS;
      }
    }

    io.to(room.code).emit(EVENTS.SHOT, {
      shooterId: p.id,
      weaponId: weapon.id,
      sx: p.x,
      sy: p.y,
      ex,
      ey,
      time: now
    });
  });
}

function raycastZombies(state, ox, oy, dx, dy, maxRange) {
  let best = null;
  state.zombies.forEach((z) => {
    const hit = rayIntersectCircle(ox, oy, dx, dy, z.x, z.y, z.r, maxRange);
    if (hit === null) return;
    if (!best || hit < best.distance) {
      best = { distance: hit, zombie: z };
    }
  });
  return best;
}

function rayIntersectCircle(ox, oy, dx, dy, cx, cy, r, maxRange) {
  const lx = cx - ox;
  const ly = cy - oy;
  const t = lx * dx + ly * dy;
  if (t < 0 || t > maxRange) return null;
  const d2 = lx * lx + ly * ly - t * t;
  const r2 = r * r;
  if (d2 > r2) return null;
  const thc = Math.sqrt(Math.max(0, r2 - d2));
  const t0 = t - thc;
  const t1 = t + thc;
  if (t0 >= 0) return t0;
  if (t1 >= 0) return t1;
  return null;
}

module.exports = {
  updateShooting
};
