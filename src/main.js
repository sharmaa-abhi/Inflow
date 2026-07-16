import './style.css';
import { CanvasEngine } from './core/CanvasEngine';
import { toolManager } from './managers/ToolManager';
import { persistenceManager } from './managers/PersistenceManager';
import { themeManager } from './managers/ThemeManager';
import { Toolbar } from './ui/Toolbar';
import { PropertiesPanel } from './ui/PropertiesPanel';
import { Sidebar } from './ui/Sidebar';
import { Statusbar } from './ui/Statusbar';
import { ContextMenu } from './ui/ContextMenu';
import { Tooltip } from './ui/Tooltip';
import { threeDPreviewManager } from './managers/ThreeDPreviewManager';
import { initMobileUI } from './mobile-ui';

const BREAKPOINT = 768;

// Bootstrap InkFlow Application
document.addEventListener('DOMContentLoaded', () => {
  try {
    // 1. Initialize Canvas Rendering Engine
    const canvasEngine = new CanvasEngine('canvas-container');

    // Initialize Theme Manager (must be before loading grid state so correct grid contrast draws!)
    themeManager.init(canvasEngine);

    // 2. Initialize Tool Orchestration
    toolManager.init(canvasEngine);

    // Save a reference to toolManager on the stage for cross-tool interactions (like double-click editing)
    canvasEngine.stage.setAttr('toolManager', toolManager);

    // 3. Initialize Document Autosave & File Loaders
    persistenceManager.init(canvasEngine);
    threeDPreviewManager.init(canvasEngine);

    if (window.innerWidth > BREAKPOINT) {
      // ── DESKTOP mode: initialize all desktop UI panels ──────────────────────
      new Toolbar();
      new PropertiesPanel();
      new Sidebar(canvasEngine);
      new Statusbar(canvasEngine);
      new ContextMenu(canvasEngine);
      new Tooltip();
    }

    // 4. Initialize mobile responsive UI — always runs (CSS controls visibility)
    //    On desktop it injects mobile-only DOM for responsive resize support.
    //    On mobile it fully activates touch, sheets, and toolbar.
    initMobileUI(canvasEngine);

    // 5. Wire up the merged HTML's mb- prefixed mobile elements to core actions
    _wireMobileElements(canvasEngine);

    // 5b. Wire up drag and drop support for importing files
    _setupDragAndDrop(canvasEngine);

    // 6. Handle resize across breakpoint — re-initialize correct UI once per crossing
    let _desktopInitialized = window.innerWidth > BREAKPOINT;
    let _resizeTimer = null;
    window.addEventListener('resize', () => {
      // Debounce: wait 150ms after last resize event before acting
      clearTimeout(_resizeTimer);
      _resizeTimer = setTimeout(() => {
        const isDesktop = window.innerWidth > BREAKPOINT;

        if (isDesktop && !_desktopInitialized) {
          // ── Crossed to DESKTOP ─────────────────────────────────────────────
          _desktopInitialized = true;
          new Toolbar();
          new PropertiesPanel();
          new Sidebar(canvasEngine);
          new Statusbar(canvasEngine);
          new ContextMenu(canvasEngine);
          new Tooltip();
          console.log('InkFlow: switched to Desktop UI (>' + BREAKPOINT + 'px)');
        } else if (!isDesktop && _desktopInitialized) {
          // ── Crossed to MOBILE ──────────────────────────────────────────────
          _desktopInitialized = false;
          console.log('InkFlow: switched to Mobile UI (<=' + BREAKPOINT + 'px)');
          // CSS handles hiding desktop panels; mobile-ui.js handles touch activation
        }
      }, 150);
    });

    console.log('InkFlow successfully initialized!');
  } catch (error) {
    console.error('Error bootstrapping InkFlow application:', error);
  }
});

// ── Wire up the merged HTML's mobile-specific (mb-) elements ─────────────────
function _wireMobileElements(canvasEngine) {
  const isMobile = () => window.innerWidth <= BREAKPOINT;

  // ── Tool buttons → proxy to core toolManager ────────────────────────────────
  const toolMap = {
    'mb-tool-select':    'select',
    'mb-tool-rectangle': 'rectangle',
    'mb-tool-circle':    'circle',
    'mb-tool-diamond':   'diamond',
    'mb-tool-line':      'line',
    'mb-tool-arrow':     'arrow',
    'mb-tool-pen':       'pen',
    'mb-tool-text':      'text',
    'mb-tool-laser':     'laser',
  };

  Object.entries(toolMap).forEach(([btnId, toolName]) => {
    const btn = document.getElementById(btnId);
    if (!btn) return;
    btn.addEventListener('click', () => {
      toolManager.setTool(toolName);
      // Update active state on all mb- tool buttons
      document.querySelectorAll('.tool-btn[id^="mb-tool-"]').forEach(b => b.classList.remove('active-tool'));
      btn.classList.add('active-tool');
    });
  });

  // ── Sync active tool state from toolManager events ──────────────────────────
  import('./core/EventBus.js').then(({ eventBus }) => {
    eventBus.on('tool:changed', (toolName) => {
      if (!isMobile()) return;
      document.querySelectorAll('.tool-btn[id^="mb-tool-"]').forEach(b => b.classList.remove('active-tool'));
      const activeBtn = document.getElementById(`mb-tool-${toolName}`);
      if (activeBtn) activeBtn.classList.add('active-tool');
    });
  });

  // ── Zoom buttons ─────────────────────────────────────────────────────────────
  document.getElementById('mb-btn-zoom-in')?.addEventListener('click', () => {
    document.getElementById('btn-zoom-in')?.click();
  });
  document.getElementById('mb-btn-zoom-out')?.addEventListener('click', () => {
    document.getElementById('btn-zoom-out')?.click();
  });

  // ── Sync zoom display ─────────────────────────────────────────────────────────
  const desktopZoom = document.getElementById('zoom-display');
  const mobileZoom  = document.getElementById('mb-zoom-display');
  if (desktopZoom && mobileZoom) {
    const syncZoom = () => { mobileZoom.textContent = desktopZoom.textContent; };
    const observer = new MutationObserver(syncZoom);
    observer.observe(desktopZoom, { childList: true, characterData: true, subtree: true });
  }

  // ── Theme toggle ──────────────────────────────────────────────────────────────
  const mbThemeBtn = document.getElementById('mb-btn-theme-toggle');
  const mbSunIcon  = document.getElementById('mb-theme-icon-sun');
  const mbMoonIcon = document.getElementById('mb-theme-icon-moon');

  mbThemeBtn?.addEventListener('click', () => {
    document.getElementById('btn-theme-toggle')?.click();
    // Sync icon state
    const isDark = document.body.classList.contains('dark');
    mbSunIcon?.classList.toggle('hidden', isDark);
    mbMoonIcon?.classList.toggle('hidden', !isDark);
  });

  // Keep icons in sync when theme changes via desktop button
  import('./managers/ThemeManager.js').then(({ themeManager }) => {
    const origToggle = themeManager.toggle?.bind(themeManager);
    if (origToggle) {
      themeManager.toggle = (...args) => {
        origToggle(...args);
        const isDark = document.body.classList.contains('dark');
        mbSunIcon?.classList.toggle('hidden', isDark);
        mbMoonIcon?.classList.toggle('hidden', !isDark);
      };
    }
  });

  // ── Export PNG ────────────────────────────────────────────────────────────────
  document.getElementById('mb-btn-export-png')?.addEventListener('click', () => {
    document.getElementById('btn-export-png')?.click();
  });

  // ── More button → open more sheet (created by mobile-ui.js) ──────────────────
  document.getElementById('mb-btn-more')?.addEventListener('click', () => {
    document.getElementById('mobile-more-trigger')?.click();
  });

  // ── Properties bottom sheet (props-sheet) ─────────────────────────────────────
  const propsSheet     = document.getElementById('props-sheet');
  const propsBackdrop  = document.getElementById('props-sheet-backdrop');
  const closeSheetBtn  = document.getElementById('mb-btn-close-sheet');
  const deleteShapeBtn = document.getElementById('mb-btn-delete-shape');

  function openPropsSheet() {
    if (!isMobile() || !propsSheet) return;
    propsSheet.classList.add('sheet-open');
    propsSheet.setAttribute('aria-hidden', 'false');
    if (propsBackdrop) {
      propsBackdrop.classList.add('visible');
    }
  }

  function closePropsSheet() {
    if (!propsSheet) return;
    propsSheet.classList.remove('sheet-open');
    propsSheet.setAttribute('aria-hidden', 'true');
    if (propsBackdrop) {
      propsBackdrop.classList.remove('visible');
    }
  }

  closeSheetBtn?.addEventListener('click', closePropsSheet);
  propsBackdrop?.addEventListener('click', closePropsSheet);

  deleteShapeBtn?.addEventListener('click', () => {
    document.getElementById('btn-clear')?.click();
    closePropsSheet();
  });

  // ── Color palettes in bottom sheet ────────────────────────────────────────────
  const STROKE_COLORS = [
    '#1e293b', '#ef4444', '#f97316', '#eab308',
    '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899', '#ffffff',
  ];
  const FILL_COLORS = [
    'transparent', '#fee2e2', '#fef3c7', '#dcfce7',
    '#dbeafe', '#ede9fe', '#fce7f3', '#f1f5f9', '#1e293b',
  ];

  function buildPalette(containerId, colors, onChange) {
    const container = document.getElementById(containerId);
    if (!container) return;
    colors.forEach((color) => {
      const swatch = document.createElement('button');
      swatch.className = 'color-swatch' + (color === 'transparent' ? ' swatch-transparent' : '');
      if (color !== 'transparent') swatch.style.background = color;
      if (color === '#ffffff') swatch.style.border = '1.5px solid #e2e8f0';
      swatch.addEventListener('click', () => {
        container.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('swatch-active'));
        swatch.classList.add('swatch-active');
        onChange(color);
      });
      container.appendChild(swatch);
    });
  }

  import('./managers/StyleManager.js').then(({ styleManager }) => {
    buildPalette('mb-stroke-palette', STROKE_COLORS, (c) => styleManager.setStrokeColor(c));
    buildPalette('mb-fill-palette',   FILL_COLORS,   (c) => styleManager.setFillColor(c));

    document.getElementById('mb-stroke-custom')?.addEventListener('input', (e) => {
      styleManager.setStrokeColor(e.target.value);
    });
    document.getElementById('mb-fill-custom')?.addEventListener('input', (e) => {
      styleManager.setFillColor(e.target.value);
    });

    // ── Stroke width group ──────────────────────────────────────────────────────
    document.getElementById('mb-stroke-width-group')?.querySelectorAll('.btn-group-item').forEach(btn => {
      btn.addEventListener('click', () => {
        document.getElementById('mb-stroke-width-group').querySelectorAll('.btn-group-item').forEach(b => b.classList.remove('active-group-item'));
        btn.classList.add('active-group-item');
        styleManager.setStrokeWidth(Number(btn.dataset.val));
      });
    });

    // ── Stroke style group ──────────────────────────────────────────────────────
    document.getElementById('mb-stroke-style-group')?.querySelectorAll('.btn-group-item').forEach(btn => {
      btn.addEventListener('click', () => {
        document.getElementById('mb-stroke-style-group').querySelectorAll('.btn-group-item').forEach(b => b.classList.remove('active-group-item'));
        btn.classList.add('active-group-item');
        styleManager.setStrokeStyle(btn.dataset.val);
      });
    });
  });

  // ── Show props sheet when a shape is selected ─────────────────────────────────
  import('./core/EventBus.js').then(({ eventBus }) => {
    eventBus.on('shape:selected', () => {
      if (isMobile()) openPropsSheet();
    });
    eventBus.on('shape:deselected', () => {
      if (isMobile()) closePropsSheet();
    });
    eventBus.on('selection:cleared', () => {
      if (isMobile()) closePropsSheet();
    });
  });

  // ── Drag to dismiss props sheet ───────────────────────────────────────────────
  const handleArea = document.getElementById('mb-sheet-handle-area');
  if (handleArea && propsSheet) {
    let startY = 0, currentDY = 0, dragging = false;
    handleArea.addEventListener('pointerdown', (e) => {
      dragging = true; startY = e.clientY; currentDY = 0;
      handleArea.setPointerCapture(e.pointerId);
      propsSheet.style.transition = 'none';
    });
    handleArea.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      const dy = e.clientY - startY;
      currentDY = dy;
      if (dy > 0) propsSheet.style.transform = `translateY(${dy}px)`;
    });
    handleArea.addEventListener('pointerup', () => {
      if (!dragging) return;
      dragging = false;
      propsSheet.style.transition = '';
      propsSheet.style.transform = '';
      if (currentDY > 90) closePropsSheet();
    });
    handleArea.addEventListener('pointercancel', () => {
      dragging = false;
      propsSheet.style.transition = '';
      propsSheet.style.transform = '';
    });
  }
}

// ── Setup drag & drop file loaders ───────────────────────────────────────────
function _setupDragAndDrop(canvasEngine) {
  window.addEventListener('dragover', (e) => {
    e.preventDefault();
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'copy';
    }
  });

  window.addEventListener('drop', (e) => {
    e.preventDefault();
    if (!e.dataTransfer || !e.dataTransfer.files.length) return;
    
    const file = e.dataTransfer.files[0];
    const isJson = file.name.endsWith('.json') || file.name.endsWith('.excalidraw');
    
    if (isJson) {
      persistenceManager.importJSON(file, canvasEngine);
    } else {
      alert('Please drop an InkFlow (.json) or Excalidraw (.excalidraw) file.');
    }
  });
}

