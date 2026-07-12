import Konva from 'konva';
import { BaseShape } from './BaseShape';

export class RectShape extends BaseShape {
  constructor(config = {}) {
    super('rectangle', config);

    this.konvaNode = new Konva.Rect({
      id: this.id,
      x: config.x || 0,
      y: config.y || 0,
      width: config.width || 0,
      height: config.height || 0,
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
    if (geom.width !== undefined) this.konvaNode.width(geom.width);
    if (geom.height !== undefined) this.konvaNode.height(geom.height);
  }

  getGeometry() {
    return {
      x: this.konvaNode.x(),
      y: this.konvaNode.y(),
      width: this.konvaNode.width(),
      height: this.konvaNode.height(),
    };
  }
}
