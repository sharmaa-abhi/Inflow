import Konva from 'konva';
import { BaseShape } from './BaseShape';

export class CloudShape extends BaseShape {
  constructor(config = {}) {
    super('cloud', config);

    this.x = config.x || 0;
    this.y = config.y || 0;
    this.width = config.width || 140;
    this.height = config.height || 90;

    this.konvaNode = new Konva.Path({
      id: this.id,
      x: this.x,
      y: this.y,
      data: this.calculatePath(this.width, this.height),
      rotation: config.rotation || 0,
      scaleX: config.scaleX || 1,
      scaleY: config.scaleY || 1,
      draggable: true,
      lineJoin: 'round',
    });

    this.applyStyles();
  }

  calculatePath(w, h) {
    // Cloud path constructed using cubic beziers
    return `
      M ${w * 0.25} ${h * 0.8}
      C ${w * 0.05} ${h * 0.8} ${w * 0.05} ${h * 0.5} ${w * 0.2} ${h * 0.45}
      C ${w * 0.15} ${h * 0.2} ${w * 0.4} ${h * 0.1} ${w * 0.55} ${h * 0.25}
      C ${w * 0.65} ${h * 0.1} ${w * 0.9} ${h * 0.2} ${w * 0.85} ${h * 0.45}
      C ${w * 0.98} ${h * 0.5} ${w * 0.98} ${h * 0.8} ${w * 0.75} ${h * 0.8}
      Z
    `.trim();
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
    if (geom.width !== undefined) this.width = geom.width;
    if (geom.height !== undefined) this.height = geom.height;

    this.konvaNode.data(this.calculatePath(this.width, this.height));

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
    this.renderRoughWith({ type: 'circle' });
  }
}
