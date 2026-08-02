import { BaseTool } from './BaseTool';
import { historyManager } from '../managers/HistoryManager';
import { eventBus } from '../core/EventBus';

export class EraserTool extends BaseTool {
  constructor(canvasEngine, shapeManager) {
    super(canvasEngine);
    this.shapeManager = shapeManager;
    this.isErasing = false;
    this.erasedInCurrentDrag = new Set();
    this.erasedDataList = [];
  }

  activate() {
    super.activate();
    if (this.canvasEngine && this.canvasEngine.stage) {
      this.canvasEngine.stage.container().style.cursor = 'crosshair';
    }
  }

  deactivate() {
    super.deactivate();
    if (this.canvasEngine && this.canvasEngine.stage) {
      this.canvasEngine.stage.container().style.cursor = 'default';
    }
  }

  onPointerDown(data) {
    this.isErasing = true;
    this.erasedInCurrentDrag.clear();
    this.erasedDataList = [];
    this._eraseAtTarget(data.event);
  }

  onPointerMove(data) {
    if (!this.isErasing) return;
    this._eraseAtTarget(data.event);
  }

  onPointerUp(data) {
    if (!this.isErasing) return;
    this.isErasing = false;

    if (this.erasedDataList.length > 0) {
      const list = [...this.erasedDataList];
      historyManager.registerChange({
        type: 'erase-shapes',
        list,
        undo: () => {
          list.forEach(item => {
            const restored = this.shapeManager.recreateShape(item.data);
            if (restored) {
              this.canvasEngine.shapeLayer.add(restored.konvaNode);
            }
          });
          this.canvasEngine.shapeLayer.batchDraw();
          eventBus.emit('shapes-updated');
        },
        redo: () => {
          list.forEach(item => {
            const s = this.shapeManager.getShapeById(item.id);
            this.shapeManager.removeShape(item.id);
            if (s && s.destroy) s.destroy();
          });
          this.canvasEngine.shapeLayer.batchDraw();
          eventBus.emit('shapes-updated');
        }
      });

      eventBus.emit('shapes-updated');
    }
  }

  _eraseAtTarget(event) {
    const clickedNode = event.target;
    if (!clickedNode || clickedNode === this.canvasEngine.stage) return;

    let shapeId = clickedNode.id();
    let parent = clickedNode;
    while (parent && !shapeId) {
      parent = parent.getParent();
      if (parent) shapeId = parent.id();
    }

    if (shapeId && !this.erasedInCurrentDrag.has(shapeId)) {
      const shape = this.shapeManager.getShapeById(shapeId);
      if (shape) {
        this.erasedInCurrentDrag.add(shapeId);
        this.erasedDataList.push({ id: shapeId, data: shape.serialize() });

        this.shapeManager.removeShape(shapeId);
        if (shape.destroy) shape.destroy();
        this.canvasEngine.shapeLayer.batchDraw();
      }
    }
  }
}
