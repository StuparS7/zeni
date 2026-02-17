export function createInput(canvas) {
  const flags = {
    up: false,
    down: false,
    left: false,
    right: false,
    angle: 0,
    shoot: false
  };

  const keys = {
    w: 'up',
    ArrowUp: 'up',
    s: 'down',
    ArrowDown: 'down',
    a: 'left',
    ArrowLeft: 'left',
    d: 'right',
    ArrowRight: 'right'
  };

  window.addEventListener('keydown', (e) => {
    const key = keys[e.key];
    if (key) {
      flags[key] = true;
    }
  });
  window.addEventListener('keyup', (e) => {
    const key = keys[e.key];
    if (key) {
      flags[key] = false;
    }
  });

  canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = e.clientX - cx;
    const dy = e.clientY - cy;
    flags.angle = Math.atan2(dy, dx);
  });

  canvas.addEventListener('mousedown', (e) => {
    if (e.button === 0) flags.shoot = true;
  });
  window.addEventListener('mouseup', (e) => {
    if (e.button === 0) flags.shoot = false;
  });

  return { flags };
}
