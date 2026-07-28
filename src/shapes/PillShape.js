import Konva from 'konva';
import { BaseShape } from './BaseShape';

export class PillShape extends BaseShape {
  constructor(config = {}) {
    super('pill', config);

    this.x = config.x || 0;
    this.y = config.y || 0;
    this.width = config.width || 120;
    this.height = config.height || 50;

    this.konvaNode = new Konva.Rect({
      id: this.id,
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height,
      cornerRadius: Math.min(this.width, this.height) / 2,
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
      this.konvaNode.width(geom.width);
    }
    if (geom.height !== undefined) {
      this.height = geom.height;
      this.konvaNode.height(geom.height);
    }

    this.konvaNode.cornerRadius(Math.min(Math.abs(this.width), Math.abs(this.height)) / 2);

    if (this._roughMode) this._scheduleRoughRender();
  }

  getGeometry() {
    return {
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height,
    };
  }

  renderRough() {
    this.renderRoughWith({ type: 'rectangle' });
  }
}
