import Konva from 'konva';
import { BaseShape } from './BaseShape';

export class DiamondShape extends BaseShape {
  constructor(config = {}) {
    super('diamond', config);

    const width = config.width || 0;
    const height = config.height || 0;

    this.konvaNode = new Konva.Line({
      id: this.id,
      x: config.x || 0,
      y: config.y || 0,
      points: this.calculatePoints(width, height),
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
    return [
      width / 2, 0,          // Top
      width, height / 2,     // Right
      width / 2, height,     // Bottom
      0, height / 2          // Left
    ];
  }

  updateGeometry(geom) {
    if (geom.x !== undefined) this.konvaNode.x(geom.x);
    if (geom.y !== undefined) this.konvaNode.y(geom.y);
    
    const currentWidth = geom.width !== undefined ? geom.width : this.getGeometry().width;
    const currentHeight = geom.height !== undefined ? geom.height : this.getGeometry().height;
    
    if (geom.width !== undefined || geom.height !== undefined) {
      this.konvaNode.points(this.calculatePoints(currentWidth, currentHeight));
    }
  }

  getGeometry() {
    // Determine dimensions from the points array bounding box
    const points = this.konvaNode.points();
    const w = points[2] || 0; // rightmost x
    const h = points[5] || 0; // bottom-most y
    return {
      x: this.konvaNode.x(),
      y: this.konvaNode.y(),
      width: w,
      height: h,
    };
  }
}
