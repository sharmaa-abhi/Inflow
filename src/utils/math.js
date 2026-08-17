/**
 * InkFlow mathematical and coordinate helper utilities.
 */

/**
 * Calculates distance between two points.
 * @param {number} x1 
 * @param {number} y1 
 * @param {number} x2 
 * @param {number} y2 
 * @returns {number} Distance
 */
export function getDistance(x1, y1, x2, y2) {
  return Math.hypot(x2 - x1, y2 - y1);
}

/**
 * Snaps a given angle to the nearest step (e.g. 45 degrees for Shift key modifier).
 * @param {number} radians - Angle in radians
 * @param {number} stepDegrees - Snap step in degrees
 * @returns {number} Snapped angle in radians
 */
export function snapAngle(radians, stepDegrees = 45) {
  const stepRadians = (stepDegrees * Math.PI) / 180;
  return Math.round(radians / stepRadians) * stepRadians;
}

/**
 * Snaps a point (x, y) to a specific angle from origin (ox, oy).
 * Used when dragging lines/arrows with Shift key.
 * @param {number} x - Target X
 * @param {number} y - Target Y
 * @param {number} ox - Origin X
 * @param {number} oy - Origin Y
 * @returns {{x: number, y: number}} Snapped point
 */
export function snapPointToAngle(x, y, ox, oy) {
  const dx = x - ox;
  const dy = y - oy;
  const angle = Math.atan2(dy, dx);
  const snapped = snapAngle(angle, 45);
  const distance = getDistance(ox, oy, x, y);
  return {
    x: ox + distance * Math.cos(snapped),
    y: oy + distance * Math.sin(snapped),
  };
}

/**
 * Get the axis-aligned bounding box (AABB) of a rectangle after rotation.
 * Rotates around the center of the rectangle (matching Konva's default rotation origin).
 * @param {number} x - Top-left X
 * @param {number} y - Top-left Y
 * @param {number} width - Width of the rectangle
 * @param {number} height - Height of the rectangle
 * @param {number} angleDeg - Rotation angle in degrees (clockwise)
 * @returns {{ minX: number, minY: number, maxX: number, maxY: number }}
 */
export function getRotatedBB(x, y, width, height, angleDeg) {
  if (!angleDeg || angleDeg === 0) {
    return { minX: x, minY: y, maxX: x + width, maxY: y + height };
  }

  const rad = (angleDeg * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);

  // Rotate around the center of the rectangle, not top-left
  const cx = x + width / 2;
  const cy = y + height / 2;

  const corners = [
    { px: x, py: y },
    { px: x + width, py: y },
    { px: x + width, py: y + height },
    { px: x, py: y + height },
  ];

  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const { px, py } of corners) {
    const dx = px - cx;
    const dy = py - cy;
    const rx = cx + dx * cos - dy * sin;
    const ry = cy + dx * sin + dy * cos;
    if (rx < minX) minX = rx;
    if (rx > maxX) maxX = rx;
    if (ry < minY) minY = ry;
    if (ry > maxY) maxY = ry;
  }

  return { minX, minY, maxX, maxY };
}

/**
 * Tests if two axis-aligned rectangles intersect.
 * Normalizes both rects to handle negative width/height from reverse-drag creation.
 * @param {{ x: number, y: number, width: number, height: number }} r1
 * @param {{ x: number, y: number, width: number, height: number }} r2
 * @returns {boolean}
 */
export function rectIntersect(r1, r2) {
  // Normalize both rects to ensure positive width/height
  const a = {
    x: r1.width < 0 ? r1.x + r1.width : r1.x,
    y: r1.height < 0 ? r1.y + r1.height : r1.y,
    width: Math.abs(r1.width),
    height: Math.abs(r1.height),
  };
  const b = {
    x: r2.width < 0 ? r2.x + r2.width : r2.x,
    y: r2.height < 0 ? r2.y + r2.height : r2.y,
    width: Math.abs(r2.width),
    height: Math.abs(r2.height),
  };
  return !(
    a.x > b.x + b.width ||
    a.x + a.width < b.x ||
    a.y > b.y + b.height ||
    a.y + a.height < b.y
  );
}

/**
 * Simplifies a flat coordinate path array [x1, y1, x2, y2, ...] using the
 * Ramer-Douglas-Peucker (RDP) curve simplification algorithm.
 * @param {number[]} points - Flat coordinate array
 * @param {number} [epsilon=1] - Tolerable distance threshold
 * @returns {number[]} Simplified coordinate array
 */
export function simplifyPath(points, epsilon = 1) {
  if (points.length < 6) return points; // Need at least 3 points to simplify

  const pts = [];
  for (let i = 0; i < points.length; i += 2) {
    pts.push({ x: points[i], y: points[i + 1] });
  }

  const simplified = rdpSimplify(pts, epsilon);

  const result = [];
  for (const p of simplified) {
    result.push(p.x, p.y);
  }
  return result;
}

function rdpSimplify(points, epsilon) {
  const len = points.length;
  if (len < 3) return points;

  let maxDist = 0;
  let index = 0;
  const end = len - 1;

  for (let i = 1; i < end; i++) {
    const dist = getOrthoDistance(points[i], points[0], points[end]);
    if (dist > maxDist) {
      index = i;
      maxDist = dist;
    }
  }

  if (maxDist > epsilon) {
    const part1 = rdpSimplify(points.slice(0, index + 1), epsilon);
    const part2 = rdpSimplify(points.slice(index), epsilon);
    return part1.slice(0, part1.length - 1).concat(part2);
  } else {
    return [points[0], points[end]];
  }
}

function getOrthoDistance(p, lineStart, lineEnd) {
  const dx = lineEnd.x - lineStart.x;
  const dy = lineEnd.y - lineStart.y;

  const mag = Math.hypot(dx, dy);
  if (mag === 0) {
    return Math.hypot(p.x - lineStart.x, p.y - lineStart.y);
  }

  const u = ((p.x - lineStart.x) * dx + (p.y - lineStart.y) * dy) / (mag * mag);

  if (u < 0) {
    return Math.hypot(p.x - lineStart.x, p.y - lineStart.y);
  } else if (u > 1) {
    return Math.hypot(p.x - lineEnd.x, p.y - lineEnd.y);
  }

  const ix = lineStart.x + u * dx;
  const iy = lineStart.y + u * dy;
  return Math.hypot(p.x - ix, p.y - iy);
}

/**
 * Adaptive path simplification engine.
 * Maps user-facing quality presets to internal algorithm parameters.
 *
 * @param {number[]} points     - Flat coordinate array [x1,y1,x2,y2,...]
 * @param {object}   opts
 * @param {string}   opts.quality           - 'fast' | 'balanced' | 'precise'
 * @param {number}   opts.smoothness        - 0–1 slider value
 * @param {number}   opts.cornerPreservation - 0–1 (higher = preserve more corners)
 * @param {number[]} [opts.timestamps]      - optional per-point timestamps for speed calc
 * @returns {number[]} Simplified coordinate array
 */
export function simplifyPathAdaptive(points, opts = {}) {
  if (points.length < 6) return points;

  const {
    quality = 'balanced',
    smoothness = 0.5,
    cornerPreservation = 0.6,
    timestamps = null,
  } = opts;

  // ── Map quality preset to algorithm choice & base epsilon ──────────────────
  let useEnhanced = true;
  let baseEpsilon;

  switch (quality) {
    case 'fast':
      useEnhanced = false;
      baseEpsilon = 1.2 + smoothness * 2.0; // aggressive simplification
      break;
    case 'precise':
      useEnhanced = true;
      baseEpsilon = 0.3 + smoothness * 0.7; // keep lots of detail
      break;
    case 'balanced':
    default:
      useEnhanced = true;
      baseEpsilon = 0.5 + smoothness * 1.5;
      break;
  }

  if (!useEnhanced) {
    return simplifyPath(points, baseEpsilon);
  }

  return simplifyPathERDP(points, baseEpsilon, cornerPreservation, timestamps);
}

/**
 * Enhanced Ramer-Douglas-Peucker (ERDP) that weighs point significance using:
 *   1. Local curvature (angle change between consecutive segments)
 *   2. Drawing speed   (slow strokes keep detail, fast strokes simplify)
 *   3. Stroke density  (clusters of very close points are thinned)
 *
 * @param {number[]} points            - Flat coordinate array
 * @param {number}   [epsilon=1]       - Base distance threshold
 * @param {number}   [cornerSens=0.6]  - Corner preservation sensitivity 0–1
 * @param {number[]} [timestamps]      - Optional per-point timestamps (ms)
 * @returns {number[]} Simplified coordinate array
 */
export function simplifyPathERDP(points, epsilon = 1, cornerSens = 0.6, timestamps = null) {
  if (points.length < 6) return points;

  const pts = [];
  for (let i = 0; i < points.length; i += 2) {
    pts.push({ x: points[i], y: points[i + 1] });
  }

  // ── Build per-point weights ────────────────────────────────────────────────
  const weights = new Array(pts.length).fill(1.0);

  // Always keep endpoints
  weights[0] = 0.01;
  weights[pts.length - 1] = 0.01;

  // Compute segment speeds if timestamps are available
  let speeds = null;
  if (timestamps && timestamps.length === pts.length) {
    speeds = new Array(pts.length).fill(1.0);
    for (let i = 1; i < pts.length; i++) {
      const dt = Math.max(1, timestamps[i] - timestamps[i - 1]);
      const dx = pts[i].x - pts[i - 1].x;
      const dy = pts[i].y - pts[i - 1].y;
      speeds[i] = Math.hypot(dx, dy) / dt; // px/ms
    }
  }

  // Compute median segment length for density weighting
  const segLens = [];
  for (let i = 1; i < pts.length; i++) {
    segLens.push(Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y));
  }
  const medianLen = segLens.slice().sort((a, b) => a - b)[Math.floor(segLens.length / 2)] || 1;

  for (let i = 1; i < pts.length - 1; i++) {
    const pPrev = pts[i - 1];
    const pCurr = pts[i];
    const pNext = pts[i + 1];

    // ── 1. Curvature weight ──────────────────────────────────────────────────
    const dx1 = pCurr.x - pPrev.x;
    const dy1 = pCurr.y - pPrev.y;
    const dx2 = pNext.x - pCurr.x;
    const dy2 = pNext.y - pCurr.y;
    const len1 = Math.hypot(dx1, dy1);
    const len2 = Math.hypot(dx2, dy2);

    let curvatureWeight = 1.0;
    if (len1 > 0.1 && len2 > 0.1) {
      const dot = (dx1 * dx2 + dy1 * dy2) / (len1 * len2);
      const clampedDot = Math.max(-1, Math.min(1, dot));
      const angleDev = Math.acos(clampedDot);
      curvatureWeight = Math.max(0.05, 1.0 - (angleDev / Math.PI) * 1.8 * cornerSens);
    }

    // ── 2. Speed weight (optional) ───────────────────────────────────────────
    let speedWeight = 1.0;
    if (speeds) {
      const spd = speeds[i];
      speedWeight = 0.3 + Math.min(0.7, spd * 0.5);
    }

    // ── 3. Density weight ────────────────────────────────────────────────────
    const avgNeighborLen = (len1 + len2) / 2;
    let densityWeight = 1.0;
    if (avgNeighborLen < medianLen * 0.3) {
      densityWeight = 1.5; // very dense region → easier to simplify
    } else if (avgNeighborLen > medianLen * 2.0) {
      densityWeight = 0.5; // sparse region → keep detail
    }

    weights[i] = curvatureWeight * speedWeight * densityWeight;
  }

  const simplified = rdpSimplifyWeighted(pts, weights, epsilon);

  const result = [];
  for (const p of simplified) {
    result.push(p.x, p.y);
  }
  return result;
}

function rdpSimplifyWeighted(points, weights, epsilon) {
  const len = points.length;
  if (len < 3) return points;

  let maxWeightedDist = 0;
  let index = 0;
  const end = len - 1;

  for (let i = 1; i < end; i++) {
    const dist = getOrthoDistance(points[i], points[0], points[end]);
    const weightedDist = dist / weights[i];
    if (weightedDist > maxWeightedDist) {
      index = i;
      maxWeightedDist = weightedDist;
    }
  }

  if (maxWeightedDist > epsilon) {
    const part1 = rdpSimplifyWeighted(points.slice(0, index + 1), weights.slice(0, index + 1), epsilon);
    const part2 = rdpSimplifyWeighted(points.slice(index), weights.slice(index), epsilon);
    return part1.slice(0, part1.length - 1).concat(part2);
  } else {
    return [points[0], points[end]];
  }
}



