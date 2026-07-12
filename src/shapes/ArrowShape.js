import Konva from 'konva';
import { BaseShape } from './BaseShape';

export class ArrowShape extends BaseShape {
  constructor(config = {}) {
    super('arrow', config);

    const width = config.width || 0;
    const height = config.height || 0;
    const strokeWidth = config.style?.strokeWidth || 2;

    this.konvaNode = new Konva.Arrow({
      id: this.id,
      x: config.x || 0,
      y: config.y || 0,
      points: [0, 0, width, height],
      pointerLength: 10 + strokeWidth,
      pointerWidth: 10 + strokeWidth,
      rotation: config.rotation || 0,
      scaleX: config.scaleX || 1,
      scaleY: config.scaleY || 1,
      draggable: true,
      strokeScaleEnabled: false,
    });

    this.applyStyles();
  }

  // Override applyStyles to sync arrow pointer sizes with stroke width changes
  applyStyles() {
    super.applyStyles();
    if (this.konvaNode) {
      const strokeWidth = this.style.strokeWidth || 2;
      this.konvaNode.pointerLength(10 + strokeWidth);
      this.konvaNode.pointerWidth(10 + strokeWidth);
      
      // For arrows, if fill is set, it fills the arrowhead.
      // Usually, in Excalidraw, arrowheads match stroke color or are filled solid.
      // Let's make the arrowhead fill match the stroke color.
      this.konvaNode.fill(this.style.stroke);
      this.konvaNode.fillEnabled(true);
    }
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
