import { BaseTool } from './BaseTool';
import { RectShape } from '../shapes/RectShape';
import { CircleShape } from '../shapes/CircleShape';
import { DiamondShape } from '../shapes/DiamondShape';
import { LineShape } from '../shapes/LineShape';
import { ArrowShape } from '../shapes/ArrowShape';
import { PillShape } from '../shapes/PillShape';
import { ParallelogramShape } from '../shapes/ParallelogramShape';
import { TrapezoidShape } from '../shapes/TrapezoidShape';
import { CylinderShape } from '../shapes/CylinderShape';
import { CloudShape } from '../shapes/CloudShape';
import { StarShape } from '../shapes/StarShape';
import { SpeechBubbleShape } from '../shapes/SpeechBubbleShape';
import { shapeManager } from '../managers/ShapeManager';
import { styleManager } from '../managers/StyleManager';
import { historyManager } from '../managers/HistoryManager';
import { anchorManager } from '../managers/AnchorManager';
import { snapPointToAngle } from '../utils/math';
import { computeOrthogonalPath } from '../utils/routing';

export class ShapeTool extends BaseTool {
  constructor(canvasEngine, shapeType) {
    super(canvasEngine);
    this.shapeType = shapeType; // 'rectangle', 'circle', 'diamond', 'line', 'arrow', etc.
    this.isDrawing = false;
    this.currentShape = null;
    this.startPos = { x: 0, y: 0 };
    this.isShiftPressed = false;

    // Connector-specific state
    this._startBinding = null; // { shapeId, anchorType, pos }
  }

  activate() {
    super.activate();
    this.canvasEngine.stage.container().style.cursor = 'crosshair';

    // Activate anchor detection for line / arrow tools
    if (this.shapeType === 'line' || this.shapeType === 'arrow') {
      anchorManager.activate();
    }
  }

  deactivate() {
    super.deactivate();
    this.isDrawing = false;
    this.currentShape = null;
    this.canvasEngine.stage.container().style.cursor = 'default';

    if (this.shapeType === 'line' || this.shapeType === 'arrow') {
      anchorManager.deactivate();
    }
  }

  onPointerDown({ canvasPos, event }) {
    // Only draw with left click
    if (event.evt && event.evt.button !== 0) return;

    const isConnector = this.shapeType === 'line' || this.shapeType === 'arrow';

    // Snap start position to anchor if one is hovered
    let startPosToUse = { ...canvasPos };
    this._startBinding = null;

    if (isConnector) {
      const hovered = anchorManager.getHoveredAnchor();
      if (hovered) {
        this._startBinding = { shapeId: hovered.shapeId, anchorType: hovered.anchorType };
        startPosToUse = { ...hovered.pos };
      }
    }

    this.isDrawing = true;
    this.startPos = { ...startPosToUse };
    this.isShiftPressed = event.evt?.shiftKey || false;

    const styles = styleManager.getActiveStyles();

    // Instantiate correct shape based on active selection
    const config = {
      x: startPosToUse.x,
      y: startPosToUse.y,
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
      case 'pill':
        this.currentShape = new PillShape(config);
        break;
      case 'parallelogram':
        this.currentShape = new ParallelogramShape(config);
        break;
      case 'trapezoid':
        this.currentShape = new TrapezoidShape(config);
        break;
      case 'cylinder':
        this.currentShape = new CylinderShape(config);
        break;
      case 'cloud':
        this.currentShape = new CloudShape(config);
        break;
      case 'star':
        this.currentShape = new StarShape(config);
        break;
      case 'speechBubble':
        this.currentShape = new SpeechBubbleShape(config);
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

    const isConnector = this.shapeType === 'line' || this.shapeType === 'arrow';

    if (isConnector) {
      // Check if cursor is near an anchor — snap end point to it
      const hovered = anchorManager.getHoveredAnchor();
      let endPos = hovered ? { ...hovered.pos } : { ...canvasPos };

      // Apply 45-degree snap if shift is pressed and no anchor is hovered
      if (this.isShiftPressed && !hovered) {
        endPos = snapPointToAngle(endPos.x, endPos.y, this.startPos.x, this.startPos.y);
      }

      // Compute orthogonal path if we have a start binding
      const startAnchorType = this._startBinding?.anchorType || 'center';
      const endAnchorType   = hovered?.anchorType            || 'center';

      let newPoints;
      if (this._startBinding || hovered) {
        // Orthogonal routing
        newPoints = computeOrthogonalPath(this.startPos, endPos, startAnchorType, endAnchorType);
      } else {
        // Direct two-point line
        newPoints = [0, 0, endPos.x - this.startPos.x, endPos.y - this.startPos.y];
      }

      this.currentShape.konvaNode.points(newPoints);
      this.currentShape.points = _flatToNested(newPoints);
      this.currentShape.width  = endPos.x - this.startPos.x;
      this.currentShape.height = endPos.y - this.startPos.y;

    } else {
      let currentPos = { ...canvasPos };
      let dx = currentPos.x - this.startPos.x;
      let dy = currentPos.y - this.startPos.y;

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

    const isConnector = this.shapeType === 'line' || this.shapeType === 'arrow';

    // Record end binding if a connector ended on an anchor
    if (isConnector) {
      const hovered = anchorManager.getHoveredAnchor();
      if (hovered) {
        this.currentShape.endBinding = { shapeId: hovered.shapeId, anchorType: hovered.anchorType };
      }
      if (this._startBinding) {
        this.currentShape.startBinding = this._startBinding;
      }

      // Store free endpoints for non-bound ends
      const flat = this.currentShape.konvaNode.points();
      if (!this.currentShape.startBinding) {
        this.currentShape._freeStartPos = { x: this.currentShape.x + flat[0], y: this.currentShape.y + flat[1] };
      }
      if (!this.currentShape.endBinding) {
        this.currentShape._freeEndPos = {
          x: this.currentShape.x + flat[flat.length - 2],
          y: this.currentShape.y + flat[flat.length - 1],
        };
      }
    }

    if (!isConnector) {
      // Check if drawing was too small
      const geom = this.currentShape.getGeometry();
      const sizeThreshold = 4;
      const w = geom.width;
      const h = geom.height;

      if (Math.hypot(w, h) < sizeThreshold) {
        const defaultSize = 80;
        if (this.shapeType === 'circle') {
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
    } else {
      // Give connector a minimum length
      const flat = this.currentShape.konvaNode.points();
      if (flat.length >= 4) {
        const dx = flat[flat.length - 2] - flat[0];
        const dy = flat[flat.length - 1] - flat[1];
        if (Math.hypot(dx, dy) < 4) {
          const newFlat = [0, 0, 80, 0];
          this.currentShape.konvaNode.points(newFlat);
          this.currentShape.points = _flatToNested(newFlat);
          this.currentShape.width = 80;
          this.currentShape.height = 0;
          this.canvasEngine.shapeLayer.batchDraw();
        }
      }
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
        const reCreated = shapeManager.recreateShape(shape.serialize());
        this.canvasEngine.shapeLayer.add(reCreated.konvaNode);
        this.canvasEngine.shapeLayer.batchDraw();
      }
    });

    this.isDrawing = false;
    this._startBinding = null;
    this.currentShape = null;

    shapeManager.select([shape.id]);
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function _flatToNested(flat) {
  const result = [];
  for (let i = 0; i < flat.length; i += 2) {
    result.push([flat[i], flat[i + 1]]);
  }
  return result;
}
