import Konva from 'konva';
import { BaseTool } from './BaseTool';
import { historyManager } from '../managers/HistoryManager';
import { eventBus } from '../core/EventBus';

export class EraserTool extends BaseTool {
  constructor(canvasEngine, shapeManager) {
    super(canvasEngine);
    this.shapeManager = shapeManager;
    this.isErasing = false;

    // Map of shapeId -> { shape, originalOpacity, data }
    this.markedShapes = new Map();

    // Visual eraser ball cursor on overlay layer
    this.eraserRadius = 12; // Base radius in screen pixels
    this.cursorBall = null;
    this.cursorRing = null;
    this.cursorGroup = null;

    this.initCursor();
  }

  initCursor() {
    this.cursorGroup = new Konva.Group({
      listening: false,
      visible: false,
    });

    // Outer translucent glow ring
    this.cursorRing = new Konva.Circle({
      radius: this.eraserRadius,
      fill: 'rgba(239, 68, 68, 0.2)',
      stroke: '#ef4444',
      strokeWidth: 1.5,
      listening: false,
    });

    // Center focal dot
    this.cursorDot = new Konva.Circle({
      radius: 2.5,
      fill: '#ef4444',
      listening: false,
    });

    this.cursorGroup.add(this.cursorRing);
    this.cursorGroup.add(this.cursorDot);

    if (this.canvasEngine && this.canvasEngine.overlayLayer) {
      this.canvasEngine.overlayLayer.add(this.cursorGroup);
    }
  }

  activate() {
    super.activate();
    if (this.canvasEngine && this.canvasEngine.stage) {
      this.canvasEngine.stage.container().style.cursor = 'none';
    }
    if (this.cursorGroup) {
      this.cursorGroup.visible(true);
      this.canvasEngine.overlayLayer.batchDraw();
    }
  }

  deactivate() {
    super.deactivate();
    this.isErasing = false;

    // Restore opacity of any marked shapes if user cancels / switches tools
    this._restoreMarkedOpacities();
    this.markedShapes.clear();

    if (this.canvasEngine && this.canvasEngine.stage) {
      this.canvasEngine.stage.container().style.cursor = 'default';
    }
    if (this.cursorGroup) {
      this.cursorGroup.visible(false);
      this.canvasEngine.overlayLayer.batchDraw();
    }
  }

  onPointerDown(data) {
    const { canvasPos, event } = data;
    this.isErasing = true;
    this.markedShapes.clear();

    this._updateCursorPosition(canvasPos, true);
    this._handleEraseTouch(data);
  }

  onPointerMove(data) {
    const { canvasPos } = data;
    this._updateCursorPosition(canvasPos, this.isErasing);

    if (this.isErasing) {
      this._handleEraseTouch(data);
    }
  }

  onPointerUp(data) {
    if (!this.isErasing) return;
    this.isErasing = false;

    this._updateCursorPosition(data.canvasPos, false);

    // Apply permanent deletion to all shapes marked during this drag
    if (this.markedShapes.size > 0) {
      const list = [];

      this.markedShapes.forEach(({ shape, originalOpacity, data }) => {
        // Restore original opacity property on the serialized data
        data.opacity = originalOpacity * 100;
        list.push({ id: shape.id, data });

        this.shapeManager.removeShape(shape.id);
        if (shape.destroy) shape.destroy();
      });

      this.canvasEngine.shapeLayer.batchDraw();
      this.markedShapes.clear();

      // Register change in history for undo/redo
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

  _updateCursorPosition(canvasPos, isActive) {
    if (!this.cursorGroup || !this.canvasEngine) return;

    const scale = this.canvasEngine.stage.scaleX() || 1;
    const currentRadius = (isActive ? this.eraserRadius * 1.25 : this.eraserRadius) / scale;

    this.cursorGroup.position({ x: canvasPos.x, y: canvasPos.y });
    this.cursorRing.radius(currentRadius);
    this.cursorRing.strokeWidth(1.5 / scale);
    this.cursorDot.radius(2.5 / scale);

    if (isActive) {
      this.cursorRing.fill('rgba(239, 68, 68, 0.35)');
      this.cursorRing.stroke('#dc2626');
    } else {
      this.cursorRing.fill('rgba(239, 68, 68, 0.2)');
      this.cursorRing.stroke('#ef4444');
    }

    this.cursorGroup.visible(true);
    this.canvasEngine.overlayLayer.batchDraw();
  }

  _handleEraseTouch(data) {
    const { canvasPos, event } = data;
    const isAltKey = event.evt && (event.evt.altKey || event.evt.metaKey);
    const scale = this.canvasEngine.stage.scaleX() || 1;
    const radius = this.eraserRadius / scale;

    // Find touched shapes (either directly clicked node or shapes intersecting the ball)
    const touchedShapes = this._getShapesUnderBall(canvasPos, radius, event.target);

    touchedShapes.forEach(shape => {
      if (isAltKey) {
        // Revert marked shape if Alt is held
        if (this.markedShapes.has(shape.id)) {
          const entry = this.markedShapes.get(shape.id);
          shape.konvaNode.opacity(entry.originalOpacity);
          this.markedShapes.delete(shape.id);
          this.canvasEngine.shapeLayer.batchDraw();
        }
      } else {
        // Mark shape for deletion: reduce opacity to 50%
        if (!this.markedShapes.has(shape.id)) {
          const originalOpacity = shape.konvaNode.opacity();
          this.markedShapes.set(shape.id, {
            shape,
            originalOpacity,
            data: shape.serialize(),
          });

          // Set 50% opacity visual preview
          shape.konvaNode.opacity(originalOpacity * 0.5);
          this.canvasEngine.shapeLayer.batchDraw();
        }
      }
    });
  }

  _getShapesUnderBall(cursorPos, radius, clickedNode) {
    const matched = new Set();
    const shapeLayer = this.canvasEngine.shapeLayer;

    // 1. Direct target node resolution
    if (clickedNode && clickedNode !== this.canvasEngine.stage) {
      let shapeId = clickedNode.id();
      let parent = clickedNode;
      while (parent && !shapeId) {
        parent = parent.getParent();
        if (parent) shapeId = parent.id();
      }
      if (shapeId) {
        const shape = this.shapeManager.getShapeById(shapeId);
        if (shape) matched.add(shape);
      }
    }

    // 2. Spatial proximity check against all shapes
    const allShapes = this.shapeManager.getAllShapes();
    for (const shape of allShapes) {
      if (!shape.konvaNode || !shape.konvaNode.visible()) continue;

      const box = shape.konvaNode.getClientRect({ relativeTo: shapeLayer });
      if (
        cursorPos.x >= box.x - radius &&
        cursorPos.x <= box.x + box.width + radius &&
        cursorPos.y >= box.y - radius &&
        cursorPos.y <= box.y + box.height + radius
      ) {
        matched.add(shape);
      }
    }

    return Array.from(matched);
  }

  _restoreMarkedOpacities() {
    this.markedShapes.forEach(({ shape, originalOpacity }) => {
      if (shape && shape.konvaNode) {
        shape.konvaNode.opacity(originalOpacity);
      }
    });
    if (this.canvasEngine && this.canvasEngine.shapeLayer) {
      this.canvasEngine.shapeLayer.batchDraw();
    }
  }
}
