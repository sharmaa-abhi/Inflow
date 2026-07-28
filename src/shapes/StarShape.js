import Konva from 'konva';
import { BaseShape } from './BaseShape';

export class StarShape extends BaseShape {
  constructor(config = {}) {
    super('star', config);

    this.x = config.x || 0;
    this.y = config.y || 0;
    this.width = config.width || 100;
    this.height = config.height || 100;
    this.numPoints = config.numPoints || 5;

    const outerRadius = Math.min(this.width, this.height) / 2;
    const innerRadius = outerRadius * 0.4;

    this.konvaNode = new Konva.Star({
      id: this.id,
      x: this.x + outerRadius,
      y: this.y + outerRadius,
      numPoints: this.numPoints,
      innerRadius,
      outerRadius,
      rotation: config.rotation || 0,
      scaleX: config.scaleX || 1,
      scaleY: config.scaleY || 1,
      draggable: true,
    });

    this.applyStyles();
  }

  updateGeometry(geom) {
    if (geom.width !== undefined) this.width = geom.width;
    if (geom.height !== undefined) this.height = geom.height;

    const outerRadius = Math.min(Math.abs(this.width), Math.abs(this.height)) / 2;
    const innerRadius = outerRadius * 0.4;

    if (geom.x !== undefined) {
      this.x = geom.x;
      this.konvaNode.x(geom.x + outerRadius);
    }
    if (geom.y !== undefined) {
      this.y = geom.y;
      this.konvaNode.y(geom.y + outerRadius);
    }

    this.konvaNode.outerRadius(outerRadius);
    this.konvaNode.innerRadius(innerRadius);

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
    this.renderRoughWith({ type: 'diamond' });
  }
}
