import Konva from 'konva';
import { BaseShape } from './BaseShape';

export class StickyNoteShape extends BaseShape {
  constructor(config = {}) {
    super('stickyNote', config);

    this.x = config.x || 0;
    this.y = config.y || 0;
    this.width = config.width || 160;
    this.height = config.height || 160;
    this.text = config.text || 'Sticky Note';
    this.noteColor = config.noteColor || config.backgroundColor || '#FEF08A'; // Pastel Yellow default

    this.style.fill = this.noteColor;
    this.backgroundColor = this.noteColor;

    // Group containing card rect + text
    this.konvaNode = new Konva.Group({
      id: this.id,
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height,
      rotation: config.rotation || 0,
      scaleX: config.scaleX || 1,
      scaleY: config.scaleY || 1,
      draggable: true,
    });

    // Card background
    this.cardRect = new Konva.Rect({
      width: this.width,
      height: this.height,
      fill: this.noteColor,
      stroke: '#e2e8f0',
      strokeWidth: 1,
      cornerRadius: 4,
      shadowColor: 'rgba(0, 0, 0, 0.12)',
      shadowBlur: 10,
      shadowOffsetY: 4,
      shadowOffsetX: 2,
      id: this.id + '_card',
    });

    // Embedded text
    this.textNode = new Konva.Text({
      x: 12,
      y: 12,
      width: this.width - 24,
      height: this.height - 24,
      text: this.text,
      fontSize: 15,
      fontFamily: "'Architects Daughter', Inter, sans-serif",
      fill: '#1e293b',
      align: 'left',
      verticalAlign: 'top',
      wrap: 'word',
      id: this.id + '_text',
    });

    this.konvaNode.add(this.cardRect);
    this.konvaNode.add(this.textNode);

    this.applyStyles();
  }

  applyStyles() {
    super.applyStyles();
    if (this.cardRect) {
      this.cardRect.fill(this.backgroundColor || this.noteColor);
    }
  }

  updateStyle(styleUpdates) {
    if (styleUpdates.backgroundColor || styleUpdates.fill) {
      this.noteColor = styleUpdates.backgroundColor || styleUpdates.fill;
      this.backgroundColor = this.noteColor;
    }
    super.updateStyle(styleUpdates);
    if (this.cardRect) {
      this.cardRect.fill(this.noteColor);
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
      this.cardRect.width(geom.width);
      this.textNode.width(geom.width - 24);
    }
    if (geom.height !== undefined) {
      this.height = geom.height;
      this.cardRect.height(geom.height);
      this.textNode.height(geom.height - 24);
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

  renderRough() {
    this.renderRoughWith({ type: 'rectangle' });
  }

  serialize() {
    const baseData = super.serialize();
    return {
      ...baseData,
      text: this.text,
      noteColor: this.noteColor,
    };
  }
}
