import { eventBus } from '../core/EventBus';
import { shapeManager } from './ShapeManager';
import { historyManager } from './HistoryManager';

class StyleManager {
  constructor() {
    this.activeStyles = {
      stroke: '#1e293b', // slate-800
      fill: 'transparent',
      strokeWidth: 2,
      strokeStyle: 'solid', // 'solid', 'dashed', 'dotted'
      opacity: 1,
      fontSize: 20,
      fontFamily: 'Inter', // 'Inter', 'Georgia', 'Architects Daughter'
      align: 'left', // 'left', 'center', 'right'
    };
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
        },
        redo: () => {
          historyEntries.forEach(entry => {
            const shape = shapeManager.getShape(entry.shapeId);
            if (shape) {
              shape.updateStyle(entry.newStyle);
            }
          });
          eventBus.emit('shapes-style-modified', selectedShapes);
        }
      });
    }
  }
}

export const styleManager = new StyleManager();
