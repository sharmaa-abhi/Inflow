/**
 * routing.js — Orthogonal (Manhattan) Path Routing Utility
 *
 * Computes multi-segment right-angled connector paths between two anchor points.
 * anchor types: 'top' | 'right' | 'bottom' | 'left' | 'center'
 */

/**
 * Returns an anchor exit direction vector for a given anchor type.
 * @param {'top'|'right'|'bottom'|'left'|'center'} anchorType
 * @returns {{ dx: number, dy: number }}
 */
function anchorDirection(anchorType) {
  switch (anchorType) {
    case 'top':    return { dx: 0, dy: -1 };
    case 'bottom': return { dx: 0, dy:  1 };
    case 'left':   return { dx: -1, dy: 0 };
    case 'right':  return { dx:  1, dy: 0 };
    default:       return { dx:  1, dy: 0 }; // center defaults to right
  }
}

/**
 * Computes a flat array of [x0,y0, x1,y1, ...] waypoints for an orthogonal connector.
 *
 * @param {{ x: number, y: number }} startPos  — canvas coords of start anchor
 * @param {{ x: number, y: number }} endPos    — canvas coords of end anchor
 * @param {string} [startAnchorType]           — anchor type at start ('right', 'bottom', etc.)
 * @param {string} [endAnchorType]             — anchor type at end
 * @returns {number[]} flat points array for Konva.Line / Konva.Arrow
 */
export function computeOrthogonalPath(startPos, endPos, startAnchorType = 'right', endAnchorType = 'left') {
  const STUB = 20; // initial exit segment length in canvas units

  const s = { x: startPos.x, y: startPos.y };
  const e = { x: endPos.x,   y: endPos.y   };

  const sDir = anchorDirection(startAnchorType);
  const eDir = anchorDirection(endAnchorType);

  // Exit points (stub segments)
  const s1 = { x: s.x + sDir.dx * STUB, y: s.y + sDir.dy * STUB };
  const e1 = { x: e.x + eDir.dx * STUB, y: e.y + eDir.dy * STUB };

  // Determine if we route horizontally-first or vertically-first based on anchor directions
  let mid1, mid2;

  const isStartH = sDir.dy === 0; // start exits horizontally
  const isEndH   = eDir.dy === 0; // end   exits horizontally

  if (isStartH && isEndH) {
    // Both horizontal: route via two vertical-then-horizontal segments
    const midX = (s1.x + e1.x) / 2;
    mid1 = { x: midX, y: s1.y };
    mid2 = { x: midX, y: e1.y };
  } else if (!isStartH && !isEndH) {
    // Both vertical: route via two horizontal-then-vertical segments
    const midY = (s1.y + e1.y) / 2;
    mid1 = { x: s1.x, y: midY };
    mid2 = { x: e1.x, y: midY };
  } else if (isStartH && !isEndH) {
    // Start horizontal, end vertical: L-bend
    mid1 = { x: e1.x, y: s1.y };
    mid2 = null;
  } else {
    // Start vertical, end horizontal: L-bend (mirrored)
    mid1 = { x: s1.x, y: e1.y };
    mid2 = null;
  }

  const points = [s.x, s.y, s1.x, s1.y];
  if (mid1) points.push(mid1.x, mid1.y);
  if (mid2) points.push(mid2.x, mid2.y);
  points.push(e1.x, e1.y, e.x, e.y);

  return points;
}

/**
 * Given a shape's bounding box and anchor type, returns the canvas-space anchor position.
 *
 * @param {{ x: number, y: number, width: number, height: number }} bbox
 * @param {string} anchorType
 * @returns {{ x: number, y: number }}
 */
export function getAnchorPos(bbox, anchorType) {
  const { x, y, width, height } = bbox;
  switch (anchorType) {
    case 'top':    return { x: x + width / 2, y };
    case 'bottom': return { x: x + width / 2, y: y + height };
    case 'left':   return { x,                y: y + height / 2 };
    case 'right':  return { x: x + width,     y: y + height / 2 };
    case 'center': return { x: x + width / 2, y: y + height / 2 };
    default:       return { x: x + width,     y: y + height / 2 };
  }
}

/**
 * Returns the 5 anchor positions for a shape's bounding box.
 *
 * @param {{ x: number, y: number, width: number, height: number }} bbox
 * @returns {Array<{ type: string, pos: { x: number, y: number } }>}
 */
export function getAllAnchors(bbox) {
  return ['top', 'right', 'bottom', 'left', 'center'].map(type => ({
    type,
    pos: getAnchorPos(bbox, type),
  }));
}
