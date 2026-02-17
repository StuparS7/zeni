const { EVENTS } = require('../shared/schema');
const { SHOOT_COOLDOWN_MS, SHOOT_RANGE, SHOOT_DAMAGE } = require('../shared/constants');
const { raycastObstacles } = require('./map');

function updateShooting(io, room, now = Date.now()) {
  room.state.players.forEach((p) => {
    if (!p.input.shoot) return;
    if (now - p.lastShotAt < SHOOT_COOLDOWN_MS) return;
    p.lastShotAt = now;

    const angle = Number.isFinite(p.input.angle) ? p.input.angle : 0;
    const dx = Math.cos(angle);
    const dy = Math.sin(angle);

    let maxDist = SHOOT_RANGE;
    const obsHit = raycastObstacles(p.x, p.y, dx, dy, SHOOT_RANGE);
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
      hitZombie.hp -= SHOOT_DAMAGE;
      if (hitZombie.hp <= 0) {
        room.state.zombies.delete(hitZombie.id);
      }
    }

    io.to(room.code).emit(EVENTS.SHOT, {
      shooterId: p.id,
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
