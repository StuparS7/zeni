import {
  WORLD_BOUNDS,
  ISO_TILE_W,
  ISO_TILE_H,
  WEAPONS,
  CAMERA_TILT,
  PLAYER_SPRITE_FORCE_SINGLE,
  CAR_SPRITE_HIDE_LIGHTS,
  CAR_SPRITE_HIDE_SHADOW,
  CAR_SPRITE_SCALE,
  CAR_SPRITE_CLEAN_EDGES
} from '../shared/constants.js';

const BG = '#0e1624';
const OTHER_COLOR = '#c18cf9';
const SELF_COLOR = '#6ef5ff';
const OBSTACLE_FILL = '#2a3144';
const OBSTACLE_EDGE = '#55607a';
const ZOMBIE_COLOR = '#b84a4a';
const ZOMBIE_EDGE = '#5a1f1f';
const WEAPON_FILL = '#d1d6e2';
const WEAPON_EDGE = '#6b7280';
const AMMO_FILL = '#7fe6a3';
const AMMO_EDGE = '#2e8c5a';
const VEHICLE_FILL = '#2c3a4d';
const VEHICLE_EDGE = '#6f86ad';
const VEHICLE_ROOF = '#3a4c66';

const MINIMAP_BG = 'rgba(9, 12, 18, 0.8)';
const MINIMAP_BORDER = 'rgba(150, 170, 210, 0.45)';
const MINIMAP_OBSTACLE = 'rgba(42, 49, 68, 0.9)';

const playerSprite = new Image();
playerSprite.src = 'assets/player.png';
let playerSpriteReady = false;
playerSprite.onload = () => {
  playerSpriteReady = true;
};

const carSprite = new Image();
carSprite.src = 'assets/car.png';
let carSpriteReady = false;
let carSpriteTexture = null;
carSprite.onload = () => {
  carSpriteReady = true;
  carSpriteTexture = carSprite;
  if (CAR_SPRITE_HIDE_LIGHTS) {
    carSpriteTexture = buildCarSpriteTexture(carSprite);
  }
};
const PLAYER_SPRITE_FPS = 10;
const PLAYER_SPRITE_DIR_MAP_GRID = {
  idle: [4],
  n: [1],
  ne: [2],
  e: [5],
  se: [8],
  s: [7],
  sw: [6],
  w: [3],
  nw: [0]
};
const PLAYER_SPRITE_DIR_MAP_SINGLE = {
  idle: [0],
  n: [0],
  ne: [0],
  e: [0],
  se: [0],
  s: [0],
  sw: [0],
  w: [0],
  nw: [0]
};

export function render(ctx, state) {
  const canvas = ctx.canvas;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawFloor(ctx);

  const cam = getCamera(state);
  drawIsoGrid(ctx, cam);
  drawObstacles(ctx, state, cam);
  drawVehicles(ctx, state, cam);
  drawAmmoPickups(ctx, state, cam);
  drawZombies(ctx, state, cam);
  drawWeaponSpawns(ctx, state, cam);

  state.players.forEach((p) => {
    drawPlayer(ctx, p, state, cam, canvas);
  });

  drawShots(ctx, state, cam);
  drawMiniMap(ctx, state);
}

function drawIsoGrid(ctx, cam) {
  const bounds = WORLD_BOUNDS;
  if (!bounds) return;
  const step = 10;
  ctx.strokeStyle = 'rgba(255,255,255,0.035)';
  ctx.lineWidth = 1;
  for (let x = bounds.minX; x <= bounds.maxX; x += step) {
    const a = worldToScreen(x, bounds.minY, cam, ctx.canvas);
    const b = worldToScreen(x, bounds.maxY, cam, ctx.canvas);
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
  }
  for (let y = bounds.minY; y <= bounds.maxY; y += step) {
    const a = worldToScreen(bounds.minX, y, cam, ctx.canvas);
    const b = worldToScreen(bounds.maxX, y, cam, ctx.canvas);
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
  }
}

function drawObstacles(ctx, state, cam) {
  if (!state.obstacles?.length) return;
  state.obstacles.forEach((o) => {
    const p1 = worldToScreen(o.x - o.w / 2, o.y - o.h / 2, cam, ctx.canvas);
    const p2 = worldToScreen(o.x + o.w / 2, o.y - o.h / 2, cam, ctx.canvas);
    const p3 = worldToScreen(o.x + o.w / 2, o.y + o.h / 2, cam, ctx.canvas);
    const p4 = worldToScreen(o.x - o.w / 2, o.y + o.h / 2, cam, ctx.canvas);
    const height = (o.hgt || 0.6) * cam.scale;
    const p1t = { x: p1.x, y: p1.y - height };
    const p2t = { x: p2.x, y: p2.y - height };
    const p3t = { x: p3.x, y: p3.y - height };
    const p4t = { x: p4.x, y: p4.y - height };
    ctx.fillStyle = OBSTACLE_FILL;
    ctx.strokeStyle = OBSTACLE_EDGE;
    ctx.lineWidth = 2;
    // Top face
    ctx.beginPath();
    ctx.moveTo(p1t.x, p1t.y);
    ctx.lineTo(p2t.x, p2t.y);
    ctx.lineTo(p3t.x, p3t.y);
    ctx.lineTo(p4t.x, p4t.y);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Side faces (simple shading)
    ctx.fillStyle = 'rgba(26, 30, 40, 0.85)';
    ctx.beginPath();
    ctx.moveTo(p2t.x, p2t.y);
    ctx.lineTo(p3t.x, p3t.y);
    ctx.lineTo(p3.x, p3.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = 'rgba(18, 22, 30, 0.85)';
    ctx.beginPath();
    ctx.moveTo(p3t.x, p3t.y);
    ctx.lineTo(p4t.x, p4t.y);
    ctx.lineTo(p4.x, p4.y);
    ctx.lineTo(p3.x, p3.y);
    ctx.closePath();
    ctx.fill();
  });
}

function drawShots(ctx, state, cam) {
  if (!state.shots?.length) return;
  state.shots.forEach((s) => {
    const s0 = worldToScreen(s.sx, s.sy, cam, ctx.canvas);
    const s1 = worldToScreen(s.ex, s.ey, cam, ctx.canvas);
    const t = 1 - s.ttl / s.life;
    const bx = s0.x + (s1.x - s0.x) * Math.min(1, t * 1.2);
    const by = s0.y + (s1.y - s0.y) * Math.min(1, t * 1.2);
    ctx.fillStyle = `rgba(255, 245, 200, ${Math.max(0.25, s.ttl * 6)})`;
    ctx.beginPath();
    ctx.arc(bx, by, 3, 0, Math.PI * 2);
    ctx.fill();
  });
}

function drawZombies(ctx, state, cam) {
  if (!state.zombies?.size) return;
  state.zombies.forEach((z) => {
    const p = worldToScreen(z.renderX, z.renderY, cam, ctx.canvas);
    ctx.beginPath();
    ctx.fillStyle = ZOMBIE_COLOR;
    ctx.strokeStyle = ZOMBIE_EDGE;
    ctx.lineWidth = 2;
    ctx.arc(p.x, p.y, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  });
}

function drawWeaponSpawns(ctx, state, cam) {
  if (!state.weaponSpawns?.length) return;
  state.weaponSpawns.forEach((w) => {
    const p = worldToScreen(w.x, w.y, cam, ctx.canvas);
    const weaponId = w.weaponId || 'pistol';
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.fillStyle = WEAPON_FILL;
    ctx.strokeStyle = WEAPON_EDGE;
    ctx.lineWidth = 2;

    if (weaponId === 'rifle') {
      // Long rifle silhouette
      ctx.beginPath();
      ctx.roundRect(-16, -3, 28, 6, 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillRect(10, -2, 6, 4); // barrel
      ctx.fillRect(-18, -4, 6, 8); // stock
      ctx.fillRect(-4, 3, 4, 6); // grip
    } else if (weaponId === 'shotgun') {
      // Chunky shotgun silhouette
      ctx.beginPath();
      ctx.roundRect(-15, -4, 26, 8, 3);
      ctx.fill();
      ctx.stroke();
      ctx.fillRect(10, -3, 7, 6); // barrel
      ctx.fillRect(-18, -5, 6, 10); // stock
      ctx.fillStyle = '#b88f4e';
      ctx.fillRect(-3, -2, 8, 4); // pump
    } else {
      // Pistol silhouette
      ctx.beginPath();
      ctx.roundRect(-8, -3, 14, 6, 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillRect(4, -2, 6, 4); // barrel
      ctx.fillRect(-4, 3, 4, 6); // grip
    }
    ctx.restore();
  });
}

function drawAmmoPickups(ctx, state, cam) {
  if (!state.ammoPickups?.length) return;
  state.ammoPickups.forEach((a) => {
    if (!a.active) return;
    const p = worldToScreen(a.x, a.y, cam, ctx.canvas);
    ctx.fillStyle = AMMO_FILL;
    ctx.strokeStyle = AMMO_EDGE;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(p.x - 9, p.y - 7, 18, 14, 3);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = 'rgba(0,0,0,0.15)';
    ctx.fillRect(p.x - 8, p.y - 1, 16, 3);
    ctx.fillStyle = '#e7f3c2';
    ctx.beginPath();
    ctx.arc(p.x - 4, p.y - 3, 2, 0, Math.PI * 2);
    ctx.arc(p.x + 2, p.y - 3, 2, 0, Math.PI * 2);
    ctx.arc(p.x + 6, p.y + 2, 2, 0, Math.PI * 2);
    ctx.fill();
  });
}

function drawVehicles(ctx, state, cam) {
  if (!state.vehicles?.size) return;
  state.vehicles.forEach((v) => {
    const x = v.renderX ?? v.x;
    const y = v.renderY ?? v.y;
    const angle = Number.isFinite(v.angle) ? v.angle : 0;
    const center = worldToScreen(x, y, cam, ctx.canvas);
    const bodyLen = 4.2 * cam.scale;
    const bodyWid = 2.1 * cam.scale;
    const wheelW = bodyLen * 0.18;
    const wheelH = bodyWid * 0.18;

    ctx.save();
    ctx.translate(center.x, center.y);
    ctx.rotate(angle);

    // Shadow
    if (!CAR_SPRITE_HIDE_SHADOW) {
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.beginPath();
      ctx.ellipse(0, 0, bodyLen * 0.55, bodyWid * 0.55, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    if (carSpriteReady) {
      const sprite = carSpriteTexture || carSprite;
      const aspect = sprite.width / sprite.height;
      const spriteH = bodyWid * 2.0 * (CAR_SPRITE_SCALE || 1);
      const spriteW = spriteH * aspect;
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.globalAlpha = 1;
      ctx.drawImage(sprite, -spriteW / 2, -spriteH / 2, spriteW, spriteH);
    } else {
      // Body
      ctx.fillStyle = VEHICLE_FILL;
      ctx.strokeStyle = VEHICLE_EDGE;
      ctx.lineWidth = 2;
      roundedRect(ctx, -bodyLen / 2, -bodyWid / 2, bodyLen, bodyWid, bodyWid * 0.35);
      ctx.fill();
      ctx.stroke();

      // Hood + trunk lines
      ctx.strokeStyle = 'rgba(0,0,0,0.25)';
      ctx.beginPath();
      ctx.moveTo(bodyLen * 0.2, -bodyWid / 2 + 2);
      ctx.lineTo(bodyLen * 0.2, bodyWid / 2 - 2);
      ctx.moveTo(-bodyLen * 0.2, -bodyWid / 2 + 2);
      ctx.lineTo(-bodyLen * 0.2, bodyWid / 2 - 2);
      ctx.stroke();

      // Roof
      ctx.fillStyle = VEHICLE_ROOF;
      roundedRect(ctx, -bodyLen * 0.15, -bodyWid * 0.32, bodyLen * 0.45, bodyWid * 0.64, bodyWid * 0.25);
      ctx.fill();

      // Windshield
      ctx.fillStyle = 'rgba(120, 160, 200, 0.28)';
      ctx.beginPath();
      ctx.moveTo(bodyLen * 0.05, -bodyWid * 0.28);
      ctx.lineTo(bodyLen * 0.3, -bodyWid * 0.2);
      ctx.lineTo(bodyLen * 0.3, bodyWid * 0.2);
      ctx.lineTo(bodyLen * 0.05, bodyWid * 0.28);
      ctx.closePath();
      ctx.fill();
    }

    // Wheels (front wheels steer) for procedural car only
    if (!carSpriteReady) {
      ctx.fillStyle = '#0d1117';
      const steer = v.steer || 0;
      const rearX = -bodyLen * 0.32;
      const frontX = bodyLen * 0.22;
      const wheelY = bodyWid * 0.53;
      drawWheel(ctx, rearX, -wheelY, wheelW, wheelH, 0);
      drawWheel(ctx, rearX, wheelY, wheelW, wheelH, 0);
      drawWheel(ctx, frontX, -wheelY, wheelW, wheelH, steer);
      drawWheel(ctx, frontX, wheelY, wheelW, wheelH, steer);
    }

    // Headlights / taillights
    ctx.fillStyle = 'rgba(120, 200, 255, 0.9)';
    ctx.fillRect(bodyLen * 0.46, -bodyWid * 0.32, bodyLen * 0.06, bodyWid * 0.16);
    ctx.fillRect(bodyLen * 0.46, bodyWid * 0.16, bodyLen * 0.06, bodyWid * 0.16);
    ctx.fillStyle = 'rgba(255, 120, 120, 0.9)';
    ctx.fillRect(-bodyLen * 0.52, -bodyWid * 0.32, bodyLen * 0.06, bodyWid * 0.16);
    ctx.fillRect(-bodyLen * 0.52, bodyWid * 0.16, bodyLen * 0.06, bodyWid * 0.16);

    ctx.restore();
  });
}

function drawPlayer(ctx, p, state, cam, canvas) {
  if (p.inVehicle && p.vehicleId) return;
  const pos = worldToScreen(p.renderX, p.renderY, cam, canvas);
  const screenX = pos.x;
  const screenY = pos.y;
  const base = p.id === state.localId ? SELF_COLOR : OTHER_COLOR;
  const color = p.alive === false ? 'rgba(120,120,120,0.7)' : base;
  const jacket = p.alive === false ? 'rgba(90,90,90,0.7)' : (p.id === state.localId ? '#2b4c7a' : '#3a2f5f');
  const pants = p.alive === false ? 'rgba(70,70,70,0.7)' : '#1a1f2a';
  const skin = p.alive === false ? 'rgba(120,120,120,0.7)' : '#caa985';
  const hair = p.alive === false ? 'rgba(90,90,90,0.7)' : '#2b2b2b';
  const size = Math.max(12, cam.scale * 0.8);
  const bodyLen = size * 1.1;
  const bodyWid = size * 0.7;
  const headR = size * 0.3;

  // Removed blue selection box for local player

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath();
  ctx.ellipse(screenX, screenY + size * 0.12, size * 0.6, size * 0.4, 0, 0, Math.PI * 2);
  ctx.fill();

  // Body rotated to face movement direction
  const facing = Number.isFinite(p.facing) ? p.facing : 0;

  if (playerSpriteReady) {
    const spriteSize = size * 3.4;
    const layout = getSpriteLayout();
    const frameW = layout.frameW;
    const frameH = layout.frameH;
    const moving = !!p.moving;
    const t = performance.now() / 1000;
    const dir = directionFromAngle(facing);
    const frames = layout.dirMap[dir] || layout.dirMap.s;
    const idleFrame = layout.dirMap.idle ? layout.dirMap.idle[0] : frames[0];
    const frame = moving
      ? frames[Math.floor(t * PLAYER_SPRITE_FPS) % frames.length]
      : idleFrame;
    const fx = frame % layout.cols;
    const fy = Math.floor(frame / layout.cols);
    const sx = fx * frameW;
    const sy = fy * frameH;
    ctx.save();
    ctx.translate(screenX, screenY);
    if (layout.mode === 'single') {
      ctx.rotate(facing);
    }
    ctx.imageSmoothingEnabled = true;
    ctx.globalAlpha = p.alive === false ? 0.6 : 1;
    ctx.drawImage(
      playerSprite,
      sx,
      sy,
      frameW,
      frameH,
      -spriteSize / 2,
      -spriteSize / 2,
      spriteSize,
      spriteSize
    );
    ctx.restore();
  } else {
    ctx.save();
    ctx.translate(screenX, screenY);
    ctx.rotate(facing);
  // Legs (back)
  ctx.fillStyle = pants;
  ctx.beginPath();
  ctx.ellipse(-bodyLen * 0.45, -bodyWid * 0.18, size * 0.16, size * 0.24, 0, 0, Math.PI * 2);
  ctx.ellipse(-bodyLen * 0.45, bodyWid * 0.18, size * 0.16, size * 0.24, 0, 0, Math.PI * 2);
  ctx.fill();

  // Torso
  ctx.fillStyle = jacket;
  ctx.strokeStyle = 'rgba(0,0,0,0.35)';
  ctx.lineWidth = 2;
  roundedRect(ctx, -bodyLen * 0.25, -bodyWid * 0.45, bodyLen * 0.55, bodyWid * 0.9, size * 0.18);
  ctx.fill();
  ctx.stroke();

  // Arms
  ctx.fillStyle = jacket;
  roundedRect(ctx, bodyLen * 0.05, -bodyWid * 0.32, bodyLen * 0.18, bodyWid * 0.2, size * 0.1);
  ctx.fill();

  // Head (front)
  ctx.beginPath();
  ctx.fillStyle = skin;
  ctx.arc(bodyLen * 0.45, 0, headR, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.3)';
  ctx.stroke();

  // Hair cap
  ctx.fillStyle = hair;
  ctx.beginPath();
  ctx.arc(bodyLen * 0.48, -headR * 0.15, headR * 0.65, 0, Math.PI * 2);
  ctx.fill();

  // Gun cue
  ctx.fillStyle = '#2b2f3a';
  ctx.fillRect(bodyLen * 0.25, -bodyWid * 0.1, bodyLen * 0.28, bodyWid * 0.12);

  ctx.restore();
  }

  // Name tag
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.font = '12px Rajdhani';
  ctx.textAlign = 'center';
  ctx.fillText(p.name, screenX, screenY - size * 1.2);
}

let floorPattern = null;
function drawFloor(ctx) {
  const canvas = ctx.canvas;
  if (!floorPattern) {
    const tile = document.createElement('canvas');
    tile.width = 128;
    tile.height = 128;
    const tctx = tile.getContext('2d');
    tctx.fillStyle = '#1a202b';
    tctx.fillRect(0, 0, tile.width, tile.height);
    for (let i = 0; i < 700; i += 1) {
      const x = Math.random() * tile.width;
      const y = Math.random() * tile.height;
      const c = 30 + Math.random() * 40;
      tctx.fillStyle = `rgba(${c},${c + 5},${c + 10},0.15)`;
      tctx.fillRect(x, y, 2, 2);
    }
    tctx.strokeStyle = 'rgba(255,255,255,0.035)';
    for (let i = 0; i < 6; i += 1) {
      tctx.beginPath();
      tctx.moveTo(0, i * 20 + 10);
      tctx.lineTo(tile.width, i * 20 + 10);
      tctx.stroke();
    }
    floorPattern = ctx.createPattern(tile, 'repeat');
  }
  ctx.fillStyle = floorPattern;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Subtle vignette for depth without strong 3D feel
  const grad = ctx.createRadialGradient(
    canvas.width * 0.5, canvas.height * 0.45, 120,
    canvas.width * 0.5, canvas.height * 0.45, canvas.width
  );
  grad.addColorStop(0, 'rgba(0,0,0,0.0)');
  grad.addColorStop(1, 'rgba(0,0,0,0.25)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function roundedRect(ctx, x, y, w, h, r) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  ctx.lineTo(x + radius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

function drawWheel(ctx, x, y, w, h, angle) {
  ctx.save();
  ctx.translate(x, y);
  if (angle) ctx.rotate(angle);
  ctx.fillRect(-w / 2, -h / 2, w, h);
  ctx.restore();
}

function buildCarSpriteTexture(img) {
  const c = document.createElement('canvas');
  c.width = img.width;
  c.height = img.height;
  const cctx = c.getContext('2d');
  cctx.drawImage(img, 0, 0);
  const data = cctx.getImageData(0, 0, c.width, c.height);
  const w = data.width;
  const h = data.height;
  const leftBand = Math.floor(w * 0.14);
  const rightBand = Math.floor(w * 0.86);
  const d = data.data;
  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      if (x > leftBand && x < rightBand) continue;
      const i = (y * w + x) * 4;
      const r = d[i];
      const g = d[i + 1];
      const b = d[i + 2];
      const a = d[i + 3];
      if (a === 0) continue;
      const isRed = r > 170 && g < 120 && b < 120;
      const isBlue = b > 170 && r < 120 && g < 170;
      if (isRed || isBlue) {
        d[i + 3] = 0;
      }
    }
  }
  cctx.putImageData(data, 0, 0);
  return c;
}

function drawMiniMap(ctx, state) {
  const bounds = WORLD_BOUNDS;
  if (!bounds) return;
  const worldW = bounds.maxX - bounds.minX;
  const worldH = bounds.maxY - bounds.minY;
  if (worldW <= 0 || worldH <= 0) return;

  const canvas = ctx.canvas;
  const margin = 16;
  let mapW = Math.min(220, canvas.width * 0.28);
  mapW = Math.max(140, mapW);
  let mapH = mapW * (worldH / worldW);
  const maxH = canvas.height * 0.3;
  if (mapH > maxH) {
    mapH = maxH;
    mapW = mapH * (worldW / worldH);
  }
  const x = margin;
  const y = canvas.height - mapH - margin;

  ctx.save();
  ctx.fillStyle = MINIMAP_BG;
  ctx.strokeStyle = MINIMAP_BORDER;
  ctx.lineWidth = 2;
  ctx.fillRect(x, y, mapW, mapH);
  ctx.strokeRect(x, y, mapW, mapH);

  if (state.obstacles?.length) {
    ctx.fillStyle = MINIMAP_OBSTACLE;
    state.obstacles.forEach((o) => {
      const ox = x + ((o.x - o.w / 2 - bounds.minX) / worldW) * mapW;
      const oy = y + ((o.y - o.h / 2 - bounds.minY) / worldH) * mapH;
      const ow = (o.w / worldW) * mapW;
      const oh = (o.h / worldH) * mapH;
      ctx.fillRect(ox, oy, ow, oh);
    });
  }

  if (state.weaponSpawns?.length) {
    ctx.fillStyle = WEAPON_FILL;
    state.weaponSpawns.forEach((w) => {
      const px = x + ((w.x - bounds.minX) / worldW) * mapW;
      const py = y + ((w.y - bounds.minY) / worldH) * mapH;
      ctx.fillRect(px - 2, py - 2, 4, 4);
    });
  }

  if (state.ammoPickups?.length) {
    ctx.fillStyle = AMMO_FILL;
    state.ammoPickups.forEach((a) => {
      if (!a.active) return;
      const px = x + ((a.x - bounds.minX) / worldW) * mapW;
      const py = y + ((a.y - bounds.minY) / worldH) * mapH;
      ctx.fillRect(px - 1.5, py - 1.5, 3, 3);
    });
  }

  if (state.vehicles?.size) {
    state.vehicles.forEach((v) => {
      const px = x + (((v.renderX ?? v.x) - bounds.minX) / worldW) * mapW;
      const py = y + (((v.renderY ?? v.y) - bounds.minY) / worldH) * mapH;
      ctx.fillStyle = v.driverId ? '#9fd1ff' : '#6f86ad';
      ctx.fillRect(px - 2, py - 1, 4, 2);
    });
  }

  if (state.zombies?.size) {
    ctx.fillStyle = ZOMBIE_COLOR;
    state.zombies.forEach((z) => {
      const px = x + ((z.renderX - bounds.minX) / worldW) * mapW;
      const py = y + ((z.renderY - bounds.minY) / worldH) * mapH;
      ctx.beginPath();
      ctx.arc(px, py, 2.4, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  if (state.players?.size) {
    state.players.forEach((p) => {
      const px = x + ((p.renderX - bounds.minX) / worldW) * mapW;
      const py = y + ((p.renderY - bounds.minY) / worldH) * mapH;
      ctx.beginPath();
      ctx.fillStyle = p.id === state.localId ? SELF_COLOR : OTHER_COLOR;
      ctx.arc(px, py, p.id === state.localId ? 3.2 : 2.4, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  ctx.restore();
}

function getCamera(state) {
  const local = state.players.get(state.localId);
  return {
    x: local ? local.renderX : 0,
    y: local ? local.renderY : 0,
    scale: state.renderScale || 20
  };
}

function directionFromAngle(angle) {
  if (!Number.isFinite(angle)) return 's';
  const pi = Math.PI;
  const seg = pi / 8;
  if (angle >= -seg && angle < seg) return 'e';
  if (angle >= seg && angle < 3 * seg) return 'se';
  if (angle >= 3 * seg && angle < 5 * seg) return 's';
  if (angle >= 5 * seg && angle < 7 * seg) return 'sw';
  if (angle >= 7 * seg || angle < -7 * seg) return 'w';
  if (angle >= -7 * seg && angle < -5 * seg) return 'nw';
  if (angle >= -5 * seg && angle < -3 * seg) return 'n';
  return 'ne';
}

function getSpriteLayout() {
  if (PLAYER_SPRITE_FORCE_SINGLE) {
    return {
      cols: 1,
      rows: 1,
      dirMap: PLAYER_SPRITE_DIR_MAP_SINGLE,
      mode: 'single',
      frameW: playerSpriteReady ? playerSprite.width : 1,
      frameH: playerSpriteReady ? playerSprite.height : 1
    };
  }
  if (!playerSpriteReady) {
    return {
      cols: 1,
      rows: 1,
      dirMap: PLAYER_SPRITE_DIR_MAP_SINGLE,
      mode: 'single',
      frameW: 1,
      frameH: 1
    };
  }
  const gridCols = 3;
  const gridRows = 3;
  const canGrid =
    playerSprite.width >= gridCols * 16 &&
    playerSprite.height >= gridRows * 16;
  if (canGrid) {
    return {
      cols: gridCols,
      rows: gridRows,
      dirMap: PLAYER_SPRITE_DIR_MAP_GRID,
      mode: 'grid',
      frameW: Math.floor(playerSprite.width / gridCols),
      frameH: Math.floor(playerSprite.height / gridRows)
    };
  }
  return {
    cols: 1,
    rows: 1,
    dirMap: PLAYER_SPRITE_DIR_MAP_SINGLE,
    mode: 'single',
    frameW: playerSprite.width,
    frameH: playerSprite.height
  };
}

function worldToScreen(x, y, cam, canvas) {
  const dx = x - cam.x;
  const dy = y - cam.y;
  const scaleX = cam.scale;
  const scaleY = cam.scale * (CAMERA_TILT || 1);
  return {
    x: canvas.width / 2 + dx * scaleX,
    y: canvas.height / 2 + dy * scaleY
  };
}
