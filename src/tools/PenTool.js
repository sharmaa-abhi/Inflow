import { BaseTool } from './BaseTool';
import { PenShape } from '../shapes/PenShape';
import { simplifyPath } from '../utils/math';
import { eventBus } from '../core/EventBus';

export class PenTool extends BaseTool {
  /**
   * @param {CanvasEngine} canvasEngine 
   * @param {ShapeManager} shapeManager 
   * @param {StyleManager} styleManager 
   */
  constructor(canvasEngine, shapeManager, styleManager) {
    super(canvasEngine);
    this.shapeManager = shapeManager;
    this.styleManager = styleManager;

    this.activeShape = null;
    this.isDrawing = false;
    this.points = [];
  }

  onPointerDown(data) {
    const { canvasPos } = data;
    this.isDrawing = true;
    
    // Start fresh path coordinates
    this.points = [canvasPos.x, canvasPos.y];

    this.activeShape = new PenShape({
      points: [...this.points],
      style: { ...this.styleManager.activeStyle },
    });

    // Make temporary shape non-draggable during drawing
    this.activeShape.konvaNode.draggable(false);
    this.shapeManager.addShape(this.activeShape);
    this.canvasEngine.shapeLayer.add(this.activeShape.konvaNode);
  }

  onPointerMove(data) {
    if (!this.isDrawing || !this.activeShape) return;
    const { canvasPos } = data;

    const lastX = this.points[this.points.length - 2];
    const lastY = this.points[this.points.length - 1];
    
    // Performance optimization: only append points if dragged at least 2px away
    const dist = Math.hypot(canvasPos.x - lastX, canvasPos.y - lastY);
    if (dist > 2) {
      this.points.push(canvasPos.x, canvasPos.y);
      this.activeShape.updateGeometry({ points: [...this.points] });
      this.canvasEngine.shapeLayer.batchDraw();
    }
  }

  onPointerUp(data) {
    if (!this.isDrawing || !this.activeShape) return;
    this.isDrawing = false;

    // Discard path if it has too few points (e.g. less than 3 coordinate pairs)
    if (this.points.length < 6) {
      this.shapeManager.removeShape(this.activeShape.id);
    } else {
      // Simplify the freehand curve to smooth it and reduce storage size
      const simplified = simplifyPath(this.points, 1.0);
      this.activeShape.updateGeometry({ points: simplified });
      
      // Make shape draggable again
      this.activeShape.konvaNode.draggable(true);

      // Emit event for history
      eventBus.emit('shape-created-history', this.activeShape);
    }

    this.activeShape = null;
    this.canvasEngine.shapeLayer.batchDraw();
  }

  deactivate() {
    super.deactivate();
    this.isDrawing = false;
    this.activeShape = null;
    this.points = [];
  }
}
