import Konva from 'konva';
import { BaseShape } from './BaseShape';

export class ArrowShape extends BaseShape {
  constructor(config = {}) {
    super('arrow', config);

    this.width = config.width || 0;
    this.height = config.height || 0;
    this.points = config.points || [[0, 0], [this.width, this.height]];
    this.startBinding = config.startBinding || null;
    this.endBinding = config.endBinding || null;
    this.startArrowhead = config.startArrowhead || null;
    this.endArrowhead = config.endArrowhead || 'arrow';

    const strokeWidth = this.strokeWidth || 2;

    this.konvaNode = new Konva.Arrow({
      id: this.id,
      x: this.x,
      y: this.y,
      points: this.points.flat(),
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
      const strokeWidth = this.strokeWidth || 2;
      this.konvaNode.pointerLength(10 + strokeWidth);
      this.konvaNode.pointerWidth(10 + strokeWidth);
      
      // For arrows, make the arrowhead fill match the stroke color
      this.konvaNode.fill(this.strokeColor);
      this.konvaNode.fillEnabled(true);
    }
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
    }
    if (geom.height !== undefined) {
      this.height = geom.height;
    }
    if (geom.points !== undefined) {
      this.points = geom.points;
    }

    if (geom.width !== undefined || geom.height !== undefined || geom.points !== undefined) {
      const pointsArray = this.points ? this.points.flat() : [0, 0, this.width, this.height];
      this.konvaNode.points(pointsArray);
    }
  }

  getGeometry() {
    return {
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height,
      points: this.points,
    };
  }

  serialize() {
    const baseData = super.serialize();
    return {
      ...baseData,
      points: this.points,
      startBinding: this.startBinding,
      endBinding: this.endBinding,
      startArrowhead: this.startArrowhead,
      endArrowhead: this.endArrowhead,
    };
  }
}
