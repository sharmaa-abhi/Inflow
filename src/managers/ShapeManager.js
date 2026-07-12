import { eventBus } from '../core/EventBus';
import { RectShape } from '../shapes/RectShape';
import { CircleShape } from '../shapes/CircleShape';
import { DiamondShape } from '../shapes/DiamondShape';
import { LineShape } from '../shapes/LineShape';
import { ArrowShape } from '../shapes/ArrowShape';
// Note: PenShape and TextShape will be imported once implemented,
// but let's import them now since we will create them in Milestone 3.
import { PenShape } from '../shapes/PenShape';
import { TextShape } from '../shapes/TextShape';

class ShapeManager {
  constructor() {
    this.shapes = new Map(); // id -> Shape instance
    this.selectedIds = new Set();
    this.clipboard = []; // List of serialized shape JSONs
  }

  addShape(shape) {
    this.shapes.set(shape.id, shape);
    eventBus.emit('shapes-updated');
  }

  removeShape(id) {
    const shape = this.shapes.get(id);
    if (shape) {
      this.shapes.delete(id);
      this.selectedIds.delete(id);
      eventBus.emit('shapes-updated');
      eventBus.emit('selection-changed', this.getSelectedShapeIds());
    }
  }

  getShape(id) {
    return this.shapes.get(id);
  }

  clear() {
    this.shapes.clear();
    this.selectedIds.clear();
    eventBus.emit('shapes-updated');
    eventBus.emit('selection-changed', this.getSelectedShapeIds());
  }

  getAllShapes() {
    return Array.from(this.shapes.values());
  }

  getShapes() {
    return this.getAllShapes();
  }

  getShapeById(id) {
    return this.getShape(id);
  }


  // Selection state
  select(ids) {
    this.selectedIds.clear();
    for (const id of ids) {
      if (this.shapes.has(id)) {
        this.selectedIds.add(id);
      }
    }
    eventBus.emit('selection-changed', this.getSelectedShapeIds());
  }

  toggleSelect(id) {
    if (this.selectedIds.has(id)) {
      this.selectedIds.delete(id);
    } else if (this.shapes.has(id)) {
      this.selectedIds.add(id);
    }
    eventBus.emit('selection-changed', this.getSelectedShapeIds());
  }

  deselectAll() {
    if (this.selectedIds.size > 0) {
      this.selectedIds.clear();
      eventBus.emit('selection-changed', this.getSelectedShapeIds());
    }
  }

  getSelectedShapeIds() {
    return Array.from(this.selectedIds);
  }

  getSelectedShapes() {
    return this.getSelectedShapeIds()
      .map(id => this.shapes.get(id))
      .filter(Boolean);
  }

  // Instantiates a new shape object from its serialized JSON state
  recreateShape(json) {
    let shape;
    switch (json.type) {
      case 'rectangle':
        shape = new RectShape(json);
        break;
      case 'circle':
        shape = new CircleShape(json);
        break;
      case 'diamond':
        shape = new DiamondShape(json);
        break;
      case 'line':
        shape = new LineShape(json);
        break;
      case 'arrow':
        shape = new ArrowShape(json);
        break;
      case 'pen':
        shape = new PenShape(json);
        break;
      case 'text':
        shape = new TextShape(json);
        break;
      default:
        console.warn('Unknown shape type to recreate:', json.type);
        return null;
    }
    
    // Restore rotation and scaling properties
    if (shape && shape.konvaNode) {
      if (json.rotation !== undefined) shape.konvaNode.rotation(json.rotation);
      if (json.scaleX !== undefined) shape.konvaNode.scaleX(json.scaleX);
      if (json.scaleY !== undefined) shape.konvaNode.scaleY(json.scaleY);
    }

    this.shapes.set(shape.id, shape);
    eventBus.emit('shapes-updated');
    return shape;
  }
}

export const shapeManager = new ShapeManager();
