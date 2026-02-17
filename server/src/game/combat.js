const { EVENTS } = require('../shared/schema');
const { SHOOT_COOLDOWN_MS, SHOOT_RANGE } = require('../shared/constants');
const { raycastObstacles } = require('./map');

function updateShooting(io, room, now = Date.now()) {
  room.state.players.forEach((p) => {
    if (!p.input.shoot) return;
    if (now - p.lastShotAt < SHOOT_COOLDOWN_MS) return;
    p.lastShotAt = now;

    const angle = Number.isFinite(p.input.angle) ? p.input.angle : 0;
    const dx = Math.cos(angle);
    const dy = Math.sin(angle);

    let dist = SHOOT_RANGE;
    const hit = raycastObstacles(p.x, p.y, dx, dy, SHOOT_RANGE);
    if (hit) dist = hit.distance;

    const ex = p.x + dx * dist;
    const ey = p.y + dy * dist;

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

module.exports = {
  updateShooting
};
