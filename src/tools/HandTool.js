import { BaseTool } from './BaseTool';

export class HandTool extends BaseTool {
  /**
   * @param {CanvasEngine} canvasEngine 
   * @param {ShapeManager} shapeManager 
   */
  constructor(canvasEngine, shapeManager) {
    super(canvasEngine);
    this.shapeManager = shapeManager;
    this.isPanning = false;
    this.lastPos = null;
  }

  activate() {
    super.activate();
    if (this.shapeManager) {
      this.shapeManager.deselectAll();
    }
    if (this.canvasEngine && this.canvasEngine.stage) {
      this.canvasEngine.stage.container().style.cursor = 'grab';
    }
  }

  deactivate() {
    super.deactivate();
    this.isPanning = false;
    this.lastPos = null;
    if (this.canvasEngine && this.canvasEngine.stage) {
      this.canvasEngine.stage.container().style.cursor = 'default';
    }
  }

  onPointerDown(data) {
    const { screenPos } = data;
    this.isPanning = true;
    this.lastPos = { x: screenPos.x, y: screenPos.y };
    if (this.canvasEngine && this.canvasEngine.stage) {
      this.canvasEngine.stage.container().style.cursor = 'grabbing';
    }
  }

  onPointerMove(data) {
    if (!this.isPanning || !this.lastPos) return;
    const { screenPos } = data;

    const dx = screenPos.x - this.lastPos.x;
    const dy = screenPos.y - this.lastPos.y;

    const stage = this.canvasEngine.stage;
    stage.position({
      x: stage.x() + dx,
      y: stage.y() + dy,
    });

    this.lastPos = { x: screenPos.x, y: screenPos.y };
    this.canvasEngine.batchDrawAll();
  }

  onPointerUp() {
    this.isPanning = false;
    this.lastPos = null;
    if (this.canvasEngine && this.canvasEngine.stage) {
      this.canvasEngine.stage.container().style.cursor = 'grab';
    }
  }
}