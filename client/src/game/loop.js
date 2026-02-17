import { PLAYER_SPEED, SMOOTHING } from '../shared/constants.js';
import { render } from './render.js';
import { resolvePlayerCollisions } from './map.js';

export function startLoop(state, input, ctx) {
  let last = performance.now();
  function frame(now) {
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    step(state, input, dt);
    render(ctx, state);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

function step(state, input, dt) {
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

  if (state.shots?.length) {
    state.shots.forEach((s) => {
      s.ttl -= dt;
    });
    state.shots = state.shots.filter((s) => s.ttl > 0);
  }
}
