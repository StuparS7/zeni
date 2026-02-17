const { PLAYER_RADIUS } = require('../shared/constants');

const OBSTACLES = [
  { id: 'crate-1', x: -6, y: 0, w: 4, h: 3 },
  { id: 'crate-2', x: 6, y: -2, w: 5, h: 2 },
  { id: 'pillar-1', x: 0, y: 6, w: 3, h: 3 }
];

function resolvePlayerCollisions(player) {
  let x = player.x;
  let y = player.y;
  for (let i = 0; i < OBSTACLES.length; i += 1) {
    const rect = OBSTACLES[i];
    const result = pushCircleOutOfRect(x, y, PLAYER_RADIUS, rect);
    x = result.x;
    y = result.y;
  }
  player.x = x;
  player.y = y;
}

function raycastObstacles(ox, oy, dx, dy, maxRange) {
  let best = null;
  for (let i = 0; i < OBSTACLES.length; i += 1) {
    const rect = OBSTACLES[i];
    const t = rayIntersectAABB(ox, oy, dx, dy, rect);
    if (t === null || t < 0 || t > maxRange) continue;
    if (!best || t < best.distance) {
      best = { distance: t, obstacleId: rect.id };
    }
  }
  return best;
}

function pushCircleOutOfRect(cx, cy, r, rect) {
  const halfW = rect.w / 2;
  const halfH = rect.h / 2;
  const minX = rect.x - halfW;
  const maxX = rect.x + halfW;
  const minY = rect.y - halfH;
  const maxY = rect.y + halfH;
  const nearestX = clamp(cx, minX, maxX);
  const nearestY = clamp(cy, minY, maxY);
  const dx = cx - nearestX;
  const dy = cy - nearestY;
  const distSq = dx * dx + dy * dy;
  if (distSq >= r * r) return { x: cx, y: cy };

  if (distSq === 0) {
    const left = cx - minX;
    const right = maxX - cx;
    const top = cy - minY;
    const bottom = maxY - cy;
    const minPen = Math.min(left, right, top, bottom);
    if (minPen === left) return { x: minX - r, y: cy };
    if (minPen === right) return { x: maxX + r, y: cy };
    if (minPen === top) return { x: cx, y: minY - r };
    return { x: cx, y: maxY + r };
  }

  const dist = Math.sqrt(distSq);
  const push = r - dist;
  const nx = dx / dist;
  const ny = dy / dist;
  return { x: cx + nx * push, y: cy + ny * push };
}

function rayIntersectAABB(ox, oy, dx, dy, rect) {
  const halfW = rect.w / 2;
  const halfH = rect.h / 2;
  const minX = rect.x - halfW;
  const maxX = rect.x + halfW;
  const minY = rect.y - halfH;
  const maxY = rect.y + halfH;

  let tmin = -Infinity;
  let tmax = Infinity;

  if (Math.abs(dx) < 1e-6) {
    if (ox < minX || ox > maxX) return null;
  } else {
    const tx1 = (minX - ox) / dx;
    const tx2 = (maxX - ox) / dx;
    tmin = Math.max(tmin, Math.min(tx1, tx2));
    tmax = Math.min(tmax, Math.max(tx1, tx2));
  }

  if (Math.abs(dy) < 1e-6) {
    if (oy < minY || oy > maxY) return null;
  } else {
    const ty1 = (minY - oy) / dy;
    const ty2 = (maxY - oy) / dy;
    tmin = Math.max(tmin, Math.min(ty1, ty2));
    tmax = Math.min(tmax, Math.max(ty1, ty2));
  }

  if (tmax < 0 || tmin > tmax) return null;
  const t = tmin >= 0 ? tmin : tmax;
  return t >= 0 ? t : null;
}

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

module.exports = {
  OBSTACLES,
  resolvePlayerCollisions,
  raycastObstacles
};
