export function createInput(canvas) {
  const flags = {
    up: false,
    down: false,
    left: false,
    right: false,
    mouseAngle: 0
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
    flags.mouseAngle = Math.atan2(dy, dx);
  });

  return { flags };
}
