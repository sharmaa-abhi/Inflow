import Konva from 'konva';
import { BaseShape } from './BaseShape';

export class DiamondShape extends BaseShape {
  constructor(config = {}) {
    super('diamond', config);

    this.width = config.width || 0;
    this.height = config.height || 0;

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
    return [
      width / 2, 0,          // Top
      width, height / 2,     // Right
      width / 2, height,     // Bottom
      0, height / 2          // Left
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
    
    const currentWidth = geom.width !== undefined ? geom.width : this.width;
    const currentHeight = geom.height !== undefined ? geom.height : this.height;
    
    if (geom.width !== undefined) {
      this.width = geom.width;
    }
    if (geom.height !== undefined) {
      this.height = geom.height;
    }
    
    if (geom.width !== undefined || geom.height !== undefined) {
      this.konvaNode.points(this.calculatePoints(currentWidth, currentHeight));
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
}
