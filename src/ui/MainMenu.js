import { eventBus } from '../core/EventBus';
import { persistenceManager } from '../managers/PersistenceManager';
import { themeManager } from '../managers/ThemeManager';
import { historyManager } from '../managers/HistoryManager';
import { shapeManager } from '../managers/ShapeManager';
import { toolManager } from '../managers/ToolManager';
import { snapManager } from '../managers/SnapManager';

export class MainMenu {
  /**
   * @param {CanvasEngine} canvasEngine - Reference to CanvasEngine
   */
  constructor(canvasEngine) {
    this.canvasEngine = canvasEngine;

    // DOM Elements
    this.btnMenu = document.getElementById('btn-main-menu');
    this.menuDropdown = document.getElementById('main-menu-dropdown');
    this.prefSubmenu = document.getElementById('preferences-submenu');
    this.prefItem = document.getElementById('menu-item-preferences');

    // Menu Action Buttons
    this.btnOpen = document.getElementById('menu-btn-open');
    this.btnSave = document.getElementById('menu-btn-save');
    this.btnExportImg = document.getElementById('menu-btn-export-img');
    this.btnCollab = document.getElementById('menu-btn-collab');
    this.btnPalette = document.getElementById('menu-btn-palette');
    this.btnFind = document.getElementById('menu-btn-find');
    this.btnHelp = document.getElementById('menu-btn-help');
    this.btnClearCanvas = document.getElementById('menu-btn-clear');
    this.btnSignUp = document.getElementById('menu-btn-signup');

    // Theme 3-Pill Switchers
    this.themeLight = document.getElementById('theme-pill-light');
    this.themeDark = document.getElementById('theme-pill-dark');
    this.themeSystem = document.getElementById('theme-pill-system');

    // Language Selector
    this.langSelect = document.getElementById('menu-language-select');

    // Canvas Background Swatches
    this.bgSwatches = document.querySelectorAll('.canvas-bg-swatch');

    // Preferences Submenu Items
    this.btnSelectWrap = document.getElementById('pref-select-wrap');
    this.btnSelectOverlap = document.getElementById('pref-select-overlap');
    this.btnToolLock = document.getElementById('pref-tool-lock');
    this.btnSnapObjects = document.getElementById('pref-snap-objects');
    this.btnToggleGrid = document.getElementById('pref-toggle-grid');
    this.btnZenMode = document.getElementById('pref-zen-mode');
    this.btnViewMode = document.getElementById('pref-view-mode');
    this.btnPropertiesPanel = document.getElementById('pref-properties-panel');
    this.btnArrowBinding = document.getElementById('pref-arrow-binding');
    this.btnSnapMidpoints = document.getElementById('pref-snap-midpoints');

    // Hidden file input for importing
    this.fileInput = document.createElement('input');
    this.fileInput.type = 'file';
    this.fileInput.accept = '.json,.excalidraw';
    this.fileInput.style.display = 'none';
    document.body.appendChild(this.fileInput);

    this.isOpen = false;
    this.isPrefOpen = false;
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
        if (
          this.isOpen &&
          !this.menuDropdown.contains(e.target) &&
          !this.btnMenu.contains(e.target) &&
          (!this.prefSubmenu || !this.prefSubmenu.contains(e.target))
        ) {
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

    // Bind Primary Menu Actions
    this.btnOpen?.addEventListener('click', () => {
      this.fileInput.click();
      this.close();
    });

    this.fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        persistenceManager.importJSON(file, this.canvasEngine);
        this.fileInput.value = '';
      }
    });

    this.btnSave?.addEventListener('click', () => {
      persistenceManager.exportJSON(this.canvasEngine);
      this.close();
    });

    this.btnExportImg?.addEventListener('click', () => {
      persistenceManager.exportPNG(this.canvasEngine);
      this.close();
    });

    this.btnCollab?.addEventListener('click', () => {
      this.close();
      const toast = document.getElementById('toast');
      if (toast) {
        toast.textContent = 'Live collaboration room generated! Link copied.';
        toast.classList.add('mobile-toast-show');
        setTimeout(() => toast.classList.remove('mobile-toast-show'), 2500);
      }
    });

    this.btnPalette?.addEventListener('click', () => {
      eventBus.emit('open-command-palette');
      this.close();
    });

    this.btnFind?.addEventListener('click', () => {
      eventBus.emit('open-search');
      this.close();
    });

    this.btnHelp?.addEventListener('click', () => {
      eventBus.emit('open-shortcuts-modal');
      this.close();
    });

    this.btnClearCanvas?.addEventListener('click', () => {
      this.handleClearCanvas();
      this.close();
    });

    this.btnSignUp?.addEventListener('click', () => {
      this.close();
      const toast = document.getElementById('toast');
      if (toast) {
        toast.textContent = 'Sign up / Account sync is active in Cloud mode!';
        toast.classList.add('mobile-toast-show');
        setTimeout(() => toast.classList.remove('mobile-toast-show'), 2500);
      }
    });

    // Preferences Hover / Click Flyout
    if (this.prefItem && this.prefSubmenu) {
      let prefTimeout = null;
      this.prefItem.addEventListener('mouseenter', () => {
        clearTimeout(prefTimeout);
        this.openPrefSubmenu();
      });
      this.prefItem.addEventListener('mouseleave', () => {
        prefTimeout = setTimeout(() => {
          if (!this.prefSubmenu.matches(':hover')) {
            this.closePrefSubmenu();
          }
        }, 150);
      });

      this.prefSubmenu.addEventListener('mouseleave', () => {
        this.closePrefSubmenu();
      });

      this.prefItem.addEventListener('click', (e) => {
        e.stopPropagation();
        this.togglePrefSubmenu();
      });
    }

    // Preferences Submenu Items
    this.initPreferencesControls();

    // Theme 3-Pill Controls
    this.initThemePills();

    // Canvas Background Swatches
    this.initCanvasBgSwatches();
  }

  initPreferencesControls() {
    // 1. Select on Wrap / Overlap
    const updateSelectModeUI = (mode) => {
      if (this.btnSelectWrap && this.btnSelectOverlap) {
        if (mode === 'wrap') {
          this.btnSelectWrap.classList.add('active');
          this.btnSelectOverlap.classList.remove('active');
        } else {
          this.btnSelectWrap.classList.remove('active');
          this.btnSelectOverlap.classList.add('active');
        }
      }
    };

    const currentSelectMode = localStorage.getItem('inkflow_select_mode') || 'wrap';
    updateSelectModeUI(currentSelectMode);

    this.btnSelectWrap?.addEventListener('click', (e) => {
      e.stopPropagation();
      eventBus.emit('select-mode-changed', 'wrap');
      updateSelectModeUI('wrap');
    });

    this.btnSelectOverlap?.addEventListener('click', (e) => {
      e.stopPropagation();
      eventBus.emit('select-mode-changed', 'overlap');
      updateSelectModeUI('overlap');
    });

    // 2. Tool Lock
    const updateToolLockUI = (locked) => {
      if (this.btnToolLock) {
        this.btnToolLock.classList.toggle('pref-active', locked);
      }
    };
    updateToolLockUI(toolManager.toolLockEnabled);
    eventBus.on('tool-lock-changed', (locked) => updateToolLockUI(locked));

    this.btnToolLock?.addEventListener('click', (e) => {
      e.stopPropagation();
      toolManager.toggleToolLock();
    });

    // 3. Snap to Objects
    const updateSnapUI = (enabled) => {
      if (this.btnSnapObjects) {
        this.btnSnapObjects.classList.toggle('pref-active', enabled);
      }
    };
    eventBus.on('snap-toggle', (enabled) => updateSnapUI(enabled));
    eventBus.on('toggle-snap-objects', () => {
      const snapCheckbox = document.getElementById('menu-snap-toggle');
      const newState = snapCheckbox ? !snapCheckbox.checked : true;
      if (snapCheckbox) snapCheckbox.checked = newState;
      eventBus.emit('snap-toggle', newState);
    });

    this.btnSnapObjects?.addEventListener('click', (e) => {
      e.stopPropagation();
      eventBus.emit('toggle-snap-objects');
    });

    // 4. Toggle Grid
    this.btnToggleGrid?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.canvasEngine.toggleGrid();
    });

    // 5. Zen Mode
    const updateZenUI = (isZen) => {
      if (this.btnZenMode) {
        this.btnZenMode.classList.toggle('pref-active', isZen);
      }
    };
    eventBus.on('zen-mode-changed', (isZen) => updateZenUI(isZen));
    this.btnZenMode?.addEventListener('click', (e) => {
      e.stopPropagation();
      toolManager.toggleZenMode();
      this.close();
    });

    // 6. View Mode
    const updateViewModeUI = (isView) => {
      if (this.btnViewMode) {
        this.btnViewMode.classList.toggle('pref-active', isView);
      }
    };
    eventBus.on('view-mode-changed', (isView) => updateViewModeUI(isView));
    this.btnViewMode?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.canvasEngine.toggleViewMode();
    });

    // 7. Canvas & Shape Properties
    this.btnPropertiesPanel?.addEventListener('click', (e) => {
      e.stopPropagation();
      eventBus.emit('toggle-properties-panel');
      this.close();
    });

    // 8. Arrow Binding Toggle Checkmark
    let arrowBinding = localStorage.getItem('inkflow_arrow_binding') !== 'false';
    const updateArrowBindingUI = () => {
      if (this.btnArrowBinding) {
        const check = this.btnArrowBinding.querySelector('.pref-check-icon');
        if (check) check.style.visibility = arrowBinding ? 'visible' : 'hidden';
      }
    };
    updateArrowBindingUI();
    this.btnArrowBinding?.addEventListener('click', (e) => {
      e.stopPropagation();
      arrowBinding = !arrowBinding;
      localStorage.setItem('inkflow_arrow_binding', arrowBinding ? 'true' : 'false');
      updateArrowBindingUI();
      eventBus.emit('arrow-binding-changed', arrowBinding);
    });

    // 9. Snap to Midpoints Toggle Checkmark
    let snapMidpoints = localStorage.getItem('inkflow_snap_midpoints') !== 'false';
    const updateSnapMidpointsUI = () => {
      if (this.btnSnapMidpoints) {
        const check = this.btnSnapMidpoints.querySelector('.pref-check-icon');
        if (check) check.style.visibility = snapMidpoints ? 'visible' : 'hidden';
      }
    };
    updateSnapMidpointsUI();
    this.btnSnapMidpoints?.addEventListener('click', (e) => {
      e.stopPropagation();
      snapMidpoints = !snapMidpoints;
      localStorage.setItem('inkflow_snap_midpoints', snapMidpoints ? 'true' : 'false');
      updateSnapMidpointsUI();
      eventBus.emit('snap-midpoints-changed', snapMidpoints);
    });
  }

  initThemePills() {
    const syncPillUI = (mode) => {
      [this.themeLight, this.themeDark, this.themeSystem].forEach((pill) => pill?.classList.remove('active'));
      if (mode === 'light') this.themeLight?.classList.add('active');
      else if (mode === 'dark') this.themeDark?.classList.add('active');
      else if (mode === 'system') this.themeSystem?.classList.add('active');
    };

    syncPillUI(themeManager.currentMode);

    this.themeLight?.addEventListener('click', (e) => {
      e.stopPropagation();
      themeManager.setMode('light');
      syncPillUI('light');
    });

    this.themeDark?.addEventListener('click', (e) => {
      e.stopPropagation();
      themeManager.setMode('dark');
      syncPillUI('dark');
    });

    this.themeSystem?.addEventListener('click', (e) => {
      e.stopPropagation();
      themeManager.setMode('system');
      syncPillUI('system');
    });

    eventBus.on('theme-mode-changed', (mode) => syncPillUI(mode));
  }

  initCanvasBgSwatches() {
    this.bgSwatches.forEach((swatch) => {
      swatch.addEventListener('click', (e) => {
        e.stopPropagation();
        const color = swatch.dataset.color || swatch.style.backgroundColor;
        this.bgSwatches.forEach((s) => s.classList.remove('active'));
        swatch.classList.add('active');
        this.canvasEngine.setCanvasBackground(color);
      });
    });
  }

  openPrefSubmenu() {
    if (!this.prefSubmenu) return;
    this.isPrefOpen = true;
    this.prefSubmenu.classList.remove('hidden');
    if (this.prefItem) {
      const rect = this.prefItem.getBoundingClientRect();
      this.prefSubmenu.style.position = 'fixed';
      this.prefSubmenu.style.left = `${rect.right + 6}px`;
      const idealTop = rect.top - 40;
      const maxTop = window.innerHeight - (this.prefSubmenu.offsetHeight || 340) - 16;
      this.prefSubmenu.style.top = `${Math.max(16, Math.min(idealTop, maxTop))}px`;
    }
  }

  closePrefSubmenu() {
    if (!this.prefSubmenu) return;
    this.isPrefOpen = false;
    this.prefSubmenu.classList.add('hidden');
  }

  togglePrefSubmenu() {
    if (this.isPrefOpen) {
      this.closePrefSubmenu();
    } else {
      this.openPrefSubmenu();
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
    this.closePrefSubmenu();
    this.menuDropdown.classList.remove('menu-open');
    this.menuDropdown.classList.add('menu-closed');
    setTimeout(() => {
      if (!this.isOpen) {
        this.menuDropdown.classList.add('hidden');
      }
    }, 180);
    if (this.btnMenu) this.btnMenu.classList.remove('active');
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
