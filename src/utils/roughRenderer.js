/**
 * roughRenderer.js — Rough.js OffscreenCanvas Renderer
 *
 * Renders InkFlow shapes onto an OffscreenCanvas using rough.js, then returns
 * an ImageBitmap that can be applied as a Konva.Image node for the sketchy mode.
 */
import rough from 'roughjs';

/**
 * Map InkFlow fill style names to rough.js fillStyle values.
 */
const FILL_STYLE_MAP = {
  solid:       'solid',
  hachure:     'hachure',
  'cross-hatch': 'cross-hatch',
  dots:        'dots',
  transparent: 'solid', // fallback
};

/**
 * Build a rough.js options object from an InkFlow shape's style data.
 * @param {Object} style
 * @returns {Object} roughjs options
 */
function buildRoughOptions(style) {
  const fillStyle = FILL_STYLE_MAP[style.fillStyle] || 'solid';
  const hasFill   = style.backgroundColor && style.backgroundColor !== 'transparent';

  return {
    stroke:          style.strokeColor || style.stroke || '#1e293b',
    strokeWidth:     style.strokeWidth || 2,
    roughness:       style.roughness ?? 1.5,
    bowing:          1,
    fillStyle,
    fill:            hasFill ? (style.backgroundColor || style.fill) : undefined,
    fillWeight:      style.strokeWidth ? style.strokeWidth * 0.5 : 1,
    hachureAngle:    -41,
    hachureGap:      style.strokeWidth ? style.strokeWidth * 3 : 6,
  };
}

/**
 * Renders a rough shape to an OffscreenCanvas and returns an ImageBitmap.
 *
 * @param {{ type: string, x: number, y: number, width: number, height: number, style: Object, points?: number[] }} shapeData
 * @returns {Promise<ImageBitmap>}
 */
export async function renderRoughShape(shapeData) {
  const { type, width, height, style } = shapeData;

  // Add padding so strokes at edge aren't clipped
  const PAD   = Math.max(20, (style.strokeWidth || 2) * 6);
  const cw    = Math.max(4, Math.abs(width)  + PAD * 2);
  const ch    = Math.max(4, Math.abs(height) + PAD * 2);

  const canvas = new OffscreenCanvas(cw, ch);
  const rc     = rough.canvas(canvas);
  const opts   = buildRoughOptions(style);

  switch (type) {
    case 'rectangle':
      rc.rectangle(PAD, PAD, Math.abs(width), Math.abs(height), opts);
      break;

    case 'circle': {
      const rx = Math.abs(shapeData.radiusX || width / 2);
      const ry = Math.abs(shapeData.radiusY || height / 2);
      rc.ellipse(PAD + rx, PAD + ry, rx * 2, ry * 2, opts);
      break;
    }

    case 'diamond': {
      const w = Math.abs(width);
      const h = Math.abs(height);
      rc.polygon([
        [PAD + w / 2, PAD],
        [PAD + w,     PAD + h / 2],
        [PAD + w / 2, PAD + h],
        [PAD,         PAD + h / 2],
      ], opts);
      break;
    }

    case 'line':
    case 'arrow': {
      // Use raw points array if available (for orthogonal routing)
      const pts = shapeData.flatPoints;
      if (pts && pts.length >= 4) {
        // Draw as a series of line segments
        for (let i = 0; i < pts.length - 2; i += 2) {
          const x1 = pts[i]     - shapeData.x + PAD;
          const y1 = pts[i + 1] - shapeData.y + PAD;
          const x2 = pts[i + 2] - shapeData.x + PAD;
          const y2 = pts[i + 3] - shapeData.y + PAD;
          rc.line(x1, y1, x2, y2, opts);
        }
        // Draw arrow head for arrows
        if (type === 'arrow') {
          const lastX = pts[pts.length - 2] - shapeData.x + PAD;
          const lastY = pts[pts.length - 1] - shapeData.y + PAD;
          const prevX = pts[pts.length - 4] - shapeData.x + PAD;
          const prevY = pts[pts.length - 3] - shapeData.y + PAD;
          _drawRoughArrowHead(canvas.getContext('2d'), prevX, prevY, lastX, lastY, opts.strokeWidth, opts.stroke);
        }
      } else {
        // Simple two-point line
        const x2 = Math.abs(width) + PAD;
        const y2 = Math.abs(height) + PAD;
        rc.line(PAD, PAD, x2, y2, opts);
        if (type === 'arrow') {
          _drawRoughArrowHead(canvas.getContext('2d'), PAD, PAD, x2, y2, opts.strokeWidth, opts.stroke);
        }
      }
      break;
    }

    default:
      // Fallback: empty transparent canvas
      break;
  }

  return canvas.transferToImageBitmap();
}

/**
 * Draws a simple filled arrowhead at (toX, toY) pointing from (fromX, fromY).
 */
function _drawRoughArrowHead(ctx, fromX, fromY, toX, toY, strokeWidth = 2, color = '#1e293b') {
  const angle    = Math.atan2(toY - fromY, toX - fromX);
  const headLen  = 12 + strokeWidth * 2;
  const headAngle = Math.PI / 6;

  ctx.save();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(toX, toY);
  ctx.lineTo(
    toX - headLen * Math.cos(angle - headAngle),
    toY - headLen * Math.sin(angle - headAngle)
  );
  ctx.lineTo(
    toX - headLen * Math.cos(angle + headAngle),
    toY - headLen * Math.sin(angle + headAngle)
  );
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

/**
 * Returns the canvas padding used by renderRoughShape for a given strokeWidth.
 * Callers need this to position the Konva.Image correctly (offset by -PAD).
 * @param {number} strokeWidth
 * @returns {number}
 */
export function getRoughPadding(strokeWidth = 2) {
  return Math.max(20, strokeWidth * 6);
}
