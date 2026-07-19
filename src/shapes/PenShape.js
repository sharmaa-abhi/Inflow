import Konva from 'konva';
import { BaseShape } from './BaseShape';

export class PenShape extends BaseShape {
  constructor(config = {}) {
    super('pen', config);

    this.points = config.points || [];
    this.pressures = config.pressures || []; // For pressure-sensitive pen input
    this.smoothingTension = config.smoothingTension || 0.4;
    this.isEraser = config.isEraser || false;

    // Calculate bounds from points
    this.recalculateBounds();

    this.konvaNode = new Konva.Line({
      id: this.id,
      x: this.x,
      y: this.y,
      points: this.points,
      closed: false,
      lineCap: 'round',
      lineJoin: 'round',
      rotation: config.rotation || 0,
      scaleX: config.scaleX || 1,
      scaleY: config.scaleY || 1,
      draggable: true,
    });

    this.applyStyles();
  }

  recalculateBounds() {
    if (this.points.length === 0) {
      this.width = 0;
      this.height = 0;
      return;
    }
    
    let minX = this.points[0] || 0;
    let maxX = minX;
    let minY = this.points[1] || 0;
    let maxY = minY;
    
    for (let i = 0; i < this.points.length; i += 2) {
      const x = this.points[i];
      const y = this.points[i + 1];
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
    
    this.x = minX;
    this.y = minY;
    this.width = maxX - minX;
    this.height = maxY - minY;
  }

  applyStyles() {
    super.applyStyles();
    if (!this.konvaNode) return;

    // Apply tension for smooth curves
    this.konvaNode.tension(this.smoothingTension);
  }

  updateGeometry(geom) {
    if (geom.x !== undefined) {
      this.x = geom.x;
      this.konvaNode.x(geom.x);
    }
    if (geom.y !== undefined) {
      this.y = geom.y;
      this.konvaNode.y(geom.y);
    }
    if (geom.points) {
      this.points = geom.points;
      this.konvaNode.points(this.points);
      this.recalculateBounds();
    }
  }

  getGeometry() {
    return {
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height,
      points: this.points,
    };
  }

  serialize() {
    const baseData = super.serialize();
    return {
      ...baseData,
      points: this.points,
      pressures: this.pressures,
      smoothingTension: this.smoothingTension,
      isEraser: this.isEraser,
    };
  }
}
