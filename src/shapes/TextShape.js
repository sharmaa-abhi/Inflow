import Konva from 'konva';
import { BaseShape } from './BaseShape';

export class TextShape extends BaseShape {
  constructor(config = {}) {
    super('text', config);

    this.text = config.text || 'Text';
    this.originalText = config.originalText || this.text;
    this.fontSize = config.fontSize || config.style?.fontSize || 20;
    this.fontFamily = config.fontFamily || config.style?.fontFamily || 3; // 3 = Architects Daughter in Excalidraw
    this.textAlign = config.textAlign || config.style?.align || 'left';
    this.verticalAlign = config.verticalAlign || 'top';
    this.lineHeight = config.lineHeight || 1.25;
    this.containerId = config.containerId || null;

    let fontName = 'Inter, sans-serif';
    if (this.fontFamily === 3) {
      fontName = "'Architects Daughter', cursive";
    } else if (this.fontFamily === 2) {
      fontName = 'Georgia, serif';
    } else if (typeof this.fontFamily === 'string') {
      fontName = this.fontFamily;
    }

    this.style = {
      ...this.style,
      fontSize: this.fontSize,
      fontFamily: fontName,
      align: this.textAlign,
    };

    this.konvaNode = new Konva.Text({
      id: this.id,
      x: this.x,
      y: this.y,
      text: this.text,
      fontSize: this.fontSize,
      fontFamily: this.style.fontFamily || 'Inter',
      align: this.textAlign,
      verticalAlign: this.verticalAlign,
      fill: this.strokeColor || '#1e293b',
      opacity: this.opacity / 100,
      rotation: config.rotation || 0,
      scaleX: config.scaleX || 1,
      scaleY: config.scaleY || 1,
      draggable: true,
      wrap: 'word',
      width: this.width || 200,
      height: this.height || 25,
      lineHeight: this.lineHeight,
    });

    this.applyStyles();
  }

  updateStyle(styleUpdates) {
    if (styleUpdates.fontSize !== undefined) this.fontSize = styleUpdates.fontSize;
    if (styleUpdates.fontFamily !== undefined) {
      this.fontFamily = styleUpdates.fontFamily;
      let fontName = styleUpdates.fontFamily;
      if (styleUpdates.fontFamily === 3) {
        fontName = "'Architects Daughter', cursive";
      } else if (styleUpdates.fontFamily === 2) {
        fontName = 'Georgia, serif';
      }
      this.style.fontFamily = fontName;
    }
    if (styleUpdates.align !== undefined) {
      this.textAlign = styleUpdates.align;
      this.style.align = styleUpdates.align;
    }

    super.updateStyle(styleUpdates);
    
    // Recalculate text height after font size / font family modifications
    if (this.konvaNode) {
      this.konvaNode.height(this.konvaNode.getTextHeight());
    }
  }

  applyStyles() {
    if (!this.konvaNode) return;
    
    // Apply text-specific styles
    this.konvaNode.setAttrs({
      fontSize: this.fontSize,
      fontFamily: this.style.fontFamily || 'Inter',
      align: this.textAlign,
      verticalAlign: this.verticalAlign,
      fill: this.strokeColor || '#1e293b',
      opacity: this.opacity / 100,
      lineHeight: this.lineHeight,
    });
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
    if (geom.text !== undefined) {
      this.text = geom.text;
      this.originalText = geom.text;
      this.konvaNode.text(this.text);
    }
    if (geom.fontSize !== undefined) {
      this.fontSize = geom.fontSize;
      this.konvaNode.fontSize(geom.fontSize);
    }
    if (geom.textAlign !== undefined) {
      this.textAlign = geom.textAlign;
      this.konvaNode.align(geom.textAlign);
    }
  }

  getGeometry() {
    return {
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height,
      text: this.text,
      fontSize: this.fontSize,
      textAlign: this.textAlign,
    };
  }

  serialize() {
    const baseData = super.serialize();
    return {
      ...baseData,
      text: this.text,
      originalText: this.originalText,
      fontSize: this.fontSize,
      fontFamily: this.fontFamily,
      textAlign: this.textAlign,
      verticalAlign: this.verticalAlign,
      lineHeight: this.lineHeight,
      containerId: this.containerId,
    };
  }
}
