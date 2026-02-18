const {
  VEHICLE_SPEED,
  VEHICLE_ACCEL,
  VEHICLE_TURN_SPEED,
  VEHICLE_DRAG,
  VEHICLE_RADIUS,
  VEHICLE_INTERACT_RADIUS,
  WORLD_BOUNDS,
  PLAYER_RADIUS
} = require('../shared/constants');
const { resolveCircleCollisions } = require('./map');

function createVehicles() {
  return [
    { id: 'car-1', x: 6, y: 8, angle: 0, driverId: null, vx: 0, vy: 0 }
  ];
}

function updateVehicles(state, dt, now) {
  handleVehicleInteract(state, now);

  state.vehicles.forEach((v) => {
    const driver = v.driverId ? state.players.get(v.driverId) : null;
    if (v.driverId && !driver) {
      v.driverId = null;
    }

    if (driver) {
      const throttle = (driver.input.up ? 1 : 0) + (driver.input.down ? -1 : 0);
      const steer = (driver.input.right ? 1 : 0) + (driver.input.left ? -1 : 0);
      const speed = Math.hypot(v.vx, v.vy);

      if (steer !== 0 && (speed > 0.2 || throttle !== 0)) {
        const steerDir = throttle < 0 ? -1 : 1;
        v.angle += steer * VEHICLE_TURN_SPEED * dt * steerDir;
      }

      if (throttle !== 0) {
        const accel = throttle * VEHICLE_ACCEL * dt;
        v.vx += Math.cos(v.angle) * accel;
        v.vy += Math.sin(v.angle) * accel;
      }
    }

    // Drag for drift feel
    const drag = Math.exp(-VEHICLE_DRAG * dt);
    v.vx *= drag;
    v.vy *= drag;

    const speed = Math.hypot(v.vx, v.vy);
    const maxSpeed = v.driverId && state.players.get(v.driverId)?.input?.down ? VEHICLE_SPEED * 0.6 : VEHICLE_SPEED;
    if (speed > maxSpeed) {
      const scale = maxSpeed / speed;
      v.vx *= scale;
      v.vy *= scale;
    }

    if (speed > 0.05) {
      v.x += v.vx * dt;
      v.y += v.vy * dt;
      v.x = clamp(v.x, WORLD_BOUNDS.minX, WORLD_BOUNDS.maxX);
      v.y = clamp(v.y, WORLD_BOUNDS.minY, WORLD_BOUNDS.maxY);
      const pushed = resolveCircleCollisions(v.x, v.y, VEHICLE_RADIUS);
      if (pushed.x !== v.x || pushed.y !== v.y) {
        v.vx *= 0.4;
        v.vy *= 0.4;
      }
      v.x = pushed.x;
      v.y = pushed.y;
    }

    if (driver) {
      driver.x = v.x;
      driver.y = v.y;
    }
  });
}

function handleVehicleInteract(state, now) {
  state.players.forEach((p) => {
    if (!p.input.interact) return;
    if (now - p.lastInteractAt < 250) return;
    const nearest = findNearestVehicle(p, state.vehicles);
    if (!nearest) return;
    p.lastInteractAt = now;

    if (p.inVehicle && p.vehicleId === nearest.id && nearest.driverId === p.id) {
      // Exit vehicle
      nearest.driverId = null;
      p.inVehicle = false;
      p.vehicleId = null;
      p.x = nearest.x + VEHICLE_RADIUS + PLAYER_RADIUS + 0.4;
      p.y = nearest.y;
      return;
    }

    if (!p.inVehicle && !nearest.driverId) {
      nearest.driverId = p.id;
      p.inVehicle = true;
      p.vehicleId = nearest.id;
      p.x = nearest.x;
      p.y = nearest.y;
    }
  });
}

function findNearestVehicle(p, vehicles) {
  let best = null;
  let bestD2 = VEHICLE_INTERACT_RADIUS * VEHICLE_INTERACT_RADIUS;
  vehicles.forEach((v) => {
    const dx = v.x - p.x;
    const dy = v.y - p.y;
    const d2 = dx * dx + dy * dy;
    if (d2 <= bestD2) {
      bestD2 = d2;
      best = v;
    }
  });
  return best;
}

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function lerpAngle(current, target, maxStep) {
  let diff = target - current;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  const step = Math.max(-maxStep, Math.min(maxStep, diff));
  return current + step;
}

module.exports = {
  createVehicles,
  updateVehicles
};
