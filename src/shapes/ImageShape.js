import Konva from 'konva';
import { BaseShape } from './BaseShape';

export class ImageShape extends BaseShape {
  constructor(config = {}) {
    super('image', config);

    this.src = config.src || ''; // Base64 or URL
    this.x = config.x || 0;
    this.y = config.y || 0;
    this.width = config.width || 200;
    this.height = config.height || 150;
    this.aspectRatio = config.aspectRatio || (this.width / (this.height || 1));
    this.lockAspectRatio = config.lockAspectRatio !== undefined ? config.lockAspectRatio : true;
    this.borderRadius = config.borderRadius || 0;
    this.borderWidth = config.borderWidth || 0;
    this.borderColor = config.borderColor || '#1e293b';

    this.konvaImage = new Image();
    
    this.konvaNode = new Konva.Image({
      id: this.id,
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height,
      image: this.konvaImage,
      cornerRadius: this.borderRadius,
      stroke: this.borderColor,
      strokeWidth: this.borderWidth,
      rotation: config.rotation || 0,
      scaleX: config.scaleX || 1,
      scaleY: config.scaleY || 1,
      draggable: true,
    });

    if (this.src) {
      this.loadImage(this.src);
    }

    this.applyStyles();
  }

  loadImage(src) {
    this.src = src;
    this.konvaImage.onload = () => {
      if (!this.width || !this.height) {
        this.width = this.konvaImage.width || 200;
        this.height = this.konvaImage.height || 150;
      }
      this.aspectRatio = this.konvaImage.width / (this.konvaImage.height || 1);
      this.konvaNode.image(this.konvaImage);
      this.konvaNode.width(this.width);
      this.konvaNode.height(this.height);
      const layer = this.konvaNode.getLayer();
      if (layer) layer.batchDraw();
    };
    this.konvaImage.src = src;
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
      this.konvaNode.width(geom.width);
    }
    if (geom.height !== undefined) {
      this.height = geom.height;
      this.konvaNode.height(geom.height);
    }

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

  serialize() {
    const baseData = super.serialize();
    return {
      ...baseData,
      src: this.src,
      aspectRatio: this.aspectRatio,
      lockAspectRatio: this.lockAspectRatio,
      borderRadius: this.borderRadius,
      borderWidth: this.borderWidth,
      borderColor: this.borderColor,
    };
  }
}
