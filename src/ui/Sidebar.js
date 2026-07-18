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
    this.btnToggleSidebar = document.getElementById('btn-toggle-sidebar');

    // Create a hidden file input for imports
    this.fileInput = document.createElement('input');
    this.fileInput.type = 'file';
    this.fileInput.accept = '.json,.excalidraw';
    this.fileInput.style.display = 'none';
    document.body.appendChild(this.fileInput);

    this.init();
  }

  init() {
    const sidebarPanel = document.getElementById('sidebar-panel');
    const closeSidebarBtn = document.getElementById('btn-close-sidebar');

    // Toggle Sidebar
    if (this.btnToggleSidebar && sidebarPanel) {
      this.btnToggleSidebar.addEventListener('click', () => {
        sidebarPanel.classList.toggle('hidden');
        if (!sidebarPanel.classList.contains('hidden')) {
          this.renderShapesList();
        }
      });
    }

    if (closeSidebarBtn && sidebarPanel) {
      closeSidebarBtn.addEventListener('click', () => {
        sidebarPanel.classList.add('hidden');
      });
    }

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

    // Subscribe to shape modifications to keep list updated
    eventBus.on('shapes-updated', () => {
      if (sidebarPanel && !sidebarPanel.classList.contains('hidden')) {
        this.renderShapesList();
      }
    });

    eventBus.on('selection-changed', () => {
      if (sidebarPanel && !sidebarPanel.classList.contains('hidden')) {
        this.renderShapesList();
      }
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

  renderShapesList() {
    const container = document.getElementById('shapes-list-container');
    if (!container) return;

    container.innerHTML = '';
    const shapes = shapeManager.getAllShapes();

    if (shapes.length === 0) {
      container.innerHTML = `<div class="text-xs text-slate-400 text-center py-4">No shapes on canvas</div>`;
      return;
    }

    const selectedIds = new Set(shapeManager.getSelectedShapeIds());

    // Render list in reverse Z-index order so top-most shapes appear first in list
    [...shapes].reverse().forEach((shape) => {
      const item = document.createElement('div');
      const isSelected = selectedIds.has(shape.id);
      
      item.className = `flex items-center justify-between p-2 rounded-xl border text-xs transition-all duration-200 cursor-pointer ${
        isSelected
          ? 'bg-indigo-50 border-indigo-200 text-indigo-700 shadow-sm shadow-indigo-100/50'
          : 'bg-slate-50/50 border-slate-100 text-slate-600 hover:bg-slate-100/50 dark:border-slate-800/40 dark:text-slate-300'
      }`;

      let label = shape.type.charAt(0).toUpperCase() + shape.type.slice(1);
      if (shape.type === 'text') {
        const truncated = shape.text.length > 15 ? shape.text.slice(0, 15) + '...' : shape.text;
        label = `Text: "${truncated || 'Empty'}"`;
      }

      const labelWrapper = document.createElement('span');
      labelWrapper.className = 'font-medium truncate flex-1 pr-2';
      labelWrapper.textContent = label;

      // Select / Multiselect on list click
      item.addEventListener('click', (e) => {
        if (e.target.closest('.delete-btn')) return;
        
        const isShift = e.shiftKey;
        if (isShift) {
          shapeManager.toggleSelect(shape.id);
        } else {
          shapeManager.select([shape.id]);
        }
      });

      // Quick Delete action
      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'delete-btn p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors';
      deleteBtn.title = 'Delete Shape';
      deleteBtn.innerHTML = `
        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"></path>
        </svg>
      `;
      deleteBtn.addEventListener('click', () => {
        shapeManager.removeShape(shape.id);
        shape.destroy();
        this.canvasEngine.shapeLayer.batchDraw();
      });

      item.appendChild(labelWrapper);
      item.appendChild(deleteBtn);
      container.appendChild(item);
    });
  }
}
