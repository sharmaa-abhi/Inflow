import { eventBus } from '../core/EventBus';
import { persistenceManager } from '../managers/PersistenceManager';
import { themeManager } from '../managers/ThemeManager';
import { historyManager } from '../managers/HistoryManager';
import { shapeManager } from '../managers/ShapeManager';
import { SvgShape } from '../shapes/SvgShape';

export class MainMenu {
  /**
   * @param {CanvasEngine} canvasEngine - Reference to CanvasEngine
   */
  constructor(canvasEngine) {
    this.canvasEngine = canvasEngine;

    // DOM Elements
    this.btnMenu = document.getElementById('btn-main-menu');
    this.menuDropdown = document.getElementById('main-menu-dropdown');

    // Menu Actions
    this.btnDemoSheet = document.getElementById('menu-btn-demo-sheet');
    this.btnLoadArchitecture = document.getElementById('menu-btn-architecture');
    this.btnLoadPhysics = document.getElementById('menu-btn-physics');
    this.btnImportJson = document.getElementById('menu-btn-import-json');
    this.btnImportSvg = document.getElementById('menu-btn-import-svg');
    this.btnExportJson = document.getElementById('menu-btn-export-json');
    this.btnExportPng = document.getElementById('menu-btn-export-png');
    this.btnExportSvg = document.getElementById('menu-btn-export-svg');
    this.btnExportPdf = document.getElementById('menu-btn-export-pdf');
    this.btnShortcuts = document.getElementById('menu-btn-shortcuts');
    this.btnClearCanvas = document.getElementById('menu-btn-clear');
    this.btnThemeToggle = document.getElementById('menu-btn-theme');
    this.gridSelect = document.getElementById('menu-grid-select');
    this.snapToggle = document.getElementById('menu-snap-toggle');

    // Hidden file inputs for importing
    this.fileInput = document.createElement('input');
    this.fileInput.type = 'file';
    this.fileInput.accept = '.json,.excalidraw';
    this.fileInput.style.display = 'none';
    document.body.appendChild(this.fileInput);

    this.svgFileInput = document.createElement('input');
    this.svgFileInput.type = 'file';
    this.svgFileInput.accept = '.svg';
    this.svgFileInput.style.display = 'none';
    document.body.appendChild(this.svgFileInput);

    this.isOpen = false;
    this.init();
  }

  init() {
    if (this.btnMenu && this.menuDropdown) {
      this.btnMenu.addEventListener('click', (e) => {
        e.stopPropagation();
        if (window.innerWidth <= 768 && window.openMobileMenuSheet) {
          window.openMobileMenuSheet();
        } else {
          this.toggle();
        }
      });

      // Close dropdown when clicking outside
      document.addEventListener('click', (e) => {
        if (this.isOpen && !this.menuDropdown.contains(e.target) && !this.btnMenu.contains(e.target)) {
          this.close();
        }
      });

      // Close on ESC
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && this.isOpen) {
          this.close();
        }
      });
    }

    // Bind Menu Actions
    if (this.btnDemoSheet) {
      this.btnDemoSheet.addEventListener('click', () => {
        persistenceManager.loadDemoSheet();
        this.close();
      });
    }

    if (this.btnLoadArchitecture) {
      this.btnLoadArchitecture.addEventListener('click', () => {
        persistenceManager.loadDefaultArchitecture();
        this.close();
      });
    }

    if (this.btnLoadPhysics) {
      this.btnLoadPhysics.addEventListener('click', () => {
        persistenceManager.loadPhysicsDiagram();
        this.close();
      });
    }

    if (this.btnImportJson) {
      this.btnImportJson.addEventListener('click', () => {
        this.fileInput.click();
        this.close();
      });
    }

    this.fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        persistenceManager.importJSON(file, this.canvasEngine);
        this.fileInput.value = '';
      }
    });

    if (this.btnImportSvg) {
      this.btnImportSvg.addEventListener('click', () => {
        this.svgFileInput.click();
        this.close();
      });
    }

    this.svgFileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const svgText = event.target.result;

          // Center SVG import in the current viewport
          const stage = this.canvasEngine.stage;
          const x = (stage.width() / 2 - stage.x()) / stage.scaleX();
          const y = (stage.height() / 2 - stage.y()) / stage.scaleY();

          const svgShape = new SvgShape({ svgText, x, y });

          // Add to layer and register with shapeManager (BUG-005 fix)
          this.canvasEngine.shapeLayer.add(svgShape.konvaNode);
          shapeManager.addShape(svgShape);

          // Register in history for undo/redo support
          historyManager.registerChange({
            type: 'add',
            undo: () => {
              svgShape.konvaNode?.remove();
              shapeManager.removeShape(svgShape.id);
              this.canvasEngine.shapeLayer.batchDraw();
            },
            redo: () => {
              this.canvasEngine.shapeLayer.add(svgShape.konvaNode);
              shapeManager.addShape(svgShape);
              this.canvasEngine.shapeLayer.batchDraw();
            },
          });

          this.canvasEngine.shapeLayer.batchDraw();
        };
        reader.readAsText(file);
        this.svgFileInput.value = '';
      }
    });

    if (this.btnExportJson) {
      this.btnExportJson.addEventListener('click', () => {
        persistenceManager.exportJSON(this.canvasEngine);
        this.close();
      });
    }

    if (this.btnExportPng) {
      this.btnExportPng.addEventListener('click', () => {
        persistenceManager.exportPNG(this.canvasEngine);
        this.close();
      });
    }

    if (this.btnExportSvg) {
      this.btnExportSvg.addEventListener('click', () => {
        persistenceManager.exportSVG(this.canvasEngine);
        this.close();
      });
    }

    if (this.btnExportPdf) {
      this.btnExportPdf.addEventListener('click', () => {
        persistenceManager.exportPDF(this.canvasEngine);
        this.close();
      });
    }

    if (this.btnShortcuts) {
      this.btnShortcuts.addEventListener('click', () => {
        eventBus.emit('open-shortcuts-modal');
        this.close();
      });
    }

    if (this.btnClearCanvas) {
      this.btnClearCanvas.addEventListener('click', () => {
        this.handleClearCanvas();
        this.close();
      });
    }

    if (this.btnThemeToggle) {
      this.btnThemeToggle.addEventListener('click', () => {
        themeManager.toggle();
        this.syncThemeLabel();
      });
      this.syncThemeLabel();
      eventBus.on('theme-changed', () => this.syncThemeLabel());
    }

    if (this.gridSelect) {
      this.gridSelect.addEventListener('change', (e) => {
        this.canvasEngine.setGridType(e.target.value);
        eventBus.emit('grid-changed', e.target.value);
      });
      eventBus.on('grid-changed', (type) => {
        if (this.gridSelect && this.gridSelect.value !== type) {
          this.gridSelect.value = type;
        }
      });
    }

    if (this.snapToggle) {
      this.snapToggle.addEventListener('change', (e) => {
        eventBus.emit('snap-toggle', e.target.checked);
      });
    }
  }

  toggle() {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }

  open() {
    if (!this.menuDropdown) return;
    this.isOpen = true;
    this.menuDropdown.classList.remove('hidden', 'menu-closed');
    this.menuDropdown.classList.add('menu-open');
    if (this.btnMenu) this.btnMenu.classList.add('active');
  }

  close() {
    if (!this.menuDropdown) return;
    this.isOpen = false;
    this.menuDropdown.classList.remove('menu-open');
    this.menuDropdown.classList.add('menu-closed');
    setTimeout(() => {
      if (!this.isOpen) {
        this.menuDropdown.classList.add('hidden');
      }
    }, 180);
    if (this.btnMenu) this.btnMenu.classList.remove('active');
  }

  syncThemeLabel() {
    if (!this.btnThemeToggle) return;
    const isDark = document.body.classList.contains('dark');
    const label = this.btnThemeToggle.querySelector('.theme-mode-text');
    if (label) {
      label.textContent = isDark ? 'Light Mode' : 'Dark Mode';
    }
  }

  handleClearCanvas() {
    const shapes = shapeManager.getAllShapes();
    if (shapes.length === 0) return;

    if (!confirm('Are you sure you want to clear the canvas?')) return;

    shapeManager.deselectAll();
    const serialized = shapes.map((s) => s.serialize());

    shapes.forEach((s) => {
      if (typeof s.destroy === 'function') s.destroy();
    });
    shapeManager.clear();
    this.canvasEngine.shapeLayer.destroyChildren();
    this.canvasEngine.batchDrawAll();

    historyManager.registerChange({
      type: 'clear-canvas',
      undo: () => {
        shapeManager.deselectAll();
        const old = shapeManager.getAllShapes();
        old.forEach((s) => {
          if (typeof s.destroy === 'function') s.destroy();
        });
        shapeManager.clear();
        this.canvasEngine.shapeLayer.destroyChildren();

        serialized.forEach((json) => {
          const restored = shapeManager.recreateShape(json);
          if (restored) {
            this.canvasEngine.shapeLayer.add(restored.konvaNode);
          }
        });
        this.canvasEngine.batchDrawAll();
      },
      redo: () => {
        shapeManager.deselectAll();
        const currentShapes = shapeManager.getAllShapes();
        currentShapes.forEach((s) => {
          if (typeof s.destroy === 'function') s.destroy();
        });
        shapeManager.clear();
        this.canvasEngine.shapeLayer.destroyChildren();
        this.canvasEngine.batchDrawAll();
      },
    });
  }
}
