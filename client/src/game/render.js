const BG = '#0e1624';
const OTHER_COLOR = '#c18cf9';
const SELF_COLOR = '#6ef5ff';

export function render(ctx, state) {
  const canvas = ctx.canvas;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  drawGrid(ctx);

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
