import Konva from 'konva';
import { BaseShape } from './BaseShape';

export class TrapezoidShape extends BaseShape {
  constructor(config = {}) {
    super('trapezoid', config);

    this.x = config.x || 0;
    this.y = config.y || 0;
    this.width = config.width || 120;
    this.height = config.height || 60;
    this.inset = config.inset || 0.2; // 20% inset on top

    this.konvaNode = new Konva.Line({
      id: this.id,
      x: this.x,
      y: this.y,
      points: this.calculatePoints(this.width, this.height),
      closed: true,
      rotation: config.rotation || 0,
      scaleX: config.scaleX || 1,
      scaleY: config.scaleY || 1,
      draggable: true,
      strokeScaleEnabled: false,
    });

    this.applyStyles();
  }

  calculatePoints(width, height) {
    const offset = width * this.inset;
    return [
      offset, 0,
      width - offset, 0,
      width, height,
      0, height,
    ];
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

    this.konvaNode.points(this.calculatePoints(this.width, this.height));

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
    const offset = this.width * this.inset;
    const pts = [
      [offset, 0],
      [this.width - offset, 0],
      [this.width, this.height],
      [0, this.height],
    ];
    this.renderRoughWith({ type: 'polygon', polygonPoints: pts });
  }
}
