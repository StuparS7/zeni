export function createInput(canvas) {
  const flags = {
    up: false,
    down: false,
    left: false,
    right: false,
    angle: 0,
    shoot: false,
    interact: false,
    enter: false,
    drift: false
  };
  const mouse = { x: 0, y: 0 };

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
    if (e.key === 'e' || e.key === 'E') flags.interact = true;
    if (e.key === 'q' || e.key === 'Q') flags.enter = true;
    if (e.code === 'Space') flags.drift = true;
  });
  window.addEventListener('keyup', (e) => {
    const key = keys[e.key];
    if (key) {
      flags[key] = false;
    }
    if (e.key === 'e' || e.key === 'E') flags.interact = false;
    if (e.key === 'q' || e.key === 'Q') flags.enter = false;
    if (e.code === 'Space') flags.drift = false;
  });

  canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
  });

  canvas.addEventListener('mousedown', (e) => {
    if (e.button === 0) flags.shoot = true;
  });
  window.addEventListener('mouseup', (e) => {
    if (e.button === 0) flags.shoot = false;
  });


  return { flags, mouse };
}
