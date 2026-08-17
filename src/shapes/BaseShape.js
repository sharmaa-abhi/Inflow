import Konva from 'konva';
import { generateId } from '../utils/helpers';

/**
 * Abstract Base Shape class representing drawable components in InkFlow.
 * Wraps Konva Node elements with InkFlow data models and styling.
 * Conforms to Excalidraw element template structure.
 */
export class BaseShape {
  /**
   * @param {string} type - Shape type (e.g. 'rectangle', 'circle', 'diamond', 'text', 'line', 'arrow')
   * @param {Object} [config] - Initial geometry and style config
   */
  constructor(type, config = {}) {
    this.type = type;
    this.id = config.id || generateId();
    
    // Geometry
    this.x = config.x || 0;
    this.y = config.y || 0;
    this.width = config.width || 0;
    this.height = config.height || 0;
    
    // Excalidraw-compatible style properties
    this.strokeColor = config.strokeColor || config.style?.stroke || '#1e293b';
    this.backgroundColor = config.backgroundColor || config.style?.fill || 'transparent';
    this.fillStyle = config.fillStyle || 'solid';
    this.strokeWidth = config.strokeWidth || config.style?.strokeWidth || 2;
    this.strokeStyle = config.strokeStyle || config.style?.strokeStyle || 'solid'; // 'solid', 'dashed', 'dotted'
    this.roughness = config.roughness ?? 0; // 0 = crisp, 1-3 = rough
    this.opacity = config.opacity !== undefined ? config.opacity : 100;
    this.angle = config.angle || 0;
    
    // Metadata
    this.seed = config.seed || Math.floor(Math.random() * 99999);
    this.version = config.version || 1;
    this.versionNonce = config.versionNonce || Math.floor(Math.random() * 99999);
    this.isDeleted = config.isDeleted || false;
    this.groupIds = config.groupIds || [];
    this.boundElements = config.boundElements || null;
    this.link = config.link || null;
    this.locked = config.locked || false;
    
    // Backward compatibility
    this.style = {
      stroke: this.strokeColor,
      fill: this.backgroundColor,
      strokeWidth: this.strokeWidth,
      strokeStyle: this.strokeStyle,
      opacity: this.opacity / 100,
      fillStyle: this.fillStyle,
    };
    
    this.konvaNode = null; // Instantiated by child class

    // Rough mode support
    this._roughMode       = false;
    this._roughImageNode  = null; // Konva.Image used in rough mode
    this._roughPending    = false; // debounce flag
  }

  /**
   * Applies Excalidraw-compatible style config onto the Konva node.
   */
  applyStyles() {
    if (!this.konvaNode) return;

    const kProps = {
      stroke: this.strokeColor,
      strokeWidth: this.strokeWidth,
      opacity: this.opacity / 100,
    };

    // Handle fill: Konva transparent can just be empty fill, or we can use fillEnabled
    if (this.backgroundColor && this.backgroundColor !== 'transparent') {
      kProps.fill = this.backgroundColor;
      kProps.fillEnabled = true;
    } else {
      kProps.fill = 'transparent';
      kProps.fillEnabled = false;
    }

    // Handle stroke styles
    if (this.strokeStyle === 'dashed') {
      kProps.dash = [10, 5];
    } else if (this.strokeStyle === 'dotted') {
      kProps.dash = [2, 5];
    } else {
      kProps.dash = []; // Solid
    }

    this.konvaNode.setAttrs(kProps);

    // If rough mode is on, re-render the rough image too
    if (this._roughMode) {
      this._scheduleRoughRender();
    }
  }

  /**
   * Updates shape style properties.
   * @param {Object} styleUpdates 
   */
  updateStyle(styleUpdates) {
    if (styleUpdates.strokeColor) this.strokeColor = styleUpdates.strokeColor;
    if (styleUpdates.backgroundColor) this.backgroundColor = styleUpdates.backgroundColor;
    if (styleUpdates.stroke) this.strokeColor = styleUpdates.stroke; // Backward compat
    if (styleUpdates.fill) this.backgroundColor = styleUpdates.fill; // Backward compat
    if (styleUpdates.strokeWidth !== undefined) this.strokeWidth = styleUpdates.strokeWidth;
    if (styleUpdates.strokeStyle) this.strokeStyle = styleUpdates.strokeStyle;
    if (styleUpdates.opacity !== undefined) {
      // Normalize: internal storage is 0-100, but callers may send 0-1
      this.opacity = styleUpdates.opacity <= 1 && styleUpdates.opacity > 0
        ? styleUpdates.opacity * 100
        : styleUpdates.opacity;
    }
    if (styleUpdates.roughness !== undefined) this.roughness = styleUpdates.roughness;
    if (styleUpdates.fillStyle !== undefined) this.fillStyle = styleUpdates.fillStyle;
    
    // Update backward compat style object
    this.style = {
      stroke: this.strokeColor,
      fill: this.backgroundColor,
      strokeWidth: this.strokeWidth,
      strokeStyle: this.strokeStyle,
      opacity: this.opacity / 100,
      fillStyle: this.fillStyle,
    };
    
    this.applyStyles();
  }

  /**
   * Abstract method: Update shape dimensions based on drag creation or properties.
   * @param {Object} geom 
   */
  updateGeometry(geom) {
    // Implemented by subclasses
  }

  /**
   * Abstract method: Get geometric properties of the shape.
   * @returns {Object} Geometry object
   */
  getGeometry() {
    return {};
  }

  // ─── Rough Mode ──────────────────────────────────────────────────────────

  /**
   * Switches between crisp vector mode and rough sketchy mode.
   * @param {boolean} isRough
   */
  applyRoughMode(isRough) {
    this._roughMode = isRough;

    if (!this.konvaNode) return;

    if (isRough) {
      // Hide the crisp node
      this.konvaNode.visible(false);
      this._scheduleRoughRender();
    } else {
      // Show the crisp node and destroy rough image
      this.konvaNode.visible(true);
      this.applyStyles();
      if (this._roughImageNode) {
        this._roughImageNode.destroy();
        this._roughImageNode = null;
      }
    }
  }

  /**
   * Schedules a rough re-render (debounced to avoid multiple rapid calls).
   */
  _scheduleRoughRender() {
    if (this._roughPending) return;
    this._roughPending = true;
    Promise.resolve().then(() => {
      this._roughPending = false;
      this.renderRough();
    });
  }

  /**
   * Override in subclasses to provide shape-specific rough rendering data.
   */
  renderRough() {
    // Implemented by subclasses via renderRoughWith()
  }

  /**
   * Renders this shape using rough.js onto an OffscreenCanvas and places
   * the resulting Konva.Image on the same layer as konvaNode.
   * @param {Object} extraData - Additional fields for roughRenderer
   */
  async renderRoughWith(extraData = {}) {
    if (!this._roughMode || !this.konvaNode) return;

    const { renderRoughShape, getRoughPadding } = await import('../utils/roughRenderer.js');

    const shapeData = {
      type: this.type,
      x: this.x,
      y: this.y,
      width:  this.width  || 1,
      height: this.height || 1,
      style: {
        strokeColor:     this.strokeColor,
        stroke:          this.strokeColor,
        backgroundColor: this.backgroundColor,
        fill:            this.backgroundColor,
        strokeWidth:     this.strokeWidth,
        roughness:       this.roughness || 1.5,
        fillStyle:       this.fillStyle || 'hachure',
      },
      ...extraData,
    };

    const PAD    = getRoughPadding(this.strokeWidth);
    const bitmap = await renderRoughShape(shapeData);

    // If no bitmap was produced (unsupported type), fall back to showing crisp konva node
    if (!bitmap || (bitmap.width <= 1 && bitmap.height <= 1)) {
      if (this.konvaNode) this.konvaNode.visible(true);
      return;
    }

    const parent = this.konvaNode.getLayer();
    if (!parent) return; // shape may have been destroyed

    if (this._roughImageNode) {
      this._roughImageNode.destroy();
    }

    const originX = (this.type === 'circle') ? this.x - (this.width / 2)  : this.x;
    const originY = (this.type === 'circle') ? this.y - (this.height / 2) : this.y;

    this._roughImageNode = new Konva.Image({
      image:     bitmap,
      x:         originX - PAD,
      y:         originY - PAD,
      width:     bitmap.width,
      height:    bitmap.height,
      opacity:   this.opacity / 100,
      listening: true,
      draggable: true,
      id:        this.id + '_rough',
      rotation:  this.konvaNode.rotation(),
    });

    // Sync drag from rough image back to main konvaNode (for hit-testing / selection)
    this._roughImageNode.on('dragmove', () => {
      const pos = this._roughImageNode.position();
      this.konvaNode.position({ x: pos.x + PAD, y: pos.y + PAD });
    });

    parent.add(this._roughImageNode);
    parent.batchDraw();
  }

  // ─── Serialization ───────────────────────────────────────────────────────

  /**
   * Serializes to Excalidraw element template format.
   * @returns {Object} Excalidraw-compatible JSON element
   */
  serialize() {
    return {
      type: this.type,
      id: this.id,
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height,
      strokeColor: this.strokeColor,
      backgroundColor: this.backgroundColor,
      fillStyle: this.fillStyle,
      strokeWidth: this.strokeWidth,
      strokeStyle: this.strokeStyle,
      roughness: this.roughness,
      opacity: this.opacity,
      angle: this.angle,
      seed: this.seed,
      version: this.version,
      versionNonce: this.versionNonce,
      isDeleted: this.isDeleted,
      groupIds: this.groupIds,
      boundElements: this.boundElements,
      link: this.link,
      locked: this.locked,
    };
  }

  /**
   * Destroys the Konva node instance.
   */
  destroy() {
    if (this.konvaNode) {
      this.konvaNode.destroy();
    }
    if (this._roughImageNode) {
      this._roughImageNode.destroy();
      this._roughImageNode = null;
    }
  }
}
