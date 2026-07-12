import Konva from 'konva';
import { BaseShape } from './BaseShape';

export class LineShape extends BaseShape {
  constructor(config = {}) {
    super('line', config);

    // Default points: [0, 0, width, height] starting from x, y
    const width = config.width || 0;
    const height = config.height || 0;

    this.konvaNode = new Konva.Line({
      id: this.id,
      x: config.x || 0,
      y: config.y || 0,
      points: [0, 0, width, height],
      rotation: config.rotation || 0,
      scaleX: config.scaleX || 1,
      scaleY: config.scaleY || 1,
      draggable: true,
      strokeScaleEnabled: false,
    });

    this.applyStyles();
  }

  updateGeometry(geom) {
    if (geom.x !== undefined) this.konvaNode.x(geom.x);
    if (geom.y !== undefined) this.konvaNode.y(geom.y);

    const currentPoints = this.konvaNode.points();
    let dx = currentPoints[2];
    let dy = currentPoints[3];

    if (geom.width !== undefined) dx = geom.width;
    if (geom.height !== undefined) dy = geom.height;

    if (geom.width !== undefined || geom.height !== undefined) {
      this.konvaNode.points([0, 0, dx, dy]);
    }
  }

  getGeometry() {
    const points = this.konvaNode.points();
    return {
      x: this.konvaNode.x(),
      y: this.konvaNode.y(),
      width: points[2] || 0,
      height: points[3] || 0,
    };
  }
}
