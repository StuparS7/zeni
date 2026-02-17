const BG = '#0e1624';
const OTHER_COLOR = '#c18cf9';
const SELF_COLOR = '#6ef5ff';
const OBSTACLE_FILL = '#2a3144';
const OBSTACLE_EDGE = '#55607a';
const ZOMBIE_COLOR = '#b84a4a';
const ZOMBIE_EDGE = '#5a1f1f';

export function render(ctx, state) {
  const canvas = ctx.canvas;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  drawGrid(ctx);
  drawObstacles(ctx, state);
  drawShots(ctx, state);
  drawZombies(ctx, state);

  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  state.players.forEach((p) => {
    const screenX = centerX + p.renderX * 12;
    const screenY = centerY + p.renderY * 12;
    ctx.beginPath();
    ctx.fillStyle = p.id === state.localId ? SELF_COLOR : OTHER_COLOR;
    ctx.strokeStyle = 'rgba(0,0,0,0.3)';
    ctx.lineWidth = 2;
    ctx.arc(screenX, screenY, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.font = '12px Segoe UI';
    ctx.textAlign = 'center';
    ctx.fillText(p.name, screenX, screenY - 20);
  });
}

function drawGrid(ctx) {
  const { width, height } = ctx.canvas;
  ctx.strokeStyle = 'rgba(255,255,255,0.05)';
  ctx.lineWidth = 1;
  const step = 40;
  for (let x = width / 2 % step; x < width; x += step) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  for (let y = height / 2 % step; y < height; y += step) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }
}

function drawObstacles(ctx, state) {
  if (!state.obstacles?.length) return;
  const centerX = ctx.canvas.width / 2;
  const centerY = ctx.canvas.height / 2;
  state.obstacles.forEach((o) => {
    const screenX = centerX + o.x * 12;
    const screenY = centerY + o.y * 12;
    const w = o.w * 12;
    const h = o.h * 12;
    ctx.fillStyle = OBSTACLE_FILL;
    ctx.strokeStyle = OBSTACLE_EDGE;
    ctx.lineWidth = 2;
    ctx.fillRect(screenX - w / 2, screenY - h / 2, w, h);
    ctx.strokeRect(screenX - w / 2, screenY - h / 2, w, h);
  });
}

function drawShots(ctx, state) {
  if (!state.shots?.length) return;
  const centerX = ctx.canvas.width / 2;
  const centerY = ctx.canvas.height / 2;
  state.shots.forEach((s) => {
    const sx = centerX + s.sx * 12;
    const sy = centerY + s.sy * 12;
    const ex = centerX + s.ex * 12;
    const ey = centerY + s.ey * 12;
    ctx.strokeStyle = `rgba(255, 245, 200, ${Math.max(0.2, s.ttl * 6)})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(ex, ey);
    ctx.stroke();
  });
}

function drawZombies(ctx, state) {
  if (!state.zombies?.size) return;
  const centerX = ctx.canvas.width / 2;
  const centerY = ctx.canvas.height / 2;
  state.zombies.forEach((z) => {
    const screenX = centerX + z.renderX * 12;
    const screenY = centerY + z.renderY * 12;
    ctx.beginPath();
    ctx.fillStyle = ZOMBIE_COLOR;
    ctx.strokeStyle = ZOMBIE_EDGE;
    ctx.lineWidth = 2;
    ctx.arc(screenX, screenY, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  });
}
