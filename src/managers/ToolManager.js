import { eventBus } from '../core/EventBus';
import { SelectTool } from '../tools/SelectTool';
import { ShapeTool } from '../tools/ShapeTool';
import { PenTool } from '../tools/PenTool';
import { TextTool } from '../tools/TextTool';
import { LaserTool } from '../tools/LaserTool';
import { ImageTool } from '../tools/ImageTool';
import { StickyTool } from '../tools/StickyTool';
import { HandTool } from '../tools/HandTool';
import { EraserTool } from '../tools/EraserTool';
import { shapeManager } from './ShapeManager';
import { styleManager } from './StyleManager';
import { historyManager } from './HistoryManager';
import { persistenceManager } from './PersistenceManager';
import { generateId } from '../utils/helpers';
import { getNextFontSize, getPrevFontSize } from '../utils/fontUtils';

class ToolManager {
  constructor() {
    this.canvasEngine = null;
    this.tools = new Map();
    this.activeTool = null;
    this.activeToolType = 'select';

    // Spacebar temporary hand pan state
    this.isSpacePanActive = false;
    this.previousToolBeforeSpace = null;

    // Tool Lock state (Excalidraw Q toggle)
    this.toolLockEnabled = localStorage.getItem('inkflow_tool_lock') === 'true';

    // Zen Mode state (Alt+Z)
    this.isZenMode = false;

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
    this.tools.set('hand', new HandTool(canvasEngine, shapeManager));
    this.tools.set('rectangle', new ShapeTool(canvasEngine, 'rectangle'));
    this.tools.set('circle', new ShapeTool(canvasEngine, 'circle'));
    this.tools.set('diamond', new ShapeTool(canvasEngine, 'diamond'));
    this.tools.set('line', new ShapeTool(canvasEngine, 'line'));
    this.tools.set('arrow', new ShapeTool(canvasEngine, 'arrow'));
    this.tools.set('pen', new PenTool(canvasEngine, shapeManager, styleManager));
    this.tools.set('text', new TextTool(canvasEngine, shapeManager, styleManager));
    this.tools.set('eraser', new EraserTool(canvasEngine, shapeManager));
    this.tools.set('laser', new LaserTool(canvasEngine, shapeManager, styleManager));
    this.tools.set('image', new ImageTool(canvasEngine));
    this.tools.set('sticky', new StickyTool(canvasEngine));
    this.tools.set('pill', new ShapeTool(canvasEngine, 'pill'));
    this.tools.set('parallelogram', new ShapeTool(canvasEngine, 'parallelogram'));
    this.tools.set('trapezoid', new ShapeTool(canvasEngine, 'trapezoid'));
    this.tools.set('cylinder', new ShapeTool(canvasEngine, 'cylinder'));
    this.tools.set('cloud', new ShapeTool(canvasEngine, 'cloud'));
    this.tools.set('star', new ShapeTool(canvasEngine, 'star'));
    this.tools.set('speechBubble', new ShapeTool(canvasEngine, 'speechBubble'));

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

  toggleToolLock(forceVal = null) {
    this.toolLockEnabled = forceVal !== null ? forceVal : !this.toolLockEnabled;
    localStorage.setItem('inkflow_tool_lock', this.toolLockEnabled ? 'true' : 'false');
    eventBus.emit('tool-lock-changed', this.toolLockEnabled);
  }

  toggleZenMode(forceVal = null) {
    this.isZenMode = forceVal !== null ? forceVal : !this.isZenMode;
    if (this.isZenMode) {
      document.body.classList.add('zen-mode');
    } else {
      document.body.classList.remove('zen-mode');
    }
    eventBus.emit('zen-mode-changed', this.isZenMode);
  }

  isEditingText() {
    return document.activeElement && (
      document.activeElement.tagName === 'INPUT' ||
      document.activeElement.tagName === 'TEXTAREA' ||
      document.activeElement.isContentEditable
    );
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

    // Auto switch to select tool when text/shape creation completes (unless tool lock is enabled)
    eventBus.on('tool-action-completed', () => {
      if (!this.toolLockEnabled) {
        this.setTool('select');
      }
    });

    eventBus.on('toggle-tool-lock', (val) => this.toggleToolLock(val));
    eventBus.on('toggle-zen-mode', (val) => this.toggleZenMode(val));
    eventBus.on('toggle-view-mode', () => this.canvasEngine?.toggleViewMode());
  }

  setupKeyboardShortcuts() {
    // Spacebar hold -> Temporary Hand Tool
    window.addEventListener('keydown', (e) => {
      if (e.code === 'Space' && !this.isEditingText()) {
        if (!this.isSpacePanActive && this.activeToolType !== 'hand') {
          this.isSpacePanActive = true;
          this.previousToolBeforeSpace = this.activeToolType;
          this.setTool('hand');
        }
      }
    });

    window.addEventListener('keyup', (e) => {
      if (e.code === 'Space' && this.isSpacePanActive) {
        this.isSpacePanActive = false;
        if (this.previousToolBeforeSpace) {
          this.setTool(this.previousToolBeforeSpace);
          this.previousToolBeforeSpace = null;
        }
      }
    });

    window.addEventListener('keydown', (e) => {
      // Ignore key events if typing in text input
      if (this.isEditingText()) {
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

      // ─── ALT SHORTCUTS ───────────────────────────────────────────────
      if (e.altKey && !e.ctrlKey && !e.metaKey) {
        const key = e.key.toLowerCase();
        if (key === 'z') {
          e.preventDefault();
          this.toggleZenMode();
        } else if (key === 'r') {
          e.preventDefault();
          this.canvasEngine?.toggleViewMode();
        } else if (key === 's') {
          e.preventDefault();
          eventBus.emit('toggle-snap-objects');
        } else if (key === '/' || key === '?') {
          e.preventDefault();
          eventBus.emit('toggle-properties-panel');
        }
      }

      // ─── NUMBER KEYS & ALPHANUMERIC SHORTCUTS (No Ctrl/Cmd/Alt) ───────
      if (!e.ctrlKey && !e.metaKey && !e.altKey) {
        const key = e.key.toLowerCase();
        if (e.shiftKey) {
          // Shift + Number Key Combinations
          switch (e.key) {
            case '!':
              this.canvasEngine?.zoomToFit();
              break;
            case '@':
              this.canvasEngine?.zoomToSelection();
              break;
            case '#':
            case '3':
              this.setTool('pill');
              break;
            case '$':
            case '4':
              this.setTool('circle');
              break;
            case '%':
            case '5':
              this.setTool('star');
              break;
            case '^':
            case '6':
              this.setTool('line');
              break;
            case '&':
            case '7':
              this.setTool('arrow');
              break;
            case '*':
            case '8':
              this.setTool('pen');
              break;
            case '(':
            case '9':
              this.setTool('sticky');
              break;
            case ')':
              shapeManager.deselectAll();
              break;
          }
        } else {
          // Pure Number Keys 1–0 & Essential Keys & Excalidraw Tool Keys
          switch (key) {
            case '1':
            case 'v':
              this.setTool('select');
              break;
            case '2':
            case 'h':
              this.setTool('hand');
              break;
            case '3':
            case 'r':
              this.setTool('rectangle');
              break;
            case '4':
            case 'o':
              this.setTool('circle');
              break;
            case '5':
            case 'd':
              this.setTool('diamond');
              break;
            case '6':
            case 'l':
              this.setTool('line');
              break;
            case '7':
            case 'a':
              this.setTool('arrow');
              break;
            case '8':
            case 'p':
              this.setTool('pen');
              break;
            case '9':
            case 't':
              this.setTool('text');
              break;
            case '0':
            case 'e':
              this.setTool('eraser');
              break;
            case 'k':
              this.setTool('laser');
              break;
            case 'q':
              this.toggleToolLock();
              break;
            case '+':
            case '=':
              if (this.canvasEngine) this.canvasEngine.zoomIn();
              break;
            case '-':
            case '_':
              if (this.canvasEngine) this.canvasEngine.zoomOut();
              break;
            case '?':
              eventBus.emit('open-shortcuts-modal');
              break;
            case 'escape':
              if (this.isZenMode) {
                this.toggleZenMode(false);
              } else if (this.activeToolType !== 'select') {
                this.setTool('select');
              } else {
                shapeManager.deselectAll();
              }
              break;
            case 'delete':
            case 'backspace':
              this.deleteSelectedShapes();
              break;
          }
        }
      }

      // Reorder shapes shortcuts: [ and ]
      if (e.key === '[') {
        e.preventDefault();
        if (e.ctrlKey || e.metaKey) {
          this.reorderSelected('backward');
        } else {
          this.reorderSelected('back');
        }
      } else if (e.key === ']') {
        e.preventDefault();
        if (e.ctrlKey || e.metaKey) {
          this.reorderSelected('forward');
        } else {
          this.reorderSelected('front');
        }
      }

      // ─── CTRL / CMD SHORTCUTS ───────────────────────────────────────
      if (e.ctrlKey || e.metaKey) {
        const key = e.key.toLowerCase();
        if (key === 'z') {
          if (e.shiftKey) {
            historyManager.redo();
          } else {
            historyManager.undo();
          }
          e.preventDefault();
        } else if (key === 'y') {
          historyManager.redo();
          e.preventDefault();
        } else if (key === 'c') {
          this.copySelected();
          e.preventDefault();
        } else if (key === 'x') {
          shapeManager.cutSelected();
          e.preventDefault();
        } else if (key === 'v') {
          this.pasteCopied();
          e.preventDefault();
        } else if (key === 'd') {
          this.duplicateSelected();
          e.preventDefault();
        } else if (key === 'g') {
          if (e.shiftKey) {
            shapeManager.ungroupSelected();
          } else {
            shapeManager.groupSelected();
          }
          e.preventDefault();
        } else if (key === 'a') {
          shapeManager.selectAll();
          e.preventDefault();
        } else if (key === 's') {
          persistenceManager.exportJSON();
          e.preventDefault();
        } else if (key === 'o') {
          document.getElementById('menu-btn-import-json')?.click();
          e.preventDefault();
        } else if (key === 'e') {
          persistenceManager.exportPNG();
          e.preventDefault();
        } else if (key === 'f') {
          eventBus.emit('open-search');
          e.preventDefault();
        } else if (key === '/' || key === 'k') {
          eventBus.emit('open-command-palette');
          e.preventDefault();
        } else if (key === "'") {
          this.canvasEngine?.toggleGrid();
          e.preventDefault();
        } else if (key === 'delete' || key === 'backspace') {
          document.getElementById('menu-btn-clear')?.click();
          e.preventDefault();
        } else if (key === '0') {
          if (this.canvasEngine) this.canvasEngine.zoomReset();
          e.preventDefault();
        }

        // Ctrl+Shift+> / Ctrl+Shift+< → Increase / Decrease font size
        if (e.shiftKey && (e.key === '>' || e.key === '.')) {
          e.preventDefault();
          this.changeFontSizeSelected(1);
        } else if (e.shiftKey && (e.key === '<' || e.key === ',')) {
          e.preventDefault();
          this.changeFontSizeSelected(-1);
        }
      }
    });
  }

  /**
   * Changes font size of selected text shapes by stepping through FONT_SIZE_PRESETS.
   * @param {number} direction — 1 for increase, -1 for decrease
   */
  changeFontSizeSelected(direction) {
    const selected = shapeManager.getSelectedShapes().filter(s => s.type === 'text');
    if (selected.length === 0) return;

    selected.forEach(shape => {
      const currentSize = shape.fontSize || 20;
      const newSize = direction > 0 ? getNextFontSize(currentSize) : getPrevFontSize(currentSize);
      if (newSize !== currentSize) {
        shape.updateStyle({ fontSize: newSize });
      }
    });

    if (this.canvasEngine) {
      this.canvasEngine.shapeLayer.batchDraw();
    }
    eventBus.emit('shapes-updated');
    eventBus.emit('selection-changed', shapeManager.getSelectedShapes());
  }

  /**
   * Toggles rough (sketchy) mode on/off.
   * Also updates the toolbar button active state.
   */
  toggleSketchyMode() {
    const isCurrentlyRough = styleManager.getActiveStyles().roughMode;
    const newVal = !isCurrentlyRough;
    styleManager.setRoughMode(newVal);

    // Update toolbar button active visual
    const btn = document.getElementById('tool-sketchy');
    if (btn) {
      if (newVal) {
        btn.classList.add('bg-indigo-100', 'text-indigo-700');
      } else {
        btn.classList.remove('bg-indigo-100', 'text-indigo-700');
      }
    }
  }

  reorderSelected(actionType) {
    const selected = shapeManager.getSelectedShapes();
    if (selected.length === 0) return;

    const ids = selected.map(s => s.id);
    const beforeIds = shapeManager.getAllShapes().map(s => s.id);

    switch (actionType) {
      case 'front':
        shapeManager.bringToFront(ids);
        break;
      case 'back':
        shapeManager.sendToBack(ids);
        break;
      case 'forward':
        shapeManager.bringForward(ids);
        break;
      case 'backward':
        shapeManager.sendBackward(ids);
        break;
    }

    const afterIds = shapeManager.getAllShapes().map(s => s.id);

    // Only register history if order actually changed
    if (JSON.stringify(beforeIds) !== JSON.stringify(afterIds)) {
      this.canvasEngine.shapeLayer.batchDraw();
      
      historyManager.registerChange({
        type: `reorder-${actionType}`,
        beforeIds,
        afterIds,
        undo: () => {
          shapeManager.setShapesOrder(beforeIds);
          this.canvasEngine.shapeLayer.batchDraw();
          eventBus.emit('selection-changed', shapeManager.getSelectedShapes());
        },
        redo: () => {
          shapeManager.setShapesOrder(afterIds);
          this.canvasEngine.shapeLayer.batchDraw();
          eventBus.emit('selection-changed', shapeManager.getSelectedShapes());
        }
      });
    }
  }

  changeSelectedZIndex(newIndex) {
    const selected = shapeManager.getSelectedShapes();
    if (selected.length !== 1) return;

    const shape = selected[0];
    const result = shapeManager.setShapeZIndex(shape.id, newIndex);
    if (!result) return;

    const { beforeIds, afterIds } = result;

    if (JSON.stringify(beforeIds) !== JSON.stringify(afterIds)) {
      this.canvasEngine.shapeLayer.batchDraw();
      
      historyManager.registerChange({
        type: 'set-zindex',
        beforeIds,
        afterIds,
        undo: () => {
          shapeManager.setShapesOrder(beforeIds);
          this.canvasEngine.shapeLayer.batchDraw();
          eventBus.emit('selection-changed', shapeManager.getSelectedShapes());
        },
        redo: () => {
          shapeManager.setShapesOrder(afterIds);
          this.canvasEngine.shapeLayer.batchDraw();
          eventBus.emit('selection-changed', shapeManager.getSelectedShapes());
        }
      });
    }
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

    // Update Shape instances' properties first
    finalPositions.forEach(final => {
      const shape = shapeManager.getShape(final.id);
      if (shape) {
        shape.updateGeometry({ x: final.x, y: final.y });
      }
    });

    // Register movement in history!
    historyManager.registerChange({
      type: 'nudge-shapes',
      undo: () => {
        startPositions.forEach(start => {
          const shape = shapeManager.getShape(start.id);
          if (shape) {
            shape.updateGeometry({ x: start.x, y: start.y });
          }
        });
        const selectTool = this.tools.get('select');
        if (selectTool && selectTool.active && selectTool.transformer) {
          selectTool.transformer.forceUpdate();
        }
        this.canvasEngine.batchDrawAll();
        eventBus.emit('shapes-updated');
      },
      redo: () => {
        finalPositions.forEach(final => {
          const shape = shapeManager.getShape(final.id);
          if (shape) {
            shape.updateGeometry({ x: final.x, y: final.y });
          }
        });
        const selectTool = this.tools.get('select');
        if (selectTool && selectTool.active && selectTool.transformer) {
          selectTool.transformer.forceUpdate();
        }
        this.canvasEngine.batchDrawAll();
        eventBus.emit('shapes-updated');
      }
    });

    eventBus.emit('shapes-updated');
  }
}

export const toolManager = new ToolManager();
