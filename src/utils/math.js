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
 * Computes bounding box for rotated coordinates.
 * @param {number} x - Top-left x
 * @param {number} y - Top-left y
 * @param {number} width 
 * @param {number} height 
 * @param {number} rotationDegrees 
 * @returns {{minX: number, minY: number, maxX: number, maxY: number}} Bounding box
 */
export function getRotatedBB(x, y, width, height, rotationDegrees) {
  const rad = (rotationDegrees * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);

  const points = [
    { x: 0, y: 0 },
    { x: width, y: 0 },
    { x: width, y: height },
    { x: 0, y: height },
  ];

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const p of points) {
    const rx = x + (p.x * cos - p.y * sin);
    const ry = y + (p.x * sin + p.y * cos);
    minX = Math.min(minX, rx);
    minY = Math.min(minY, ry);
    maxX = Math.max(maxX, rx);
    maxY = Math.max(maxY, ry);
  }

  return { minX, minY, maxX, maxY };
}

/**
 * Checks if box A intersects or is fully contained within box B.
 * Box format: { x, y, width, height }
 * @param {Object} rectA 
 * @param {Object} rectB 
 * @returns {boolean} True if they intersect
 */
export function rectIntersect(rectA, rectB) {
  return (
    rectA.x < rectB.x + rectB.width &&
    rectA.x + rectA.width > rectB.x &&
    rectA.y < rectB.y + rectB.height &&
    rectA.y + rectA.height > rectB.y
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



