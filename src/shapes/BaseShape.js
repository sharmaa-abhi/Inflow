import { generateId } from '../utils/helpers';

/**
 * Abstract Base Shape class representing drawable components in InkFlow.
 * Wraps Konva Node elements with InkFlow data models and styling.
 */
export class BaseShape {
  /**
   * @param {string} type - Shape type (e.g. 'rectangle', 'circle', 'diamond')
   * @param {Object} [config] - Initial geometry and style config
   */
  constructor(type, config = {}) {
    this.id = config.id || generateId();
    this.type = type;
    this.style = {
      stroke: config.style?.stroke || '#1e293b', // slate-800
      fill: config.style?.fill || 'transparent',
      strokeWidth: config.style?.strokeWidth || 2,
      strokeStyle: config.style?.strokeStyle || 'solid', // 'solid', 'dashed', 'dotted'
      opacity: config.style?.opacity !== undefined ? config.style?.opacity : 1,
      ...config.style,
    };
    
    this.konvaNode = null; // Instantiated by child class
  }

  /**
   * Applies InkFlow style config onto the Konva node.
   */
  applyStyles() {
    if (!this.konvaNode) return;

    const kProps = {
      stroke: this.style.stroke,
      strokeWidth: this.style.strokeWidth,
      opacity: this.style.opacity,
    };

    // Handle fill: Konva transparent can just be empty fill, or we can use fillEnabled
    if (this.style.fill && this.style.fill !== 'transparent') {
      kProps.fill = this.style.fill;
      kProps.fillEnabled = true;
    } else {
      kProps.fill = 'transparent';
      // If transparent, we don't enable fill so clicking inside transparent shapes doesn't trigger selection,
      // which matches Excalidraw's behavior. We can toggle listening or keep fillEnabled: false depending on requirements.
      kProps.fillEnabled = false;
    }

    // Handle stroke styles
    if (this.style.strokeStyle === 'dashed') {
      kProps.dash = [10, 5];
    } else if (this.style.strokeStyle === 'dotted') {
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
    this.style = { ...this.style, ...styleUpdates };
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
   * Serializes the shape representation into a plain JSON object.
   * @returns {Object} JSON shape state
   */
  serialize() {
    const geom = this.getGeometry();
    
    // Core node attributes
    const rotation = this.konvaNode ? this.konvaNode.rotation() : 0;
    const scaleX = this.konvaNode ? this.konvaNode.scaleX() : 1;
    const scaleY = this.konvaNode ? this.konvaNode.scaleY() : 1;

    return {
      id: this.id,
      type: this.type,
      style: { ...this.style },
      rotation,
      scaleX,
      scaleY,
      ...geom,
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
