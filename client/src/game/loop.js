import { PLAYER_SPEED, SMOOTHING } from '../shared/constants.js';
import { render } from './render.js';
import { resolvePlayerCollisions } from './map.js';

export function startLoop(state, input, ctx) {
  let last = performance.now();
  function frame(now) {
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    resizeCanvas(ctx.canvas);
    state.__canvasWidth = ctx.canvas.width;
    state.__canvasHeight = ctx.canvas.height;
    step(state, input, dt);
    render(ctx, state);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

function step(state, input, dt) {
  // Update aim angle from mouse position relative to local player screen position
  const local = state.players.get(state.localId);
  if (local && input.mouse) {
    const centerX = state.__canvasWidth ? state.__canvasWidth / 2 : 0;
    const centerY = state.__canvasHeight ? state.__canvasHeight / 2 : 0;
    const px = centerX + local.renderX * 12;
    const py = centerY + local.renderY * 12;
    const dx = input.mouse.x - px;
    const dy = input.mouse.y - py;
    input.flags.angle = Math.atan2(dy, dx);
  }

  state.players.forEach((p) => {
    // client-side prediction for our own player
    if (p.id === state.localId) {
      const dx = (input.flags.right ? 1 : 0) + (input.flags.left ? -1 : 0);
      const dy = (input.flags.down ? 1 : 0) + (input.flags.up ? -1 : 0);
      const mag = Math.hypot(dx, dy) || 1;
      p.renderX += (dx / mag) * PLAYER_SPEED * dt;
      p.renderY += (dy / mag) * PLAYER_SPEED * dt;
      if (state.obstacles?.length) {
        resolvePlayerCollisions(p, state.obstacles);
      }
    }
    // reconcile toward server truth
    p.renderX += (p.targetX - p.renderX) * SMOOTHING;
    p.renderY += (p.targetY - p.renderY) * SMOOTHING;
  });

  state.zombies?.forEach((z) => {
    z.renderX += (z.targetX - z.renderX) * SMOOTHING;
    z.renderY += (z.targetY - z.renderY) * SMOOTHING;
  });

  if (state.shots?.length) {
    state.shots.forEach((s) => {
      s.ttl -= dt;
    });
    state.shots = state.shots.filter((s) => s.ttl > 0);
  }
}

function resizeCanvas(canvas) {
  const rect = canvas.getBoundingClientRect();
  const width = Math.max(1, Math.floor(rect.width));
  const height = Math.max(1, Math.floor(rect.height));
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }
}
