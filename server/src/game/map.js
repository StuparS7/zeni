const { PLAYER_RADIUS } = require('../shared/constants');

const WALL_T = 1.4;
const DOOR_W = 3.2;

const SOLIDS = [
  { id: 'square-1', x: -8, y: -6, w: 10, h: 4, hgt: 0.4 },
  { id: 'square-2', x: 8, y: -6, w: 10, h: 4, hgt: 0.4 },
  { id: 'well', x: 0, y: 6, w: 4, h: 4, hgt: 0.8 }
];

const BUILDINGS = [
  // North row houses (two entrances each: N/S)
  { id: 'house-n1', x: -50, y: -30, w: 14, h: 10, hgt: 1.6, doors: ['N', 'S'] },
  { id: 'house-n2', x: -30, y: -30, w: 14, h: 10, hgt: 1.6, doors: ['N', 'S'] },
  { id: 'house-n3', x: -10, y: -30, w: 14, h: 10, hgt: 1.6, doors: ['N', 'S'] },
  { id: 'house-n4', x: 10, y: -30, w: 14, h: 10, hgt: 1.6, doors: ['N', 'S'] },
  { id: 'house-n5', x: 30, y: -30, w: 14, h: 10, hgt: 1.6, doors: ['N', 'S'] },
  { id: 'house-n6', x: 50, y: -30, w: 14, h: 10, hgt: 1.6, doors: ['N', 'S'] },

  // South row houses (two entrances each: N/S)
  { id: 'house-s1', x: -50, y: 30, w: 14, h: 10, hgt: 1.6, doors: ['N', 'S'] },
  { id: 'house-s2', x: -30, y: 30, w: 14, h: 10, hgt: 1.6, doors: ['N', 'S'] },
  { id: 'house-s3', x: -10, y: 30, w: 14, h: 10, hgt: 1.6, doors: ['N', 'S'] },
  { id: 'house-s4', x: 10, y: 30, w: 14, h: 10, hgt: 1.6, doors: ['N', 'S'] },
  { id: 'house-s5', x: 30, y: 30, w: 14, h: 10, hgt: 1.6, doors: ['N', 'S'] },
  { id: 'house-s6', x: 50, y: 30, w: 14, h: 10, hgt: 1.6, doors: ['N', 'S'] },

  // East/West barns (entrances on E/W)
  { id: 'barn-w1', x: -78, y: -8, w: 18, h: 12, hgt: 2.2, doors: ['E', 'W'] },
  { id: 'barn-w2', x: -78, y: 18, w: 18, h: 12, hgt: 2.2, doors: ['E', 'W'] },
  { id: 'barn-e1', x: 78, y: -8, w: 18, h: 12, hgt: 2.2, doors: ['E', 'W'] },
  { id: 'barn-e2', x: 78, y: 18, w: 18, h: 12, hgt: 2.2, doors: ['E', 'W'] }
];

const EDGE_WALLS = [
  { id: 'wall-north', x: 0, y: -58, w: 70, h: 3, hgt: 1.2 },
  { id: 'wall-south', x: 0, y: 58, w: 70, h: 3, hgt: 1.2 },
  { id: 'wall-west', x: -96, y: 0, w: 3, h: 70, hgt: 1.2 },
  { id: 'wall-east', x: 96, y: 0, w: 3, h: 70, hgt: 1.2 }
];

const OBSTACLES = [
  ...SOLIDS,
  ...EDGE_WALLS,
  ...buildWalls(BUILDINGS)
];

const ZOMBIE_SPAWNS = [
  { x: -110, y: -70 },
  { x: -60, y: -70 },
  { x: 0, y: -70 },
  { x: 60, y: -70 },
  { x: 110, y: -70 },
  { x: -110, y: 0 },
  { x: 110, y: 0 },
  { x: -110, y: 70 },
  { x: -60, y: 70 },
  { x: 0, y: 70 },
  { x: 60, y: 70 },
  { x: 110, y: 70 }
];

function resolvePlayerCollisions(player) {
  const result = resolveCircleCollisions(player.x, player.y, PLAYER_RADIUS);
  player.x = result.x;
  player.y = result.y;
}

function resolveCircleCollisions(x, y, radius) {
  let cx = x;
  let cy = y;
  for (let i = 0; i < OBSTACLES.length; i += 1) {
    const rect = OBSTACLES[i];
    const result = pushCircleOutOfRect(cx, cy, radius, rect);
    cx = result.x;
    cy = result.y;
  }
  return { x: cx, y: cy };
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
  resolveCircleCollisions,
  raycastObstacles,
  ZOMBIE_SPAWNS
};

function buildWalls(buildings) {
  const walls = [];
  buildings.forEach((b) => {
    const doors = new Set(b.doors || []);
    const halfW = b.w / 2;
    const halfH = b.h / 2;
    const hgt = b.hgt || 1.4;

    // North wall
    addWallSegment(walls, `${b.id}-n`, b.x, b.y - halfH + WALL_T / 2, b.w, WALL_T, hgt, doors.has('N'));
    // South wall
    addWallSegment(walls, `${b.id}-s`, b.x, b.y + halfH - WALL_T / 2, b.w, WALL_T, hgt, doors.has('S'));
    // West wall
    addWallSegmentVertical(walls, `${b.id}-w`, b.x - halfW + WALL_T / 2, b.y, WALL_T, b.h, hgt, doors.has('W'));
    // East wall
    addWallSegmentVertical(walls, `${b.id}-e`, b.x + halfW - WALL_T / 2, b.y, WALL_T, b.h, hgt, doors.has('E'));
  });
  return walls;
}

function addWallSegment(list, baseId, x, y, w, h, hgt, hasDoor) {
  if (!hasDoor) {
    list.push({ id: baseId, x, y, w, h, hgt });
    return;
  }
  const halfW = w / 2;
  const segLen = halfW - DOOR_W / 2;
  if (segLen <= 0) return;
  const leftX = x - DOOR_W / 2 - segLen / 2;
  const rightX = x + DOOR_W / 2 + segLen / 2;
  list.push({ id: `${baseId}-l`, x: leftX, y, w: segLen, h, hgt });
  list.push({ id: `${baseId}-r`, x: rightX, y, w: segLen, h, hgt });
}

function addWallSegmentVertical(list, baseId, x, y, w, h, hgt, hasDoor) {
  if (!hasDoor) {
    list.push({ id: baseId, x, y, w, h, hgt });
    return;
  }
  const halfH = h / 2;
  const segLen = halfH - DOOR_W / 2;
  if (segLen <= 0) return;
  const topY = y - DOOR_W / 2 - segLen / 2;
  const bottomY = y + DOOR_W / 2 + segLen / 2;
  list.push({ id: `${baseId}-t`, x, y: topY, w, h: segLen, hgt });
  list.push({ id: `${baseId}-b`, x, y: bottomY, w, h: segLen, hgt });
}
