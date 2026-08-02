import Konva from 'konva';
import { BaseShape } from './BaseShape';
import { resolveFontFamily, resolveFontEntry, preloadFont, DEFAULT_FONT_SIZE, DEFAULT_FONT_FAMILY_ID } from '../utils/fontUtils';

// Backward-compat re-exports
const resolveFontFamilyName = resolveFontFamily;
export { resolveFontFamilyName, preloadFont };

/**
 * TextShape — Full-featured text element for the InkFlow canvas.
 *
 * Supports: font family (5 fonts), font size (13 presets), bold, italic,
 * underline, text alignment (L/C/R/J), letter-spacing, line-height,
 * word-spacing, paragraph-spacing, opacity, auto/fixed width, color.
 *
 * Serialization produces Excalidraw-compatible JSON with extended typography fields.
 */
export class TextShape extends BaseShape {
  constructor(config = {}) {
    super('text', config);

    // ─── Core text content ─────────────────────────────────────────────
    this.text = config.text !== undefined ? config.text : '';
    this.originalText = config.originalText || this.text;

    // ─── Font properties ───────────────────────────────────────────────
    const fontEntry = resolveFontEntry(config.fontFamily || config.style?.fontFamily || DEFAULT_FONT_FAMILY_ID);
    this.fontFamily = fontEntry.name;
    this.fontSize = config.fontSize || config.style?.fontSize || DEFAULT_FONT_SIZE;
    this.fontWeight = config.fontWeight || 400;         // 100–900
    this.fontStyle = config.fontStyle || 'normal';       // 'normal' | 'italic'
    this.textDecoration = config.textDecoration || 'none'; // 'none' | 'underline' | 'line-through'

    // ─── Layout & alignment ────────────────────────────────────────────
    this.textAlign = config.textAlign || config.align || config.style?.align || 'left';
    this.verticalAlign = config.verticalAlign || 'top';
    this.lineHeight = config.lineHeight ?? 1.35;
    this.letterSpacing = config.letterSpacing ?? 0;
    this.wordSpacing = config.wordSpacing ?? 0;
    this.paragraphSpacing = config.paragraphSpacing ?? 0;
    this.autoWidth = config.autoWidth !== undefined ? config.autoWidth : true;
    this.textWrap = config.textWrap || 'auto'; // 'auto' | 'fixed'

    // ─── Appearance ────────────────────────────────────────────────────
    this.color = config.color || config.strokeColor || config.style?.stroke || '#1e293b';
    this.strokeColor = this.color;
    this.containerId = config.containerId || null;

    // ─── Resolve CSS font string ───────────────────────────────────────
    const fontFamilyCSS = resolveFontFamily(this.fontFamily);

    // Backward-compat style object
    this.style = {
      ...this.style,
      fontSize: this.fontSize,
      fontFamily: fontFamilyCSS,
      align: this.textAlign,
      stroke: this.color,
    };

    // ─── Konva Text Node ───────────────────────────────────────────────
    this.konvaNode = new Konva.Text({
      id: this.id,
      x: this.x,
      y: this.y,
      text: this.text || ' ', // Konva needs non-empty for sizing
      fontSize: this.fontSize,
      fontFamily: fontFamilyCSS,
      fontStyle: this._buildKonvaFontStyle(),
      textDecoration: this._konvaTextDecoration(),
      align: this.textAlign,
      verticalAlign: this.verticalAlign,
      fill: this.color,
      opacity: (this.opacity ?? 100) / 100,
      rotation: config.rotation || 0,
      scaleX: config.scaleX || 1,
      scaleY: config.scaleY || 1,
      draggable: true,
      wrap: this.textWrap === 'fixed' ? 'word' : 'none',
      width: this.autoWidth ? undefined : (this.width || 200),
      lineHeight: this.lineHeight,
      letterSpacing: this.letterSpacing,
    });

    // Set dimensions
    if (!this.autoWidth && this.width) {
      this.konvaNode.width(this.width);
    }

    this.applyStyles();
    this._recalcSize();
    this.ensureFontLoaded();
  }

  // ─── Konva font style helpers ──────────────────────────────────────────

  /**
   * Builds the Konva fontStyle string combining weight and italic.
   * Konva accepts: 'normal', 'bold', 'italic', 'bold italic', '500', '500 italic', etc.
   */
  _buildKonvaFontStyle() {
    const parts = [];
    if (this.fontWeight && this.fontWeight !== 400) {
      parts.push(this.fontWeight >= 700 ? 'bold' : String(this.fontWeight));
    }
    if (this.fontStyle === 'italic') {
      parts.push('italic');
    }
    return parts.length > 0 ? parts.join(' ') : 'normal';
  }

  /**
   * Converts textDecoration to Konva format.
   * Konva supports: '' (none), 'underline', 'line-through'
   */
  _konvaTextDecoration() {
    if (this.textDecoration === 'underline') return 'underline';
    if (this.textDecoration === 'line-through') return 'line-through';
    return '';
  }

  // ─── Font Loading ─────────────────────────────────────────────────────

  ensureFontLoaded() {
    const fontFamilyCSS = resolveFontFamily(this.fontFamily);
    preloadFont(fontFamilyCSS, this.fontSize).then(() => {
      if (this.konvaNode) {
        this.konvaNode.fontFamily(fontFamilyCSS);
        this._recalcSize();
        this.konvaNode.getLayer()?.batchDraw();
      }
    });
  }

  // ─── Size Recalculation ───────────────────────────────────────────────

  _recalcSize() {
    if (!this.konvaNode) return;

    if (this.autoWidth) {
      // Let Konva auto-size width, then read it back
      this.konvaNode.width(undefined);
      const measured = this.measureText(this.text || ' ');
      this.width = Math.max(measured.width + 4, 20);
      this.height = Math.max(measured.height, this.fontSize * this.lineHeight);
      this.konvaNode.width(this.width);
    }

    this.height = Math.max(this.konvaNode.height(), this.fontSize * this.lineHeight);
    this.konvaNode.height(this.height);
  }

  // ─── Text Measurement ─────────────────────────────────────────────────

  /**
   * Measures text dimensions using an offscreen canvas for pixel-perfect accuracy.
   * @param {string} text
   * @returns {{ width: number, height: number }}
   */
  measureText(text) {
    if (!TextShape._measureCanvas) {
      TextShape._measureCanvas = document.createElement('canvas');
      TextShape._measureCtx = TextShape._measureCanvas.getContext('2d');
    }
    const ctx = TextShape._measureCtx;
    const fontFamilyCSS = resolveFontFamily(this.fontFamily);
    const stylePrefix = this._buildKonvaFontStyle();
    ctx.font = `${stylePrefix} ${this.fontSize}px ${fontFamilyCSS}`.trim();

    if (this.letterSpacing) {
      ctx.letterSpacing = `${this.letterSpacing}px`;
    }

    const lines = (text || '').split('\n');
    let maxWidth = 0;
    for (const line of lines) {
      const m = ctx.measureText(line || ' ');
      if (m.width > maxWidth) maxWidth = m.width;
    }

    const lineH = this.fontSize * this.lineHeight;
    const height = lines.length * lineH + this.paragraphSpacing * Math.max(0, lines.length - 1);

    return { width: maxWidth, height };
  }

  // ─── Style Updates ────────────────────────────────────────────────────

  updateStyle(styleUpdates) {
    // Color
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

    // Font size
    if (styleUpdates.fontSize !== undefined) {
      this.fontSize = styleUpdates.fontSize;
      this.style.fontSize = styleUpdates.fontSize;
    }

    // Font family
    if (styleUpdates.fontFamily !== undefined) {
      const entry = resolveFontEntry(styleUpdates.fontFamily);
      this.fontFamily = entry.name;
      this.style.fontFamily = resolveFontFamily(entry.name);
    }

    // Font weight (bold)
    if (styleUpdates.fontWeight !== undefined) {
      this.fontWeight = styleUpdates.fontWeight;
    }
    if (styleUpdates.bold !== undefined) {
      this.fontWeight = styleUpdates.bold ? 700 : 400;
    }

    // Font style (italic)
    if (styleUpdates.fontStyle !== undefined) {
      this.fontStyle = styleUpdates.fontStyle;
    }
    if (styleUpdates.italic !== undefined) {
      this.fontStyle = styleUpdates.italic ? 'italic' : 'normal';
    }

    // Text decoration (underline / strikethrough)
    if (styleUpdates.textDecoration !== undefined) {
      this.textDecoration = styleUpdates.textDecoration;
    }
    if (styleUpdates.underline !== undefined) {
      this.textDecoration = styleUpdates.underline ? 'underline' : 'none';
    }

    // Alignment
    if (styleUpdates.align !== undefined || styleUpdates.textAlign !== undefined) {
      const alignVal = styleUpdates.textAlign || styleUpdates.align;
      this.textAlign = alignVal;
      this.style.align = alignVal;
    }

    // Typography controls
    if (styleUpdates.letterSpacing !== undefined) this.letterSpacing = styleUpdates.letterSpacing;
    if (styleUpdates.lineHeight !== undefined) this.lineHeight = styleUpdates.lineHeight;
    if (styleUpdates.wordSpacing !== undefined) this.wordSpacing = styleUpdates.wordSpacing;
    if (styleUpdates.paragraphSpacing !== undefined) this.paragraphSpacing = styleUpdates.paragraphSpacing;
    if (styleUpdates.autoWidth !== undefined) this.autoWidth = styleUpdates.autoWidth;
    if (styleUpdates.textWrap !== undefined) this.textWrap = styleUpdates.textWrap;

    // Opacity
    if (styleUpdates.opacity !== undefined) this.opacity = styleUpdates.opacity;

    // Call base updateStyle for stroke/fill/etc
    super.updateStyle(styleUpdates);

    // Apply to Konva node
    if (this.konvaNode) {
      const fontFamilyCSS = resolveFontFamily(this.fontFamily);
      this.konvaNode.setAttrs({
        fontSize: this.fontSize,
        fontFamily: fontFamilyCSS,
        fontStyle: this._buildKonvaFontStyle(),
        textDecoration: this._konvaTextDecoration(),
        align: this.textAlign,
        fill: this.color,
        lineHeight: this.lineHeight,
        letterSpacing: this.letterSpacing,
        opacity: (this.opacity ?? 100) / 100,
        wrap: this.textWrap === 'fixed' ? 'word' : 'none',
      });

      if (!this.autoWidth && this.width) {
        this.konvaNode.width(this.width);
      }

      this._recalcSize();
      this.ensureFontLoaded();
    }
  }

  applyStyles() {
    if (!this.konvaNode) return;
    const fontFamilyCSS = resolveFontFamily(this.fontFamily);
    this.konvaNode.setAttrs({
      fontSize: this.fontSize,
      fontFamily: fontFamilyCSS,
      fontStyle: this._buildKonvaFontStyle(),
      textDecoration: this._konvaTextDecoration(),
      align: this.textAlign,
      verticalAlign: this.verticalAlign,
      fill: this.color || this.strokeColor || '#1e293b',
      opacity: (this.opacity ?? 100) / 100,
      lineHeight: this.lineHeight,
      letterSpacing: this.letterSpacing,
    });
  }

  // ─── Geometry ─────────────────────────────────────────────────────────

  updateGeometry(geom) {
    if (geom.x !== undefined) { this.x = geom.x; this.konvaNode.x(geom.x); }
    if (geom.y !== undefined) { this.y = geom.y; this.konvaNode.y(geom.y); }
    if (geom.width !== undefined) { this.width = geom.width; this.konvaNode.width(geom.width); }
    if (geom.height !== undefined) { this.height = geom.height; this.konvaNode.height(geom.height); }
    if (geom.text !== undefined) {
      this.text = geom.text;
      this.originalText = geom.text;
      this.konvaNode.text(this.text || ' ');
    }
    if (geom.fontSize !== undefined) { this.fontSize = geom.fontSize; this.konvaNode.fontSize(geom.fontSize); }
    if (geom.fontFamily !== undefined) {
      const entry = resolveFontEntry(geom.fontFamily);
      this.fontFamily = entry.name;
      this.konvaNode.fontFamily(resolveFontFamily(entry.name));
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
    if (geom.fontWeight !== undefined) {
      this.fontWeight = geom.fontWeight;
      this.konvaNode.fontStyle(this._buildKonvaFontStyle());
    }
    if (geom.fontStyle !== undefined) {
      this.fontStyle = geom.fontStyle;
      this.konvaNode.fontStyle(this._buildKonvaFontStyle());
    }
    if (geom.textDecoration !== undefined) {
      this.textDecoration = geom.textDecoration;
      this.konvaNode.textDecoration(this._konvaTextDecoration());
    }
    if (geom.lineHeight !== undefined) {
      this.lineHeight = geom.lineHeight;
      this.konvaNode.lineHeight(geom.lineHeight);
    }
    if (geom.letterSpacing !== undefined) {
      this.letterSpacing = geom.letterSpacing;
      this.konvaNode.letterSpacing(geom.letterSpacing);
    }

    this._recalcSize();
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
      fontWeight: this.fontWeight,
      fontStyle: this.fontStyle,
      textDecoration: this.textDecoration,
      color: this.color,
      textAlign: this.textAlign,
      lineHeight: this.lineHeight,
      letterSpacing: this.letterSpacing,
    };
  }

  // ─── Rough Mode (text doesn't use rough rendering) ────────────────────

  applyRoughMode(isRough) {
    this._roughMode = isRough;
    if (this._roughImageNode) {
      this._roughImageNode.destroy();
      this._roughImageNode = null;
    }
    if (this.konvaNode) this.konvaNode.visible(true);
  }

  // ─── Serialization ────────────────────────────────────────────────────

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
      fontWeight: this.fontWeight,
      fontStyle: this.fontStyle,
      textDecoration: this.textDecoration,
      color: this.color || this.strokeColor,
      textAlign: this.textAlign,
      width: this.width,
      height: this.height,
      originalText: this.originalText,
      verticalAlign: this.verticalAlign,
      lineHeight: this.lineHeight,
      letterSpacing: this.letterSpacing,
      wordSpacing: this.wordSpacing,
      paragraphSpacing: this.paragraphSpacing,
      autoWidth: this.autoWidth,
      textWrap: this.textWrap,
      containerId: this.containerId,
    };
  }

  /**
   * Generates editable SVG representation for vector exports.
   * @returns {string} SVG text element string
   */
  toSVGElement() {
    const fontFamilyCSS = resolveFontFamily(this.fontFamily).replace(/"/g, '&quot;');
    const lines = (this.text || '').split('\n');
    const lineH = this.fontSize * (this.lineHeight || 1.35);
    const opacity = (this.opacity ?? 100) / 100;

    let textAnchor = 'start';
    let xOffset = this.x;
    if (this.textAlign === 'center') {
      textAnchor = 'middle';
      xOffset = this.x + (this.width || 0) / 2;
    } else if (this.textAlign === 'right') {
      textAnchor = 'end';
      xOffset = this.x + (this.width || 0);
    }

    const tspans = lines.map((line, idx) => {
      const dy = idx === 0 ? this.fontSize * 0.8 : lineH;
      const escaped = (line || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
      return `<tspan x="${xOffset}" dy="${dy}">${escaped}</tspan>`;
    }).join('');

    const transform = this.angle ? ` transform="rotate(${this.angle} ${this.x} ${this.y})"` : '';
    const styleAttr = `font-family:${fontFamilyCSS};font-size:${this.fontSize}px;font-weight:${this.fontWeight};font-style:${this.fontStyle};text-decoration:${this.textDecoration};fill:${this.color};opacity:${opacity};letter-spacing:${this.letterSpacing}px;word-spacing:${this.wordSpacing}px;`;

    return `<text x="${xOffset}" y="${this.y}" text-anchor="${textAnchor}" style="${styleAttr}"${transform}>${tspans}</text>`;
  }
}
