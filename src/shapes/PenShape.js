import Konva from 'konva';
import { BaseShape } from './BaseShape';

export class PenShape extends BaseShape {
  constructor(config = {}) {
    super('pen', config);

    this.pressures = config.pressures || [];
    this.smoothingTension = config.smoothingTension !== undefined ? config.smoothingTension : 0.4;
    this.isEraser = config.isEraser || false;

    const rawPoints = config.points || [];

    // If config.x and config.y are not explicitly provided, normalize from absolute points
    if (rawPoints.length >= 2 && config.x === undefined && config.y === undefined) {
      this._setFromAbsolutePoints(rawPoints);
    } else {
      this.x = config.x || 0;
      this.y = config.y || 0;
      this.points = rawPoints;
      this.recalculateBounds();
    }

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
      listening: true,
    });

    this.applyStyles();
  }

  _setFromAbsolutePoints(absPoints) {
    if (!absPoints || absPoints.length < 2) {
      this.x = 0;
      this.y = 0;
      this.width = 0;
      this.height = 0;
      this.points = [];
      return;
    }

    let minX = absPoints[0];
    let maxX = minX;
    let minY = absPoints[1];
    let maxY = minY;

    for (let i = 0; i < absPoints.length; i += 2) {
      const px = absPoints[i];
      const py = absPoints[i + 1];
      if (px < minX) minX = px;
      if (px > maxX) maxX = px;
      if (py < minY) minY = py;
      if (py > maxY) maxY = py;
    }

    this.x = minX;
    this.y = minY;
    this.width = maxX - minX;
    this.height = maxY - minY;

    this.points = [];
    for (let i = 0; i < absPoints.length; i += 2) {
      this.points.push(absPoints[i] - minX, absPoints[i + 1] - minY);
    }
  }

  recalculateBounds() {
    if (!this.points || this.points.length === 0) {
      this.width = 0;
      this.height = 0;
      return;
    }

    let minX = this.points[0];
    let maxX = minX;
    let minY = this.points[1];
    let maxY = minY;

    for (let i = 0; i < this.points.length; i += 2) {
      const px = this.points[i];
      const py = this.points[i + 1];
      if (px < minX) minX = px;
      if (px > maxX) maxX = px;
      if (py < minY) minY = py;
      if (py > maxY) maxY = py;
    }

    this.width = maxX - minX;
    this.height = maxY - minY;
  }

  applyStyles() {
    super.applyStyles();
    if (!this.konvaNode) return;

    // Freehand stroke must not close or fill
    this.konvaNode.fillEnabled(false);
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
      if (geom.isAbsolute) {
        this._setFromAbsolutePoints(geom.points);
        this.konvaNode.position({ x: this.x, y: this.y });
      } else {
        this.points = geom.points;
        this.recalculateBounds();
      }
      this.konvaNode.points(this.points);
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

  /**
   * BUG-004 fix: Pen strokes always rendered crisp — no rough equivalent for freehand paths.
   */
  applyRoughMode(isRough) {
    this._roughMode = isRough;
    if (this._roughImageNode) {
      this._roughImageNode.destroy();
      this._roughImageNode = null;
    }
    if (this.konvaNode) this.konvaNode.visible(true);
  }

  getAbsolutePoints() {
    const abs = [];
    for (let i = 0; i < this.points.length; i += 2) {
      abs.push(this.points[i] + (this.x || 0), this.points[i + 1] + (this.y || 0));
    }
    return abs;
  }

  serialize() {
    const baseData = super.serialize();
    return {
      ...baseData,
      x: this.x,
      y: this.y,
      points: this.points,
      pressures: this.pressures,
      smoothingTension: this.smoothingTension,
      isEraser: this.isEraser,
    };
  }
}
