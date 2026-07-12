import Konva from 'konva';
import { BaseShape } from './BaseShape';

export class CircleShape extends BaseShape {
  constructor(config = {}) {
    super('circle', config);

    // If width/height are provided, use them to compute radiusX/radiusY
    const width = config.width || 0;
    const height = config.height || 0;

    this.konvaNode = new Konva.Ellipse({
      id: this.id,
      x: config.x || 0, // center x
      y: config.y || 0, // center y
      radiusX: config.radiusX || (width / 2) || 0,
      radiusY: config.radiusY || (height / 2) || 0,
      rotation: config.rotation || 0,
      scaleX: config.scaleX || 1,
      scaleY: config.scaleY || 1,
      draggable: true,
    });

    this.applyStyles();
  }

  updateGeometry(geom) {
    if (geom.x !== undefined) this.konvaNode.x(geom.x);
    if (geom.y !== undefined) this.konvaNode.y(geom.y);
    if (geom.width !== undefined) this.konvaNode.radiusX(Math.abs(geom.width / 2));
    if (geom.height !== undefined) this.konvaNode.radiusY(Math.abs(geom.height / 2));
    if (geom.radiusX !== undefined) this.konvaNode.radiusX(geom.radiusX);
    if (geom.radiusY !== undefined) this.konvaNode.radiusY(geom.radiusY);
  }

  getGeometry() {
    const rx = this.konvaNode.radiusX();
    const ry = this.konvaNode.radiusY();
    return {
      x: this.konvaNode.x(),
      y: this.konvaNode.y(),
      width: rx * 2,
      height: ry * 2,
      radiusX: rx,
      radiusY: ry,
    };
  }
}
