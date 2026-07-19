import { eventBus } from '../core/EventBus';
import { shapeManager } from './ShapeManager';
import { historyManager } from './HistoryManager';

class StyleManager {
  constructor() {
    this.activeStyles = {
      stroke: '#1e3a5f', // Brand Primary Stroke
      fill: 'transparent',
      strokeWidth: 2,
      strokeStyle: 'solid', // 'solid', 'dashed', 'dotted'
      opacity: 1,
      fontSize: 20,
      fontFamily: 'Inter', // 'Inter', 'Georgia', 'Architects Daughter'
      align: 'left', // 'left', 'center', 'right'
      smoothingMode: 'erdp', // 'standard' or 'erdp'
      smoothingTension: 0.4, // float from 0 to 1
    };

    // Listen to theme changes to swap default styles
    eventBus.on('theme-changed', (theme) => {
      if (theme === 'dark') {
        if (this.activeStyles.stroke === '#1e3a5f') {
          this.activeStyles.stroke = '#ffffff';
        }
        if (this.activeStyles.fill === '#1e3a5f') {
          this.activeStyles.fill = '#ffffff';
        }
      } else {
        if (this.activeStyles.stroke === '#ffffff') {
          this.activeStyles.stroke = '#1e3a5f';
        }
        if (this.activeStyles.fill === '#ffffff') {
          this.activeStyles.fill = '#1e3a5f';
        }
      }
      eventBus.emit('active-style-changed', this.activeStyles);
    });
  }

  getActiveStyles() {
    return { ...this.activeStyles };
  }

  /**
   * Update active styles and apply to selected shapes
   * @param {Object} styleUpdates - Style properties to update
   */
  updateStyles(styleUpdates) {
    // Update local active style
    this.activeStyles = { ...this.activeStyles, ...styleUpdates };
    eventBus.emit('active-style-changed', this.activeStyles);

    // Apply to selected shapes (if any)
    const selectedShapes = shapeManager.getSelectedShapes();
    if (selectedShapes.length > 0) {
      const historyEntries = [];

      selectedShapes.forEach(shape => {
        // Capture old style for undo
        const oldStyle = {};
        const newStyle = {};

        Object.keys(styleUpdates).forEach(key => {
          oldStyle[key] = shape.style[key];
          newStyle[key] = styleUpdates[key];
        });

        // Apply changes
        shape.updateStyle(styleUpdates);

        historyEntries.push({
          shapeId: shape.id,
          oldStyle,
          newStyle,
        });
      });

      // Redraw shapes layer
      eventBus.emit('shapes-style-modified', selectedShapes);
      eventBus.emit('shapes-updated');

      // Register undo action
      historyManager.registerChange({
        type: 'style-change',
        entries: historyEntries,
        undo: () => {
          historyEntries.forEach(entry => {
            const shape = shapeManager.getShape(entry.shapeId);
            if (shape) {
              shape.updateStyle(entry.oldStyle);
            }
          });
          eventBus.emit('shapes-style-modified', selectedShapes);
          eventBus.emit('shapes-updated');
        },
        redo: () => {
          historyEntries.forEach(entry => {
            const shape = shapeManager.getShape(entry.shapeId);
            if (shape) {
              shape.updateStyle(entry.newStyle);
            }
          });
          eventBus.emit('shapes-style-modified', selectedShapes);
          eventBus.emit('shapes-updated');
        }
      });
    }
  }

  setStrokeColor(color) {
    this.updateStyles({ stroke: color });
  }

  setFillColor(color) {
    this.updateStyles({ fill: color });
  }

  setStrokeWidth(width) {
    this.updateStyles({ strokeWidth: width });
  }

  setStrokeStyle(style) {
    this.updateStyles({ strokeStyle: style });
  }

  setSmoothingMode(mode) {
    this.updateStyles({ smoothingMode: mode });
  }

  setSmoothingTension(tension) {
    this.updateStyles({ smoothingTension: tension });
  }
}

export const styleManager = new StyleManager();
