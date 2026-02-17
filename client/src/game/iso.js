// Placeholder for later iso world->screen conversion.
export function toIso(x, y, tileW = 64, tileH = 32) {
  return {
    x: (x - y) * (tileW / 2),
    y: (x + y) * (tileH / 2)
  };
}
