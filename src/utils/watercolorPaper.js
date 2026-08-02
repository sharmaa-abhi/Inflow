/**
 * Luxury 100% Cotton Cold-Press Watercolor Paper Pattern Generator.
 * Creates an ultra-high-resolution, perfectly tileable, seamless paper texture pattern.
 */
let cachedPatternCanvas = null;

export function getWatercolorPaperPattern(ctx) {
  if (!cachedPatternCanvas) {
    cachedPatternCanvas = createWatercolorPaperTile();
  }
  return ctx.createPattern(cachedPatternCanvas, 'repeat');
}

function createWatercolorPaperTile() {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  // Base coat: Luxury Warm Off-White (#F6F0DE)
  ctx.fillStyle = '#F6F0DE';
  ctx.fillRect(0, 0, size, size);

  // Soft Surface Color Variations (Highlights & Shadows)
  const imgData = ctx.getImageData(0, 0, size, size);
  const data = imgData.data;

  // Multi-frequency smooth noise for subtle handmade paper grain & pressed cotton bumps
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;

      // Tileable trigonometric noise harmonics
      const n1 = Math.sin((x / size) * Math.PI * 8) * Math.cos((y / size) * Math.PI * 8) * 3;
      const n2 = Math.sin((x / size) * Math.PI * 24 + (y / size) * Math.PI * 16) * 2;
      const n3 = Math.cos((x / size) * Math.PI * 48 - (y / size) * Math.PI * 32) * 1.5;
      const microNoise = (Math.random() - 0.5) * 3.5;

      const delta = n1 + n2 + n3 + microNoise;

      data[idx]     = Math.min(255, Math.max(0, data[idx] + delta));     // R (#F6 -> 246)
      data[idx + 1] = Math.min(255, Math.max(0, data[idx + 1] + delta * 0.95)); // G (#F0 -> 240)
      data[idx + 2] = Math.min(255, Math.max(0, data[idx + 2] + delta * 0.9));  // B (#DE -> 222)
    }
  }
  ctx.putImageData(imgData, 0, 0);

  // Delicate Organic Cellulose Fibers (#D9CCAF / #D5C8A8)
  ctx.strokeStyle = 'rgba(217, 204, 175, 0.22)';
  ctx.lineWidth = 0.75;
  ctx.lineCap = 'round';

  const drawFiber = (x, y, len, angle) => {
    ctx.beginPath();
    ctx.moveTo(x, y);
    const cpX = x + Math.cos(angle + 0.4) * (len * 0.5);
    const cpY = y + Math.sin(angle + 0.4) * (len * 0.5);
    const endX = x + Math.cos(angle) * len;
    const endY = y + Math.sin(angle) * len;
    ctx.quadraticCurveTo(cpX, cpY, endX, endY);
    ctx.stroke();
  };

  // Draw 240 fine random fibers with seamless boundary wrapping
  for (let i = 0; i < 240; i++) {
    const fx = Math.random() * size;
    const fy = Math.random() * size;
    const len = 3 + Math.random() * 10;
    const angle = Math.random() * Math.PI * 2;

    drawFiber(fx, fy, len, angle);

    // Tile across boundaries to maintain 100% seamless pattern
    if (fx + len > size) drawFiber(fx - size, fy, len, angle);
    if (fy + len > size) drawFiber(fx, fy - size, len, angle);
    if (fx - len < 0)    drawFiber(fx + size, fy, len, angle);
    if (fy - len < 0)    drawFiber(fx, fy + size, len, angle);
  }

  // Soft Embossed Micro Pores (#FDFBF5 / #E8DFC8)
  ctx.fillStyle = 'rgba(253, 251, 245, 0.35)'; // Micro highlights
  for (let i = 0; i < 300; i++) {
    const px = Math.random() * size;
    const py = Math.random() * size;
    ctx.beginPath();
    ctx.arc(px, py, 0.6, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = 'rgba(232, 223, 200, 0.25)'; // Micro shadow pores
  for (let i = 0; i < 300; i++) {
    const px = Math.random() * size;
    const py = Math.random() * size;
    ctx.beginPath();
    ctx.arc(px + 0.5, py + 0.5, 0.5, 0, Math.PI * 2);
    ctx.fill();
  }

  return canvas;
}
