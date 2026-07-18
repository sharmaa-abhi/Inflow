import Konva from 'konva';
import { BaseShape } from './BaseShape';

export class PenShape extends BaseShape {
  constructor(config = {}) {
    super('pen', config);

    this.points = config.points || [];

    this.konvaNode = new Konva.Line({
      id: this.id,
      x: config.x || 0,
      y: config.y || 0,
      points: this.points,
      closed: false,
      // Smoother line corners and caps
      lineCap: 'round',
      lineJoin: 'round',
      rotation: config.rotation || 0,
      scaleX: config.scaleX || 1,
      scaleY: config.scaleY || 1,
      draggable: true,
    });

    this.applyStyles();
  }

  applyStyles() {
    super.applyStyles();
    if (!this.konvaNode) return;

    // Apply tension for smooth curves (default to 0.4)
    const tension = this.style.smoothingTension !== undefined ? this.style.smoothingTension : 0.4;
    this.konvaNode.tension(tension);
  }

  updateGeometry(geom) {
    if (geom.x !== undefined) this.konvaNode.x(geom.x);
    if (geom.y !== undefined) this.konvaNode.y(geom.y);
    if (geom.points) {
      this.points = geom.points;
      this.konvaNode.points(this.points);
    }
  }

  getGeometry() {
    return {
      x: this.konvaNode.x(),
      y: this.konvaNode.y(),
      points: this.points,
    };
  }
}
