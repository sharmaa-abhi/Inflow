import Konva from 'konva';
import { BaseShape } from './BaseShape';
import { parseSvgPaths } from '../utils/svgParser';

/**
 * SvgShape — Wraps parsed SVG path data into a registered BaseShape.
 *
 * Fixes BUG-005: Previously, SVG imports were added as raw Konva.Group nodes
 * without registration in shapeManager, making them unselectable, undeletable,
 * and excluded from JSON export/autosave.
 *
 * This class resolves that by:
 * - Wrapping SVG path data inside a Konva.Group as konvaNode
 * - Extending BaseShape so it fully participates in the app data model
 * - Serializing the parsed path data for persistence across saves/imports
 */
export class SvgShape extends BaseShape {
  /**
   * @param {Object} config
   * @param {string}  [config.svgText]  - Raw SVG XML (used on first import)
   * @param {Array}   [config.paths]    - Pre-parsed path data (used on JSON restore)
   * @param {number}  [config.x]
   * @param {number}  [config.y]
   */
  constructor(config = {}) {
    super('svg', config);

    this.x = config.x || 0;
    this.y = config.y || 0;
    this.width  = config.width  || 100;
    this.height = config.height || 100;

    // Parse from SVG text on first import; use saved path data on restore
    const pathsData = Array.isArray(config.paths) && config.paths.length > 0
      ? config.paths
      : (config.svgText ? parseSvgPaths(config.svgText) : []);

    // Store for serialization (paths survive JSON export/import without re-parsing SVG)
    this.paths = pathsData;

    this.konvaNode = new Konva.Group({
      id: this.id,
      x: this.x,
      y: this.y,
      draggable: true,
      rotation: config.rotation || 0,
      scaleX: config.scaleX || 1,
      scaleY: config.scaleY || 1,
    });

    pathsData.forEach(p => {
      const konvaPath = new Konva.Path({
        data: p.d,
        fill: p.fill && p.fill !== 'none' ? p.fill : undefined,
        fillEnabled: !!(p.fill && p.fill !== 'none'),
        stroke: p.stroke && p.stroke !== 'none' ? p.stroke : '#1e293b',
        strokeWidth: p.strokeWidth || 1,
      });
      this.konvaNode.add(konvaPath);
    });
  }

  updateGeometry(geom) {
    if (geom.x !== undefined) { this.x = geom.x; this.konvaNode.x(geom.x); }
    if (geom.y !== undefined) { this.y = geom.y; this.konvaNode.y(geom.y); }
    if (geom.width  !== undefined) this.width  = geom.width;
    if (geom.height !== undefined) this.height = geom.height;
  }

  getGeometry() {
    return { x: this.x, y: this.y, width: this.width, height: this.height };
  }

  /**
   * SVG path children have their own fill/stroke — skip BaseShape color override.
   */
  applyStyles() {
    if (!this.konvaNode) return;
    this.konvaNode.opacity(this.opacity / 100);
  }

  /**
   * BUG-004 parity: SVG shapes stay visible in sketchy/rough mode.
   */
  applyRoughMode(isRough) {
    this._roughMode = isRough;
    if (this._roughImageNode) {
      this._roughImageNode.destroy();
      this._roughImageNode = null;
    }
    if (this.konvaNode) this.konvaNode.visible(true);
  }

  serialize() {
    const base = super.serialize();
    return {
      ...base,
      // Serialize parsed paths so the shape can be restored without re-parsing SVG
      paths: this.paths,
    };
  }

  destroy() {
    if (this.konvaNode) {
      this.konvaNode.destroyChildren();
      this.konvaNode.destroy();
      this.konvaNode = null;
    }
    if (this._roughImageNode) {
      this._roughImageNode.destroy();
      this._roughImageNode = null;
    }
  }
}
