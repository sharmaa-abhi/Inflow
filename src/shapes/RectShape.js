import Konva from 'konva';
import { BaseShape } from './BaseShape';

export class RectShape extends BaseShape {
  constructor(config = {}) {
    super('rectangle', config);

    this.x = config.x || 0;
    this.y = config.y || 0;
    this.width = config.width || 0;
    this.height = config.height || 0;
    this.roundness = config.roundness || { type: 3 }; // Adaptive roundness

    this.konvaNode = new Konva.Rect({
      id: this.id,
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height,
      rotation: config.rotation || 0,
      scaleX: config.scaleX || 1,
      scaleY: config.scaleY || 1,
      draggable: true,
      cornerRadius: 4,
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
      this.konvaNode.width(geom.width);
    }
    if (geom.height !== undefined) {
      this.height = geom.height;
      this.konvaNode.height(geom.height);
    }
  }

  getGeometry() {
    return {
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height,
    };
  }

  serialize() {
    const baseData = super.serialize();
    return {
      ...baseData,
      roundness: this.roundness,
    };
  }
}
