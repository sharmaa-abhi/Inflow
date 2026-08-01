import Konva from 'konva';
import { BaseShape } from './BaseShape';
import { resolveFontFamilyName, preloadFont } from '../utils/fontUtils';

export { resolveFontFamilyName, preloadFont } from '../utils/fontUtils';

export class TextShape extends BaseShape {
  constructor(config = {}) {
    super('text', config);

    this.text = config.text !== undefined ? config.text : 'Text';
    this.originalText = config.originalText || this.text;
    this.fontSize = config.fontSize || config.style?.fontSize || 24;
    this.fontFamily = config.fontFamily || config.style?.fontFamily || 'Architects Daughter';
    this.textAlign = config.textAlign || config.align || config.style?.align || 'left';
    this.verticalAlign = config.verticalAlign || 'top';
    this.lineHeight = config.lineHeight || 1.25;
    this.containerId = config.containerId || null;
    this.color = config.color || config.strokeColor || config.style?.stroke || '#1e293b';
    this.strokeColor = this.color;

    const fontName = resolveFontFamilyName(this.fontFamily);

    this.style = {
      ...this.style,
      fontSize: this.fontSize,
      fontFamily: fontName,
      align: this.textAlign,
      stroke: this.color,
    };

    this.konvaNode = new Konva.Text({
      id: this.id,
      x: this.x,
      y: this.y,
      text: this.text,
      fontSize: this.fontSize,
      fontFamily: fontName,
      align: this.textAlign,
      verticalAlign: this.verticalAlign,
      fill: this.color,
      opacity: this.opacity / 100,
      rotation: config.rotation || 0,
      scaleX: config.scaleX || 1,
      scaleY: config.scaleY || 1,
      draggable: true,
      wrap: 'word',
      width: this.width || 180,
      height: this.height || 30,
      lineHeight: this.lineHeight,
    });

    this.applyStyles();
    this.ensureFontLoaded();
  }

  ensureFontLoaded() {
    const fontName = resolveFontFamilyName(this.fontFamily);
    preloadFont(fontName, this.fontSize).then(() => {
      if (this.konvaNode) {
        this.konvaNode.fontFamily(fontName);
        this.konvaNode.height(this.konvaNode.getTextHeight());
        this.konvaNode.getLayer()?.batchDraw();
      }
    });
  }

  updateStyle(styleUpdates) {
    if (styleUpdates.color !== undefined) {
      this.color = styleUpdates.color;
      this.strokeColor = styleUpdates.color;
      this.style.stroke = styleUpdates.color;
    }
    if (styleUpdates.stroke !== undefined) {
      this.color = styleUpdates.stroke;
      this.strokeColor = styleUpdates.stroke;
      this.style.stroke = styleUpdates.stroke;
    }
    if (styleUpdates.fontSize !== undefined) {
      this.fontSize = styleUpdates.fontSize;
      this.style.fontSize = styleUpdates.fontSize;
    }
    if (styleUpdates.fontFamily !== undefined) {
      this.fontFamily = styleUpdates.fontFamily;
      this.style.fontFamily = resolveFontFamilyName(styleUpdates.fontFamily);
    }
    if (styleUpdates.align !== undefined || styleUpdates.textAlign !== undefined) {
      const alignVal = styleUpdates.textAlign || styleUpdates.align;
      this.textAlign = alignVal;
      this.style.align = alignVal;
    }

    super.updateStyle(styleUpdates);
    
    if (this.konvaNode) {
      const fontName = resolveFontFamilyName(this.fontFamily);
      this.konvaNode.setAttrs({
        fontSize: this.fontSize,
        fontFamily: fontName,
        align: this.textAlign,
        fill: this.color,
      });
      this.konvaNode.height(this.konvaNode.getTextHeight());
      this.ensureFontLoaded();
    }
  }

  applyStyles() {
    if (!this.konvaNode) return;
    const fontName = resolveFontFamilyName(this.fontFamily);
    this.konvaNode.setAttrs({
      fontSize: this.fontSize,
      fontFamily: fontName,
      align: this.textAlign,
      verticalAlign: this.verticalAlign,
      fill: this.color || this.strokeColor || '#1e293b',
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
    if (geom.fontFamily !== undefined) {
      this.fontFamily = geom.fontFamily;
      this.konvaNode.fontFamily(resolveFontFamilyName(geom.fontFamily));
    }
    if (geom.color !== undefined) {
      this.color = geom.color;
      this.strokeColor = geom.color;
      this.konvaNode.fill(geom.color);
    }
    if (geom.textAlign !== undefined) {
      this.textAlign = geom.textAlign;
      this.konvaNode.align(geom.textAlign);
    }
    if (this.konvaNode) {
      this.konvaNode.height(this.konvaNode.getTextHeight());
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
      fontFamily: this.fontFamily,
      color: this.color,
      textAlign: this.textAlign,
    };
  }

  applyRoughMode(isRough) {
    this._roughMode = isRough;
    if (this._roughImageNode) {
      this._roughImageNode.destroy();
      this._roughImageNode = null;
    }
    if (this.konvaNode) this.konvaNode.visible(true);
  }

  serialize() {
    const baseData = super.serialize();
    return {
      ...baseData,
      id: this.id,
      type: 'text',
      x: this.x,
      y: this.y,
      text: this.text,
      fontFamily: this.fontFamily,
      fontSize: this.fontSize,
      color: this.color || this.strokeColor,
      textAlign: this.textAlign,
      width: this.width,
      height: this.height,
      originalText: this.originalText,
      verticalAlign: this.verticalAlign,
      lineHeight: this.lineHeight,
      containerId: this.containerId,
    };
  }
}
