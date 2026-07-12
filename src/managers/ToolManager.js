import { eventBus } from '../core/EventBus';
import { SelectTool } from '../tools/SelectTool';
import { ShapeTool } from '../tools/ShapeTool';
import { PenTool } from '../tools/PenTool';
import { TextTool } from '../tools/TextTool';
import { LaserTool } from '../tools/LaserTool';
import { shapeManager } from './ShapeManager';
import { styleManager } from './StyleManager';
import { historyManager } from './HistoryManager';
import { generateId } from '../utils/helpers';

class ToolManager {
  constructor() {
    this.canvasEngine = null;
    this.tools = new Map();
    this.activeTool = null;
    this.activeToolType = 'select';
    
    // Keyboard arrow nudging states
    this.isNudging = false;
    this.nudgeStartPositions = null;
    this.nudgeHistoryTimeout = null;
  }

  /**
   * Initializes the tools and subscribes to events.
   * @param {CanvasEngine} canvasEngine 
   */
  init(canvasEngine) {
    this.canvasEngine = canvasEngine;

    // Register all tools
    this.tools.set('select', new SelectTool(canvasEngine, shapeManager, styleManager));
    this.tools.set('rectangle', new ShapeTool(canvasEngine, 'rectangle'));
    this.tools.set('circle', new ShapeTool(canvasEngine, 'circle'));
    this.tools.set('diamond', new ShapeTool(canvasEngine, 'diamond'));
    this.tools.set('line', new ShapeTool(canvasEngine, 'line'));
    this.tools.set('arrow', new ShapeTool(canvasEngine, 'arrow'));
    this.tools.set('pen', new PenTool(canvasEngine, shapeManager, styleManager));
    this.tools.set('text', new TextTool(canvasEngine, shapeManager, styleManager));
    this.tools.set('laser', new LaserTool(canvasEngine, shapeManager, styleManager));

    // Default to Select tool
    this.setTool('select');

    this.subscribeEvents();
    this.setupKeyboardShortcuts();
  }

  setTool(type) {
    if (!this.tools.has(type)) return;

    if (this.isNudging) {
      this.finishNudge();
    }

    if (this.activeTool) {
      this.activeTool.deactivate();
    }

    this.activeToolType = type;
    this.activeTool = this.tools.get(type);
    this.activeTool.activate();

    eventBus.emit('tool-changed', type);
  }

  subscribeEvents() {
    // Relay canvas stage pointer events directly to active tool
    eventBus.on('pointer-down', (data) => {
      if (this.activeTool) this.activeTool.onPointerDown(data);
    });

    eventBus.on('pointer-move', (data) => {
      if (this.activeTool) this.activeTool.onPointerMove(data);
    });

    eventBus.on('pointer-up', (data) => {
      if (this.activeTool) this.activeTool.onPointerUp(data);
    });

    // Auto switch to select tool when text/shape creation completes
    eventBus.on('tool-action-completed', () => {
      this.setTool('select');
    });
  }

  setupKeyboardShortcuts() {
    window.addEventListener('keydown', (e) => {
      // Ignore key events if typing in text input
      if (document.activeElement && (
        document.activeElement.tagName === 'INPUT' || 
        document.activeElement.tagName === 'TEXTAREA' ||
        document.activeElement.isContentEditable
      )) {
        return;
      }

      // Keyboard arrow key nudging
      if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(e.key.toLowerCase())) {
        const selected = shapeManager.getSelectedShapes();
        if (selected.length > 0) {
          e.preventDefault();
          const step = e.shiftKey ? 10 : 1;
          let dx = 0, dy = 0;
          
          switch (e.key.toLowerCase()) {
            case 'arrowup':
              dy = -step;
              break;
            case 'arrowdown':
              dy = step;
              break;
            case 'arrowleft':
              dx = -step;
              break;
            case 'arrowright':
              dx = step;
              break;
          }

          // Start nudging recording
          if (!this.isNudging) {
            this.isNudging = true;
            this.nudgeStartPositions = selected.map(shape => ({
              id: shape.id,
              x: shape.konvaNode.x(),
              y: shape.konvaNode.y()
            }));
          }

          // Perform movement
          selected.forEach(shape => {
            const node = shape.konvaNode;
            node.x(node.x() + dx);
            node.y(node.y() + dy);
          });

          // Re-align transformer
          const selectTool = this.tools.get('select');
          if (selectTool && selectTool.active && selectTool.transformer) {
            selectTool.transformer.forceUpdate();
          }

          this.canvasEngine.batchDrawAll();

          // Debounce history save
          if (this.nudgeHistoryTimeout) {
            clearTimeout(this.nudgeHistoryTimeout);
          }
          this.nudgeHistoryTimeout = setTimeout(() => {
            this.finishNudge();
          }, 500);
        }
      }

      // Check tool swaps
      switch (e.key.toLowerCase()) {
        case 'v':
          this.setTool('select');
          break;
        case 'r':
          this.setTool('rectangle');
          break;
        case 'c':
          this.setTool('circle');
          break;
        case 'd':
          this.setTool('diamond');
          break;
        case 'l':
          this.setTool('line');
          break;
        case 'a':
          this.setTool('arrow');
          break;
        case 'p':
          this.setTool('pen');
          break;
        case 't':
          this.setTool('text');
          break;
        case 'k':
          this.setTool('laser');
          break;
        
        // Delete selected shape keys
        case 'delete':
        case 'backspace':
          this.deleteSelectedShapes();
          break;
      }

      // Multi-key commands: Ctrl+Z, Ctrl+Shift+Z, Ctrl+C, Ctrl+V, Ctrl+D
      if (e.ctrlKey || e.metaKey) {
        if (e.key.toLowerCase() === 'z') {
          if (e.shiftKey) {
            historyManager.redo();
          } else {
            historyManager.undo();
          }
          e.preventDefault();
        } else if (e.key.toLowerCase() === 'c') {
          this.copySelected();
          e.preventDefault();
        } else if (e.key.toLowerCase() === 'v') {
          this.pasteCopied();
          e.preventDefault();
        } else if (e.key.toLowerCase() === 'd') {
          this.duplicateSelected();
          e.preventDefault();
        }
      }
    });
  }

  deleteSelectedShapes() {
    const selected = shapeManager.getSelectedShapes();
    if (selected.length === 0) return;

    const list = selected.map(s => ({
      id: s.id,
      data: s.serialize()
    }));

    list.forEach(item => {
      const shape = shapeManager.getShape(item.id);
      shapeManager.removeShape(item.id);
      if (shape) shape.destroy();
    });

    this.canvasEngine.shapeLayer.batchDraw();

    // Register deletion in history
    historyManager.registerChange({
      type: 'delete-multiple',
      list,
      undo: () => {
        list.forEach(item => {
          const s = shapeManager.recreateShape(item.data);
          this.canvasEngine.shapeLayer.add(s.konvaNode);
        });
        this.canvasEngine.shapeLayer.batchDraw();
      },
      redo: () => {
        list.forEach(item => {
          const s = shapeManager.getShape(item.id);
          shapeManager.removeShape(item.id);
          if (s) s.destroy();
        });
        this.canvasEngine.shapeLayer.batchDraw();
      }
    });
  }

  copySelected() {
    const selected = shapeManager.getSelectedShapes();
    if (selected.length === 0) return;
    shapeManager.clipboard = selected.map(s => s.serialize());
  }

  pasteCopied() {
    if (!shapeManager.clipboard || shapeManager.clipboard.length === 0) return;

    const pastedShapesData = [];
    const createdShapes = [];

    shapeManager.clipboard.forEach(json => {
      const copy = JSON.parse(JSON.stringify(json));
      copy.id = generateId(); // New ID for pasted shape
      
      // Shift slightly
      if (copy.x !== undefined) copy.x += 20;
      if (copy.y !== undefined) copy.y += 20;
      
      const shape = shapeManager.recreateShape(copy);
      if (shape) {
        this.canvasEngine.shapeLayer.add(shape.konvaNode);
        createdShapes.push(shape);
        pastedShapesData.push(copy);
      }
    });

    if (createdShapes.length > 0) {
      this.canvasEngine.shapeLayer.batchDraw();
      
      // Select the pasted shapes
      const newIds = createdShapes.map(s => s.id);
      shapeManager.select(newIds);

      // Register paste in history
      historyManager.registerChange({
        type: 'paste',
        shapes: pastedShapesData,
        undo: () => {
          newIds.forEach(id => {
            const s = shapeManager.getShape(id);
            shapeManager.removeShape(id);
            if (s) s.destroy();
          });
          this.canvasEngine.shapeLayer.batchDraw();
        },
        redo: () => {
          pastedShapesData.forEach(data => {
            const s = shapeManager.recreateShape(data);
            this.canvasEngine.shapeLayer.add(s.konvaNode);
          });
          this.canvasEngine.shapeLayer.batchDraw();
          shapeManager.select(newIds);
        }
      });
    }
  }

  duplicateSelected() {
    const selected = shapeManager.getSelectedShapes();
    if (selected.length === 0) return;

    const duplicatedData = [];
    const createdShapes = [];

    selected.forEach(shape => {
      const json = shape.serialize();
      const copy = JSON.parse(JSON.stringify(json));
      copy.id = generateId();
      
      // Shift slightly
      if (copy.x !== undefined) copy.x += 20;
      if (copy.y !== undefined) copy.y += 20;
      
      const newShape = shapeManager.recreateShape(copy);
      if (newShape) {
        this.canvasEngine.shapeLayer.add(newShape.konvaNode);
        createdShapes.push(newShape);
        duplicatedData.push(copy);
      }
    });

    if (createdShapes.length > 0) {
      this.canvasEngine.shapeLayer.batchDraw();
      
      const newIds = createdShapes.map(s => s.id);
      shapeManager.select(newIds);

      // Register duplication in history
      historyManager.registerChange({
        type: 'duplicate',
        shapes: duplicatedData,
        undo: () => {
          newIds.forEach(id => {
            const s = shapeManager.getShape(id);
            shapeManager.removeShape(id);
            if (s) s.destroy();
          });
          this.canvasEngine.shapeLayer.batchDraw();
        },
        redo: () => {
          duplicatedData.forEach(data => {
            const s = shapeManager.recreateShape(data);
            this.canvasEngine.shapeLayer.add(s.konvaNode);
          });
          this.canvasEngine.shapeLayer.batchDraw();
          shapeManager.select(newIds);
        }
      });
    }
  }

  finishNudge() {
    if (!this.isNudging) return;
    this.isNudging = false;
    this.nudgeHistoryTimeout = null;

    const startPositions = this.nudgeStartPositions;
    this.nudgeStartPositions = null;

    const selected = shapeManager.getSelectedShapes();
    if (selected.length === 0 || !startPositions) return;

    // Capture final positions of shapes
    const finalPositions = selected.map(shape => ({
      id: shape.id,
      x: shape.konvaNode.x(),
      y: shape.konvaNode.y()
    }));

    // Register movement in history!
    historyManager.registerChange({
      type: 'nudge-shapes',
      undo: () => {
        startPositions.forEach(start => {
          const shape = shapeManager.getShape(start.id);
          if (shape && shape.konvaNode) {
            shape.konvaNode.x(start.x);
            shape.konvaNode.y(start.y);
          }
        });
        const selectTool = this.tools.get('select');
        if (selectTool && selectTool.active && selectTool.transformer) {
          selectTool.transformer.forceUpdate();
        }
        this.canvasEngine.batchDrawAll();
      },
      redo: () => {
        finalPositions.forEach(final => {
          const shape = shapeManager.getShape(final.id);
          if (shape && shape.konvaNode) {
            shape.konvaNode.x(final.x);
            shape.konvaNode.y(final.y);
          }
        });
        const selectTool = this.tools.get('select');
        if (selectTool && selectTool.active && selectTool.transformer) {
          selectTool.transformer.forceUpdate();
        }
        this.canvasEngine.batchDrawAll();
      }
    });
  }
}

export const toolManager = new ToolManager();
