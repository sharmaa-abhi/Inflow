import Konva from 'konva';
import { BaseShape } from './BaseShape';

export class CylinderShape extends BaseShape {
  constructor(config = {}) {
    super('cylinder', config);

    this.x = config.x || 0;
    this.y = config.y || 0;
    this.width = config.width || 100;
    this.height = config.height || 120;

    // Create a composite Konva.Path for the 3D database cylinder
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
    const ry = Math.min(20, h * 0.15); // rim height
    const rx = w / 2;

    // Full 3D database cylinder SVG path:
    // Top ellipse + side lines + bottom curve + inner top rim
    return `
      M 0 ${ry}
      A ${rx} ${ry} 0 1 1 ${w} ${ry}
      A ${rx} ${ry} 0 1 1 0 ${ry}
      Z
      M 0 ${ry}
      V ${h - ry}
      A ${rx} ${ry} 0 0 0 ${w} ${h - ry}
      V ${ry}
      M 0 ${ry}
      A ${rx} ${ry} 0 0 0 ${w} ${ry}
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
    this.renderRoughWith({ type: 'rectangle' });
  }
}
