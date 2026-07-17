import { eventBus } from '../core/EventBus';
import { historyManager } from '../managers/HistoryManager';
import { persistenceManager } from '../managers/PersistenceManager';
import { shapeManager } from '../managers/ShapeManager';

export class Sidebar {
  /**
   * @param {CanvasEngine} canvasEngine - CanvasEngine instance
   */
  constructor(canvasEngine) {
    this.canvasEngine = canvasEngine;

    // Cache DOM Elements
    this.btnLoadArchitecture = document.getElementById('btn-load-architecture');
    this.btnImport = document.getElementById('btn-import');
    this.btnExportJson = document.getElementById('btn-export-json');
    this.btnExportPng = document.getElementById('btn-export-png');
    this.btnClear = document.getElementById('btn-clear');
    this.btnUndo = document.getElementById('btn-undo');
    this.btnRedo = document.getElementById('btn-redo');

    // Create a hidden file input for imports
    this.fileInput = document.createElement('input');
    this.fileInput.type = 'file';
    this.fileInput.accept = '.json,.excalidraw';
    this.fileInput.style.display = 'none';
    document.body.appendChild(this.fileInput);

    this.init();
  }

  init() {
    // Load Architecture action
    if (this.btnLoadArchitecture) {
      this.btnLoadArchitecture.addEventListener('click', () => {
        persistenceManager.loadDefaultArchitecture();
      });
    }

    // Import action
    if (this.btnImport) {
      this.btnImport.addEventListener('click', () => {
        this.fileInput.click();
      });
    }

    this.fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        persistenceManager.importJSON(file, this.canvasEngine);
        // Clear input value so selecting the same file again triggers change event
        this.fileInput.value = '';
      }
    });

    // Export Actions
    if (this.btnExportJson) {
      this.btnExportJson.addEventListener('click', () => {
        persistenceManager.exportJSON(this.canvasEngine);
      });
    }

    if (this.btnExportPng) {
      this.btnExportPng.addEventListener('click', () => {
        persistenceManager.exportPNG(this.canvasEngine);
      });
    }

    // Clear Canvas
    if (this.btnClear) {
      this.btnClear.addEventListener('click', () => {
        const shapes = shapeManager.getAllShapes();
        if (shapes.length === 0) return;

        if (!confirm('Are you sure you want to clear the canvas?')) return;

        // Serialize all current shapes for undoing
        const serialized = shapes.map(s => s.serialize());

        // Perform clear
        shapeManager.clear();
        this.canvasEngine.shapeLayer.destroyChildren();
        this.canvasEngine.batchDrawAll();

        // Register action in history
        historyManager.registerChange({
          type: 'clear-canvas',
          undo: () => {
            // Restore all shapes
            serialized.forEach(json => {
              const restored = shapeManager.recreateShape(json);
              if (restored) {
                this.canvasEngine.shapeLayer.add(restored.konvaNode);
              }
            });
            this.canvasEngine.batchDrawAll();
          },
          redo: () => {
            shapeManager.clear();
            this.canvasEngine.shapeLayer.destroyChildren();
            this.canvasEngine.batchDrawAll();
          }
        });
      });
    }

    // History Actions
    if (this.btnUndo) {
      this.btnUndo.addEventListener('click', () => {
        historyManager.undo();
      });
    }

    if (this.btnRedo) {
      this.btnRedo.addEventListener('click', () => {
        historyManager.redo();
      });
    }

    // Subscribe to history queue changes
    eventBus.on('history-changed', ({ canUndo, canRedo }) => {
      this.updateHistoryButtons(canUndo, canRedo);
    });
  }

  updateHistoryButtons(canUndo, canRedo) {
    if (this.btnUndo) {
      this.btnUndo.disabled = !canUndo;
      if (canUndo) {
        this.btnUndo.classList.remove('text-slate-400');
        this.btnUndo.classList.add('text-slate-700', 'hover:bg-slate-100');
      } else {
        this.btnUndo.classList.add('text-slate-400');
        this.btnUndo.classList.remove('text-slate-700', 'hover:bg-slate-100');
      }
    }

    if (this.btnRedo) {
      this.btnRedo.disabled = !canRedo;
      if (canRedo) {
        this.btnRedo.classList.remove('text-slate-400');
        this.btnRedo.classList.add('text-slate-700', 'hover:bg-slate-100');
      } else {
        this.btnRedo.classList.add('text-slate-400');
        this.btnRedo.classList.remove('text-slate-700', 'hover:bg-slate-100');
      }
    }
  }
}
