import { BaseTool } from './BaseTool';
import { PenShape } from '../shapes/PenShape';
import { simplifyPath, simplifyPathERDP } from '../utils/math';
import { eventBus } from '../core/EventBus';
import { historyManager } from '../managers/HistoryManager';

export class PenTool extends BaseTool {
  constructor(canvasEngine, shapeManager, styleManager) {
    super(canvasEngine);
    this.shapeManager = shapeManager;
    this.styleManager = styleManager;

    this.activeShape = null;
    this.isDrawing = false;
    this.rawCanvasPoints = [];
  }

  onPointerDown(data) {
    const { canvasPos } = data;
    this.isDrawing = true;

    // Start fresh path coordinates in absolute canvas space
    this.rawCanvasPoints = [canvasPos.x, canvasPos.y];

    this.activeShape = new PenShape({
      points: [...this.rawCanvasPoints],
      style: this.styleManager.getActiveStyles(),
    });

    // Make temporary shape non-draggable during drawing
    this.activeShape.konvaNode.draggable(false);
    this.shapeManager.addShape(this.activeShape);
    this.canvasEngine.shapeLayer.add(this.activeShape.konvaNode);
    this.canvasEngine.shapeLayer.batchDraw();
  }

  onPointerMove(data) {
    if (!this.isDrawing || !this.activeShape) return;
    const { canvasPos } = data;

    const lastX = this.rawCanvasPoints[this.rawCanvasPoints.length - 2];
    const lastY = this.rawCanvasPoints[this.rawCanvasPoints.length - 1];

    // Performance optimization: append points if moved > 2px
    const dist = Math.hypot(canvasPos.x - lastX, canvasPos.y - lastY);
    if (dist > 2) {
      this.rawCanvasPoints.push(canvasPos.x, canvasPos.y);

      // Real-time smoothing
      const activeStyles = this.activeShape.style;
      const mode = activeStyles.smoothingMode || 'erdp';
      const smoothness = activeStyles.smoothingTension !== undefined ? activeStyles.smoothingTension : 0.4;

      const epsilon = 0.5 + smoothness * 1.5;

      let smoothedPoints;
      if (mode === 'erdp') {
        smoothedPoints = simplifyPathERDP(this.rawCanvasPoints, epsilon, 1.0);
      } else {
        smoothedPoints = simplifyPath(this.rawCanvasPoints, epsilon);
      }

      this.activeShape.updateGeometry({ points: smoothedPoints, isAbsolute: true });
      this.canvasEngine.shapeLayer.batchDraw();
    }
  }

  onPointerUp(data) {
    if (!this.isDrawing || !this.activeShape) return;
    this.isDrawing = false;

    // Discard path if it has fewer than 2 distinct points (less than 4 values)
    if (this.rawCanvasPoints.length < 4) {
      this.shapeManager.removeShape(this.activeShape.id);
      this.activeShape.destroy();
      this.activeShape = null;
      this.rawCanvasPoints = [];
      this.canvasEngine.shapeLayer.batchDraw();
      return;
    }

    // Final path simplification
    const activeStyles = this.activeShape.style;
    const mode = activeStyles.smoothingMode || 'erdp';
    const smoothness = activeStyles.smoothingTension !== undefined ? activeStyles.smoothingTension : 0.4;
    const epsilon = 0.5 + smoothness * 1.5;

    let smoothedPoints;
    if (mode === 'erdp') {
      smoothedPoints = simplifyPathERDP(this.rawCanvasPoints, epsilon, 1.0);
    } else {
      smoothedPoints = simplifyPath(this.rawCanvasPoints, epsilon);
    }

    this.activeShape.updateGeometry({ points: smoothedPoints, isAbsolute: true });
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
    this.activeShape = null;
    this.rawCanvasPoints = [];
    this.canvasEngine.shapeLayer.batchDraw();
  }

  deactivate() {
    super.deactivate();
    this.isDrawing = false;
    this.activeShape = null;
    this.rawCanvasPoints = [];
  }
}
