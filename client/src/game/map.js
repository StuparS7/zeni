import { PLAYER_RADIUS } from '../shared/constants.js';

export function resolvePlayerCollisions(player, obstacles) {
  let x = player.renderX;
  let y = player.renderY;
  for (let i = 0; i < obstacles.length; i += 1) {
    const rect = obstacles[i];
    const result = pushCircleOutOfRect(x, y, PLAYER_RADIUS, rect);
    x = result.x;
    y = result.y;
  }
  player.renderX = x;
  player.renderY = y;
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

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}
