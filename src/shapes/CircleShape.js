import Konva from 'konva';
import { BaseShape } from './BaseShape';

export class CircleShape extends BaseShape {
  constructor(config = {}) {
    super('circle', config);

    // If width/height are provided, use them to compute radiusX/radiusY
    this.width = config.width || 0;
    this.height = config.height || 0;
    this.radiusX = config.radiusX || (this.width / 2) || 0;
    this.radiusY = config.radiusY || (this.height / 2) || 0;

    this.konvaNode = new Konva.Ellipse({
      id: this.id,
      x: this.x, // center x
      y: this.y, // center y
      radiusX: this.radiusX,
      radiusY: this.radiusY,
      rotation: config.rotation || 0,
      scaleX: config.scaleX || 1,
      scaleY: config.scaleY || 1,
      draggable: true,
    });

    this.applyStyles();
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
    if (geom.width !== undefined) {
      this.width = geom.width;
      this.konvaNode.radiusX(Math.abs(geom.width / 2));
    }
    if (geom.height !== undefined) {
      this.height = geom.height;
      this.konvaNode.radiusY(Math.abs(geom.height / 2));
    }
    if (geom.radiusX !== undefined) {
      this.radiusX = geom.radiusX;
      this.konvaNode.radiusX(geom.radiusX);
    }
    if (geom.radiusY !== undefined) {
      this.radiusY = geom.radiusY;
      this.konvaNode.radiusY(geom.radiusY);
    }
  }

  getGeometry() {
    const rx = this.konvaNode.radiusX();
    const ry = this.konvaNode.radiusY();
    return {
      x: this.x,
      y: this.y,
      width: rx * 2,
      height: ry * 2,
      radiusX: rx,
      radiusY: ry,
    };
  }
}
