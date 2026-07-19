import Konva from 'konva';
import { BaseShape } from './BaseShape';

export class LineShape extends BaseShape {
  constructor(config = {}) {
    super('line', config);

    this.width = config.width || 0;
    this.height = config.height || 0;
    this.points = config.points || [[0, 0], [this.width, this.height]];

    this.konvaNode = new Konva.Line({
      id: this.id,
      x: this.x,
      y: this.y,
      points: this.points.flat(),
      rotation: config.rotation || 0,
      scaleX: config.scaleX || 1,
      scaleY: config.scaleY || 1,
      draggable: true,
      strokeScaleEnabled: false,
    });

    this.applyStyles();
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
    const points = this.konvaNode.points();
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
    };
  }
}
