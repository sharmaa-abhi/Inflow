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
    };
    
    this.konvaNode = null; // Instantiated by child class
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
    if (styleUpdates.opacity !== undefined) this.opacity = styleUpdates.opacity;
    if (styleUpdates.roughness !== undefined) this.roughness = styleUpdates.roughness;
    
    // Update backward compat style object
    this.style = {
      stroke: this.strokeColor,
      fill: this.backgroundColor,
      strokeWidth: this.strokeWidth,
      strokeStyle: this.strokeStyle,
      opacity: this.opacity / 100,
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
  }
}
