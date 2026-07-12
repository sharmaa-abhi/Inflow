import Konva from 'konva';
import { eventBus } from '../core/EventBus';

export class SnapManager {
  /**
   * @param {CanvasEngine} canvasEngine 
   * @param {ShapeManager} shapeManager 
   */
  constructor(canvasEngine, shapeManager) {
    this.canvasEngine = canvasEngine;
    this.shapeManager = shapeManager;
    this.snapThreshold = 8; // Snap sensitivity in pixels
    this.guideLines = []; // Active guide line nodes on Overlay Layer

    this.subscribeEvents();
  }

  subscribeEvents() {
    const stage = this.canvasEngine.stage;

    stage.on('dragmove', (e) => {
      // Only snap if drag is initiated on a shape node (excluding transformers/marquee)
      const target = e.target;
      const movingShape = this.shapeManager.getShapeById(target.id());
      if (movingShape) {
        this.handleSnapping(movingShape);
      }
    });

    stage.on('dragend', () => {
      this.clearGuides();
    });
  }

  clearGuides() {
    this.guideLines.forEach((line) => line.destroy());
    this.guideLines = [];
    this.canvasEngine.overlayLayer.batchDraw();
  }

  /**
   * Calculates snapping and renders guide lines.
   * @param {BaseShape} movingShape - The shape being dragged
   */
  handleSnapping(movingShape) {
    this.clearGuides();

    const movingNode = movingShape.konvaNode;
    // Get client rect bounds in stage coordinate space (world coordinates)
    const movingBox = movingNode.getClientRect({ skipTransform: false });
    
    // We adjust stage zoom/scale factor out for threshold comparison
    const scale = this.canvasEngine.stage.scaleX();
    const threshold = this.snapThreshold / scale;

    const moving = {
      left: movingBox.x,
      right: movingBox.x + movingBox.width,
      centerX: movingBox.x + movingBox.width / 2,
      top: movingBox.y,
      bottom: movingBox.y + movingBox.height,
      centerY: movingBox.y + movingBox.height / 2,
      width: movingBox.width,
      height: movingBox.height,
    };

    let snapX = null;
    let snapY = null;

    // Line segments to draw for guidelines
    // Format: { x1, y1, x2, y2 }
    const guidesToDraw = [];

    // Scan other shapes
    const otherShapes = this.shapeManager.getShapes().filter((s) => s.id !== movingShape.id);

    for (const shape of otherShapes) {
      const node = shape.konvaNode;
      // Skip if invisible
      if (!node.visible()) continue;

      const targetBox = node.getClientRect({ skipTransform: false });
      const target = {
        left: targetBox.x,
        right: targetBox.x + targetBox.width,
        centerX: targetBox.x + targetBox.width / 2,
        top: targetBox.y,
        bottom: targetBox.y + targetBox.height,
        centerY: targetBox.y + targetBox.height / 2,
        width: targetBox.width,
        height: targetBox.height,
      };

      // --- VERTICAL SNAPPING (Aligning X coordinates) ---
      const verticalSnaps = [
        { mov: moving.left, tar: target.left, offset: 0, label: 'L-L' },
        { mov: moving.left, tar: target.right, offset: 0, label: 'L-R' },
        { mov: moving.right, tar: target.left, offset: -moving.width, label: 'R-L' },
        { mov: moving.right, tar: target.right, offset: -moving.width, label: 'R-R' },
        { mov: moving.centerX, tar: target.centerX, offset: -moving.width / 2, label: 'C-C' },
      ];

      for (const snap of verticalSnaps) {
        if (Math.abs(snap.mov - snap.tar) < threshold) {
          snapX = targetBox.x + (snap.tar - target.left) + snap.offset;
          
          // Guideline coordinates
          const minY = Math.min(moving.top, target.top);
          const maxY = Math.max(moving.bottom, target.bottom);
          
          guidesToDraw.push({
            x1: snap.tar,
            y1: minY - 20,
            x2: snap.tar,
            y2: maxY + 20,
          });
          break; // Use first matching vertical snap
        }
      }

      // --- HORIZONTAL SNAPPING (Aligning Y coordinates) ---
      const horizontalSnaps = [
        { mov: moving.top, tar: target.top, offset: 0, label: 'T-T' },
        { mov: moving.top, tar: target.bottom, offset: 0, label: 'T-B' },
        { mov: moving.bottom, tar: target.top, offset: -moving.height, label: 'B-T' },
        { mov: moving.bottom, tar: target.bottom, offset: -moving.height, label: 'B-B' },
        { mov: moving.centerY, tar: target.centerY, offset: -moving.height / 2, label: 'C-C' },
      ];

      for (const snap of horizontalSnaps) {
        if (Math.abs(snap.mov - snap.tar) < threshold) {
          snapY = targetBox.y + (snap.tar - target.top) + snap.offset;

          // Guideline coordinates
          const minX = Math.min(moving.left, target.left);
          const maxX = Math.max(moving.right, target.right);

          guidesToDraw.push({
            x1: minX - 20,
            y1: snap.tar,
            x2: maxX + 20,
            y2: snap.tar,
          });
          break; // Use first matching horizontal snap
        }
      }
    }

    // Apply snap adjustment to moving node coordinates
    if (snapX !== null) {
      // In Konva, shape x/y is its origin, we must translate bounding box snap X back to node X
      // nodeX_new = nodeX_old + (snapX - bboxX_old)
      movingNode.x(movingNode.x() + (snapX - movingBox.x));
    }
    if (snapY !== null) {
      movingNode.y(movingNode.y() + (snapY - movingBox.y));
    }

    // Render guide lines
    if (guidesToDraw.length > 0) {
      guidesToDraw.forEach((g) => {
        const line = new Konva.Line({
          points: [g.x1, g.y1, g.x2, g.y2],
          stroke: '#ef4444', // red-500
          strokeWidth: 1 / scale, // Keep visual thickness 1px regardless of zoom
          dash: [4 / scale, 4 / scale],
          listening: false,
        });
        
        this.canvasEngine.overlayLayer.add(line);
        this.guideLines.push(line);
      });
      
      this.canvasEngine.overlayLayer.batchDraw();
    }
  }
}
