import { BaseTool } from './BaseTool';
import { PenShape } from '../shapes/PenShape';
import { simplifyPath, simplifyPathERDP } from '../utils/math';
import { eventBus } from '../core/EventBus';
import { historyManager } from '../managers/HistoryManager';

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
      style: this.styleManager.getActiveStyles(),
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

      // Real-time smoothing
      const activeStyles = this.activeShape.style;
      const mode = activeStyles.smoothingMode || 'erdp';
      const smoothness = activeStyles.smoothingTension !== undefined ? activeStyles.smoothingTension : 0.4;
      
      // Map smoothness to epsilon: higher smoothness = larger epsilon
      const epsilon = 0.5 + smoothness * 1.5; 
      
      let smoothedPoints;
      if (mode === 'erdp') {
        smoothedPoints = simplifyPathERDP(this.points, epsilon, 1.0);
      } else {
        smoothedPoints = simplifyPath(this.points, epsilon);
      }

      this.activeShape.updateGeometry({ points: smoothedPoints });
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
      const activeStyles = this.activeShape.style;
      const mode = activeStyles.smoothingMode || 'erdp';
      const smoothness = activeStyles.smoothingTension !== undefined ? activeStyles.smoothingTension : 0.4;
      
      const epsilon = 0.5 + smoothness * 1.5; 
      
      let smoothedPoints;
      if (mode === 'erdp') {
        smoothedPoints = simplifyPathERDP(this.points, epsilon, 1.0);
      } else {
        smoothedPoints = simplifyPath(this.points, epsilon);
      }

      this.activeShape.updateGeometry({ points: smoothedPoints });
      
      // Make shape draggable again
      this.activeShape.konvaNode.draggable(true);

      const shape = this.activeShape;
      historyManager.registerChange({
        type: 'add',
        shapeId: shape.id,
        shapeData: shape.serialize(),
        undo: () => {
          this.shapeManager.removeShape(shape.id);
          shape.destroy();
          this.canvasEngine.shapeLayer.batchDraw();
        },
        redo: () => {
          const reCreated = this.shapeManager.recreateShape(shape.serialize());
          this.canvasEngine.shapeLayer.add(reCreated.konvaNode);
          this.canvasEngine.shapeLayer.batchDraw();
        }
      });

      eventBus.emit('shapes-updated');
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
