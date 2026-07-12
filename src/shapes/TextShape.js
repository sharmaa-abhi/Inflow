import Konva from 'konva';
import { BaseShape } from './BaseShape';

export class TextShape extends BaseShape {
  constructor(config = {}) {
    super('text', config);

    this.text = config.text || 'Text';

    this.konvaNode = new Konva.Text({
      id: this.id,
      x: config.x || 0,
      y: config.y || 0,
      text: this.text,
      fontSize: this.style.fontSize || 20,
      fontFamily: this.style.fontFamily || 'Inter',
      align: this.style.textAlign || 'left',
      // By default text fills with stroke color in whiteboard apps
      fill: this.style.stroke || '#1e293b',
      opacity: this.style.opacity !== undefined ? this.style.opacity : 1,
      rotation: config.rotation || 0,
      scaleX: config.scaleX || 1,
      scaleY: config.scaleY || 1,
      draggable: true,
      // Wrap options
      wrap: 'word',
      width: config.width || 200, // Default wrapping width
    });

    this.applyStyles();
  }

  applyStyles() {
    if (!this.konvaNode) return;
    
    // Apply font specific styles
    this.konvaNode.setAttrs({
      fontSize: this.style.fontSize,
      fontFamily: this.style.fontFamily,
      align: this.style.textAlign,
      fill: this.style.stroke,
      opacity: this.style.opacity,
    });
  }

  updateGeometry(geom) {
    if (geom.x !== undefined) this.konvaNode.x(geom.x);
    if (geom.y !== undefined) this.konvaNode.y(geom.y);
    if (geom.width !== undefined) this.konvaNode.width(geom.width);
    if (geom.height !== undefined) this.konvaNode.height(geom.height);
    if (geom.text !== undefined) {
      this.text = geom.text;
      this.konvaNode.text(this.text);
    }
  }

  getGeometry() {
    return {
      x: this.konvaNode.x(),
      y: this.konvaNode.y(),
      width: this.konvaNode.width(),
      height: this.konvaNode.height(),
      text: this.text,
    };
  }

  serialize() {
    const serialized = super.serialize();
    serialized.text = this.text;
    serialized.width = this.konvaNode.width();
    serialized.height = this.konvaNode.height();
    return serialized;
  }
}
