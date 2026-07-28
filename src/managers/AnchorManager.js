/**
 * AnchorManager.js — Smart Connection Anchor Points for InkFlow
 *
 * When a line or arrow tool is active, scans nearby shapes and renders 5
 * interactive anchor dots (top / right / bottom / left / center) on the
 * Konva overlay layer.  Tracks hover state and exposes the nearest anchor
 * so ShapeTool can snap line endpoints.
 *
 * Also responsible for re-routing bound connectors when their bound shapes move.
 */
import Konva from 'konva';
import { eventBus } from '../core/EventBus';
import { getAllAnchors, getAnchorPos, computeOrthogonalPath } from '../utils/routing';

/** Distance in canvas units within which anchors become visible */
const ANCHOR_VISIBLE_RADIUS = 80;
/** Distance in canvas units to snap to an anchor */
const ANCHOR_SNAP_RADIUS    = 20;

/** Visual config for anchor dots */
const ANCHOR_STYLE = {
  radius:      6,
  fill:        '#ffffff',
  stroke:      '#3b82f6',
  strokeWidth: 2,
};
const ANCHOR_HOVER_STYLE = {
  radius:      8,
  fill:        '#3b82f6',
  stroke:      '#1d4ed8',
  strokeWidth: 2.5,
};

class AnchorManager {
  constructor() {
    this.canvasEngine  = null;
    this.shapeManager  = null;
    this.anchorDots    = [];   // Active Konva circles on overlay layer
    this.hoveredAnchor = null; // { shapeId, anchorType, pos }
    this.isActive      = false;
  }

  init(canvasEngine, shapeManager) {
    this.canvasEngine = canvasEngine;
    this.shapeManager = shapeManager;

    // Subscribe to pointer-move events forwarded from EventBus
    eventBus.on('pointer-move', (data) => {
      if (this.isActive) {
        this._updateAnchors(data.canvasPos);
      }
    });

    // When a shape is dragged/transformed, re-route all connectors bound to it
    eventBus.on('shapes-updated', () => {
      this._rerouteAllConnectors();
    });
  }

  /**
   * Activate anchor detection (called when line/arrow tool is selected).
   */
  activate() {
    this.isActive      = true;
    this.hoveredAnchor = null;
  }

  /**
   * Deactivate and hide all anchor dots (called when tool changes away from line/arrow).
   */
  deactivate() {
    this.isActive      = false;
    this.hoveredAnchor = null;
    this._clearDots();
  }

  /**
   * Returns the currently hovered anchor (or null).
   * @returns {{ shapeId: string, anchorType: string, pos: {x,y} }|null}
   */
  getHoveredAnchor() {
    return this.hoveredAnchor;
  }

  // ─── Private Methods ──────────────────────────────────────────────────────

  _clearDots() {
    this.anchorDots.forEach(d => d.destroy());
    this.anchorDots = [];
    if (this.canvasEngine) {
      this.canvasEngine.overlayLayer.batchDraw();
    }
  }

  _updateAnchors(cursorPos) {
    this._clearDots();
    this.hoveredAnchor = null;

    if (!this.shapeManager) return;

    const scale     = this.canvasEngine.stage.scaleX();
    const visRadius = ANCHOR_VISIBLE_RADIUS / scale;
    const snapRadius= ANCHOR_SNAP_RADIUS    / scale;

    let closestDist   = Infinity;
    let closestAnchor = null;

    this.shapeManager.getAllShapes().forEach(shape => {
      const geom = shape.getGeometry();
      // Approximate bbox for line-type shapes
      const bbox = _shapeBbox(shape, geom);
      if (!bbox) return;

      // Only show anchors if cursor is near the shape
      const shapeCenterX = bbox.x + bbox.width  / 2;
      const shapeCenterY = bbox.y + bbox.height / 2;
      const distToCenter = Math.hypot(cursorPos.x - shapeCenterX, cursorPos.y - shapeCenterY);

      if (distToCenter > visRadius + Math.max(bbox.width, bbox.height) / 2) return;

      const anchors = getAllAnchors(bbox);
      anchors.forEach(({ type, pos }) => {
        const dist = Math.hypot(cursorPos.x - pos.x, cursorPos.y - pos.y);

        // Track closest snap anchor
        if (dist < snapRadius && dist < closestDist) {
          closestDist   = dist;
          closestAnchor = { shapeId: shape.id, anchorType: type, pos };
        }

        // Render dot
        const isHovered = closestAnchor && closestAnchor.shapeId === shape.id && closestAnchor.anchorType === type;
        const dotStyle  = isHovered ? ANCHOR_HOVER_STYLE : ANCHOR_STYLE;

        const dot = new Konva.Circle({
          x:           pos.x,
          y:           pos.y,
          radius:      dotStyle.radius / scale,
          fill:        dotStyle.fill,
          stroke:      dotStyle.stroke,
          strokeWidth: dotStyle.strokeWidth / scale,
          listening:   false,
        });
        this.canvasEngine.overlayLayer.add(dot);
        this.anchorDots.push(dot);
      });
    });

    this.hoveredAnchor = closestAnchor;
    this.canvasEngine.overlayLayer.batchDraw();
  }

  /**
   * Re-routes all connector shapes (line/arrow) that have startBinding or endBinding.
   * Called whenever shapes are moved/transformed.
   */
  _rerouteAllConnectors() {
    if (!this.shapeManager || !this.canvasEngine) return;

    let needsDraw = false;

    this.shapeManager.getAllShapes().forEach(shape => {
      const isConnector = shape.type === 'line' || shape.type === 'arrow';
      if (!isConnector) return;

      const hasBinding = shape.startBinding || shape.endBinding;
      if (!hasBinding) return;

      // Recompute start/end positions from bound shapes
      let startPos = shape._freeStartPos || null;
      let endPos   = shape._freeEndPos   || null;
      let startAnchorType = 'right';
      let endAnchorType   = 'left';

      if (shape.startBinding) {
        const boundShape = this.shapeManager.getShape(shape.startBinding.shapeId);
        if (boundShape) {
          const geom = boundShape.getGeometry();
          const bbox = _shapeBbox(boundShape, geom);
          if (bbox) {
            startPos = _getAnchorPosFromBbox(bbox, shape.startBinding.anchorType);
            startAnchorType = shape.startBinding.anchorType;
          }
        }
      }

      if (shape.endBinding) {
        const boundShape = this.shapeManager.getShape(shape.endBinding.shapeId);
        if (boundShape) {
          const geom = boundShape.getGeometry();
          const bbox = _shapeBbox(boundShape, geom);
          if (bbox) {
            endPos = _getAnchorPosFromBbox(bbox, shape.endBinding.anchorType);
            endAnchorType = shape.endBinding.anchorType;
          }
        }
      }

      if (startPos && endPos) {
        const newPoints = computeOrthogonalPath(startPos, endPos, startAnchorType, endAnchorType);
        // Reposition the connector so its origin is at startPos
        shape.konvaNode.x(0);
        shape.konvaNode.y(0);
        shape.konvaNode.points(newPoints);
        shape.points = _flatToNested(newPoints);
        shape.x = 0;
        shape.y = 0;
        needsDraw = true;

        // Update midpoint label position if exists
        if (shape.labelNode) {
          const mid = _midpointOfFlat(newPoints);
          shape.labelNode.position(mid);
        }
      }
    });

    if (needsDraw) {
      this.canvasEngine.shapeLayer.batchDraw();
    }
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Get a normalized bounding box for any shape */
function _shapeBbox(shape, geom) {
  if (!geom) return null;
  if (shape.type === 'circle') {
    const rx = geom.radiusX || geom.width  / 2 || 1;
    const ry = geom.radiusY || geom.height / 2 || 1;
    return { x: geom.x - rx, y: geom.y - ry, width: rx * 2, height: ry * 2 };
  }
  if (shape.type === 'line' || shape.type === 'arrow' || shape.type === 'pen') {
    return null; // Don't put anchors on connectors/pens
  }
  return { x: geom.x || 0, y: geom.y || 0, width: geom.width || 1, height: geom.height || 1 };
}

/** Get anchor position from a bbox by anchor type */
function _getAnchorPosFromBbox(bbox, anchorType) {
  switch (anchorType) {
    case 'top':    return { x: bbox.x + bbox.width / 2, y: bbox.y };
    case 'bottom': return { x: bbox.x + bbox.width / 2, y: bbox.y + bbox.height };
    case 'left':   return { x: bbox.x,                  y: bbox.y + bbox.height / 2 };
    case 'right':  return { x: bbox.x + bbox.width,     y: bbox.y + bbox.height / 2 };
    default:       return { x: bbox.x + bbox.width / 2, y: bbox.y + bbox.height / 2 };
  }
}

/** Convert flat points array to nested [[x,y], ...] */
function _flatToNested(flat) {
  const result = [];
  for (let i = 0; i < flat.length; i += 2) {
    result.push([flat[i], flat[i + 1]]);
  }
  return result;
}

/** Get midpoint of a flat points array */
function _midpointOfFlat(flat) {
  if (flat.length < 4) return { x: 0, y: 0 };
  const mid = Math.floor(flat.length / 4) * 2;
  return { x: flat[mid], y: flat[mid + 1] };
}

export const anchorManager = new AnchorManager();
