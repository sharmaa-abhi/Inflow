import { BaseTool } from './BaseTool';
import { RectShape } from '../shapes/RectShape';
import { CircleShape } from '../shapes/CircleShape';
import { DiamondShape } from '../shapes/DiamondShape';
import { LineShape } from '../shapes/LineShape';
import { ArrowShape } from '../shapes/ArrowShape';
import { shapeManager } from '../managers/ShapeManager';
import { styleManager } from '../managers/StyleManager';
import { historyManager } from '../managers/HistoryManager';
import { snapPointToAngle } from '../utils/math';

export class ShapeTool extends BaseTool {
  constructor(canvasEngine, shapeType) {
    super(canvasEngine);
    this.shapeType = shapeType; // 'rectangle', 'circle', 'diamond', 'line', 'arrow'
    this.isDrawing = false;
    this.currentShape = null;
    this.startPos = { x: 0, y: 0 };
    this.isShiftPressed = false;
  }

  activate() {
    super.activate();
    this.canvasEngine.stage.container().style.cursor = 'crosshair';
  }

  deactivate() {
    super.deactivate();
    this.isDrawing = false;
    this.currentShape = null;
    this.canvasEngine.stage.container().style.cursor = 'default';
  }

  onPointerDown({ canvasPos, event }) {
    // Only draw with left click
    if (event.evt && event.evt.button !== 0) return;

    this.isDrawing = true;
    this.startPos = { ...canvasPos };
    this.isShiftPressed = event.evt?.shiftKey || false;

    const styles = styleManager.getActiveStyles();

    // Instantiate correct shape based on active selection
    const config = {
      x: canvasPos.x,
      y: canvasPos.y,
      width: 0,
      height: 0,
      style: { ...styles },
    };

    switch (this.shapeType) {
      case 'rectangle':
        this.currentShape = new RectShape(config);
        break;
      case 'circle':
        // Ellipse center is initialized at startPos, updated during drag
        this.currentShape = new CircleShape(config);
        break;
      case 'diamond':
        this.currentShape = new DiamondShape(config);
        break;
      case 'line':
        this.currentShape = new LineShape(config);
        break;
      case 'arrow':
        this.currentShape = new ArrowShape(config);
        break;
      default:
        this.isDrawing = false;
        return;
    }

    // Add shape to canvas
    shapeManager.addShape(this.currentShape);
    this.canvasEngine.shapeLayer.add(this.currentShape.konvaNode);
    this.canvasEngine.shapeLayer.batchDraw();
  }

  onPointerMove({ canvasPos, event }) {
    if (!this.isDrawing || !this.currentShape) return;

    this.isShiftPressed = event.evt?.shiftKey || false;

    let currentPos = { ...canvasPos };
    let dx = currentPos.x - this.startPos.x;
    let dy = currentPos.y - this.startPos.y;

    if (this.shapeType === 'line' || this.shapeType === 'arrow') {
      if (this.isShiftPressed) {
        // Snap line to 45 degree increments
        currentPos = snapPointToAngle(currentPos.x, currentPos.y, this.startPos.x, this.startPos.y);
        dx = currentPos.x - this.startPos.x;
        dy = currentPos.y - this.startPos.y;
      }
      
      this.currentShape.updateGeometry({
        width: dx,
        height: dy,
      });
    } else {
      // For rectangular/ellipse shapes
      if (this.isShiftPressed) {
        // Lock aspect ratio (square or perfect circle)
        const size = Math.max(Math.abs(dx), Math.abs(dy));
        dx = Math.sign(dx) * size;
        dy = Math.sign(dy) * size;
      }

      // Calculate bounding box properties
      const x = Math.min(this.startPos.x, this.startPos.x + dx);
      const y = Math.min(this.startPos.y, this.startPos.y + dy);
      const w = Math.abs(dx);
      const h = Math.abs(dy);

      if (this.shapeType === 'circle') {
        // Ellipse needs center position and radius
        this.currentShape.updateGeometry({
          x: x + w / 2,
          y: y + h / 2,
          width: w,
          height: h,
        });
      } else {
        this.currentShape.updateGeometry({
          x,
          y,
          width: w,
          height: h,
        });
      }
    }

    this.canvasEngine.shapeLayer.batchDraw();
  }

  onPointerUp({ canvasPos, event }) {
    if (!this.isDrawing || !this.currentShape) return;

    // Check if drawing was too small (e.g. user just clicked).
    // If so, give it a default size so shape doesn't disappear.
    const geom = this.currentShape.getGeometry();
    const sizeThreshold = 4;
    const isLine = this.shapeType === 'line' || this.shapeType === 'arrow';

    const w = isLine ? geom.width : geom.width;
    const h = isLine ? geom.height : geom.height;
    
    if (Math.hypot(w, h) < sizeThreshold) {
      const defaultSize = 80;
      if (isLine) {
        this.currentShape.updateGeometry({ width: defaultSize, height: 0 });
      } else if (this.shapeType === 'circle') {
        this.currentShape.updateGeometry({
          x: this.startPos.x + defaultSize / 2,
          y: this.startPos.y + defaultSize / 2,
          width: defaultSize,
          height: defaultSize
        });
      } else {
        this.currentShape.updateGeometry({ width: defaultSize, height: defaultSize });
      }
      this.canvasEngine.shapeLayer.batchDraw();
    }

    // Register creation in history
    const shape = this.currentShape;
    historyManager.registerChange({
      type: 'add',
      shapeId: shape.id,
      shapeData: shape.serialize(),
      undo: () => {
        shapeManager.removeShape(shape.id);
        shape.destroy();
        this.canvasEngine.shapeLayer.batchDraw();
      },
      redo: () => {
        // Re-create
        const reCreated = shapeManager.recreateShape(shape.serialize());
        this.canvasEngine.shapeLayer.add(reCreated.konvaNode);
        this.canvasEngine.shapeLayer.batchDraw();
      }
    });

    this.isDrawing = false;
    this.currentShape = null;

    // Emit event that shape drawing finished.
    // ToolManager can choose to automatically select V (select tool) or keep shape tool active.
    // Let's notify that drawing completed.
    shapeManager.select([shape.id]);
  }
}
