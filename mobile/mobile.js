/**
 * InkFlow Mobile — main.js
 *
 * Bootstraps the full mobile UI by:
 *  1. Reusing all core logic from ../src/ (CanvasEngine, ToolManager, etc.)
 *  2. Adding mobile-specific UI controllers: toolbar, properties sheet, touch gestures
 */

// ── Shared Core Imports ───────────────────────────────────────────────────────
import { CanvasEngine }       from '../src/core/CanvasEngine.js';
import { eventBus }           from '../src/core/EventBus.js';
import { toolManager }        from '../src/managers/ToolManager.js';
import { styleManager }       from '../src/managers/StyleManager.js';
import { persistenceManager } from '../src/managers/PersistenceManager.js';
import { themeManager }       from '../src/managers/ThemeManager.js';
import { shapeManager }       from '../src/managers/ShapeManager.js';
import { historyManager }     from '../src/managers/HistoryManager.js';

// ─────────────────────────────────────────────────────────────────────────────
// Color palettes (same as desktop)
// ─────────────────────────────────────────────────────────────────────────────
const STROKE_COLORS = [
  '#1e293b', '#ef4444', '#f97316', '#eab308',
  '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899',
  '#ffffff',
];

const FILL_COLORS = [
  'transparent',
  '#fee2e2', '#fef3c7', '#dcfce7',
  '#dbeafe', '#ede9fe', '#fce7f3',
  '#f1f5f9', '#1e293b',
];

// ─────────────────────────────────────────────────────────────────────────────
// Utility — Show Toast
// ─────────────────────────────────────────────────────────────────────────────
let _toastTimer = null;
function showToast(message, duration = 2000) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('toast-show');
  if (_toastTimer) clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => {
    toast.classList.remove('toast-show');
  }, duration);
}

// ─────────────────────────────────────────────────────────────────────────────
// CLASS: MobileToolbar
// Manages the bottom scrollable tool selector
// ─────────────────────────────────────────────────────────────────────────────
class MobileToolbar {
  constructor() {
    this.toolButtons = document.querySelectorAll('.tool-btn[data-tool]');
    this._bindEvents();
    this._syncWithEventBus();
  }

  _bindEvents() {
    this.toolButtons.forEach(btn => {
      btn.addEventListener('pointerdown', (e) => {
        // Prevent the canvas from stealing this touch
        e.stopPropagation();
      });
      btn.addEventListener('click', () => {
        const tool = btn.dataset.tool;
        if (tool) toolManager.setTool(tool);
      });
    });
  }

  _syncWithEventBus() {
    // Highlight the correct button whenever the tool changes (including auto-revert to select)
    eventBus.on('tool-changed', (toolType) => {
      this.toolButtons.forEach(btn => {
        btn.classList.toggle('active-tool', btn.dataset.tool === toolType);
      });
    });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// CLASS: MobilePropertiesSheet
// Manages the slide-up bottom sheet for shape styling
// ─────────────────────────────────────────────────────────────────────────────
class MobilePropertiesSheet {
  constructor() {
    this.sheet    = document.getElementById('props-sheet');
    this.backdrop = document.getElementById('props-sheet-backdrop');

    // Panel state
    this._isOpen    = false;
    this._isDragging = false;
    this._dragStartY = 0;
    this._dragCurrentY = 0;

    this._buildColorPalettes();
    this._bindEvents();
    this._listenToCanvas();
  }

  // ── Palette builder ──────────────────────────────────────────────
  _buildColorPalettes() {
    this._buildPalette('mobile-stroke-palette', STROKE_COLORS, 'stroke');
    this._buildPalette('mobile-fill-palette', FILL_COLORS, 'fill');
  }

  _buildPalette(containerId, colors, type) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '';

    colors.forEach(color => {
      const btn = document.createElement('button');
      btn.className = 'color-swatch';
      btn.setAttribute('aria-label', `Set ${type} to ${color === 'transparent' ? 'none' : color}`);
      btn.title = color === 'transparent' ? 'No fill' : color;

      if (color === 'transparent') {
        btn.classList.add('swatch-transparent');
        btn.dataset.color = 'transparent';
      } else {
        btn.style.backgroundColor = color;
        btn.dataset.color = color;
      }

      btn.addEventListener('click', () => {
        this._applyStyle(type, color);
        this._setActiveSwatch(containerId, btn);
      });

      container.appendChild(btn);
    });
  }

  _setActiveSwatch(containerId, activeBtn) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.querySelectorAll('.color-swatch').forEach(b => b.classList.remove('swatch-active'));
    activeBtn.classList.add('swatch-active');
  }

  // ── Apply style through StyleManager ────────────────────────────
  _applyStyle(property, value) {
    styleManager.updateStyles({ [property]: value });
  }

  // ── Open / Close sheet ──────────────────────────────────────────
  open() {
    if (this._isOpen) return;
    this._isOpen = true;

    this.sheet.classList.add('sheet-open');
    this.sheet.setAttribute('aria-hidden', 'false');

    this.backdrop.classList.remove('hidden');
    // Force reflow for transition
    void this.backdrop.offsetWidth;
    this.backdrop.classList.add('visible');

    this._syncFromActiveStyles();
  }

  close() {
    if (!this._isOpen) return;
    this._isOpen = false;

    this.sheet.classList.remove('sheet-open');
    this.sheet.setAttribute('aria-hidden', 'true');

    this.backdrop.classList.remove('visible');
    setTimeout(() => {
      if (!this._isOpen) this.backdrop.classList.add('hidden');
    }, 300);
  }

  toggle() {
    this._isOpen ? this.close() : this.open();
  }

  // ── Sync sheet UI to current active styles ───────────────────────
  _syncFromActiveStyles() {
    const styles = styleManager.getActiveStyles();

    // Stroke palette highlight
    this._highlightPalette('mobile-stroke-palette', styles.stroke);
    // Fill palette highlight
    this._highlightPalette('mobile-fill-palette', styles.fill);
    // Set custom color inputs
    const strokeCustom = document.getElementById('mobile-stroke-custom');
    const fillCustom   = document.getElementById('mobile-fill-custom');
    if (strokeCustom && styles.stroke !== 'transparent') strokeCustom.value = styles.stroke;
    if (fillCustom   && styles.fill   !== 'transparent') fillCustom.value   = styles.fill;

    // Stroke width
    this._highlightButtonGroup('mobile-stroke-width-group', String(styles.strokeWidth));
    // Stroke style
    this._highlightButtonGroup('mobile-stroke-style-group', styles.strokeStyle);
  }

  _highlightPalette(containerId, targetColor) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.querySelectorAll('.color-swatch').forEach(btn => {
      btn.classList.toggle('swatch-active', btn.dataset.color === targetColor);
    });
  }

  _highlightButtonGroup(groupId, targetVal) {
    const group = document.getElementById(groupId);
    if (!group) return;
    group.querySelectorAll('.btn-group-item').forEach(btn => {
      btn.classList.toggle('active-group-item', btn.dataset.val === targetVal);
    });
  }

  // ── Wire up all the interactive controls ────────────────────────
  _bindEvents() {
    // Close button
    document.getElementById('btn-close-sheet')?.addEventListener('click', () => this.close());

    // Backdrop tap
    this.backdrop.addEventListener('click', () => this.close());

    // Custom color inputs
    document.getElementById('mobile-stroke-custom')?.addEventListener('input', (e) => {
      this._applyStyle('stroke', e.target.value);
    });
    document.getElementById('mobile-fill-custom')?.addEventListener('input', (e) => {
      this._applyStyle('fill', e.target.value);
    });

    // Stroke width group
    document.getElementById('mobile-stroke-width-group')?.addEventListener('click', (e) => {
      const btn = e.target.closest('.btn-group-item');
      if (!btn) return;
      this._applyStyle('strokeWidth', Number(btn.dataset.val));
      this._highlightButtonGroup('mobile-stroke-width-group', btn.dataset.val);
    });

    // Stroke style group
    document.getElementById('mobile-stroke-style-group')?.addEventListener('click', (e) => {
      const btn = e.target.closest('.btn-group-item');
      if (!btn) return;
      this._applyStyle('strokeStyle', btn.dataset.val);
      this._highlightButtonGroup('mobile-stroke-style-group', btn.dataset.val);
    });

    // Delete selected shape
    document.getElementById('btn-delete-shape')?.addEventListener('click', () => {
      toolManager.deleteSelectedShapes();
      this.close();
      showToast('Shape deleted');
    });

    // Drag-to-dismiss the sheet
    this._initDragDismiss();
  }

  // ── Drag-to-dismiss gesture ──────────────────────────────────────
  _initDragDismiss() {
    const handleArea = document.getElementById('sheet-handle-area');
    if (!handleArea) return;

    handleArea.addEventListener('pointerdown', (e) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      this._isDragging = true;
      this._dragStartY = e.clientY;
      this._dragCurrentY = 0;
      handleArea.setPointerCapture(e.pointerId);
      this.sheet.style.transition = 'none';
    });

    handleArea.addEventListener('pointermove', (e) => {
      if (!this._isDragging) return;
      const dy = e.clientY - this._dragStartY;
      this._dragCurrentY = dy;
      if (dy > 0) {
        this.sheet.style.transform = `translateY(${dy}px)`;
      }
    });

    handleArea.addEventListener('pointerup', () => {
      if (!this._isDragging) return;
      this._isDragging = false;
      this.sheet.style.transition = '';
      this.sheet.style.transform = '';

      // If dragged more than 80px down, dismiss
      if (this._dragCurrentY > 80) {
        this.close();
      }
    });

    handleArea.addEventListener('pointercancel', () => {
      this._isDragging = false;
      this.sheet.style.transition = '';
      this.sheet.style.transform = '';
    });
  }

  // ── Listen to canvas selection events ───────────────────────────
  _listenToCanvas() {
    // Show sheet when shapes are selected
    eventBus.on('selection-changed', (selectedShapes) => {
      if (selectedShapes && selectedShapes.length > 0) {
        this.open();
      } else {
        this.close();
      }
    });

    // Update sheet UI when styles change (e.g., from a different source)
    eventBus.on('active-style-changed', () => {
      if (this._isOpen) this._syncFromActiveStyles();
    });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// CLASS: TouchGestureHandler
// Implements pinch-to-zoom and two-finger pan on the Konva stage
// ─────────────────────────────────────────────────────────────────────────────
class TouchGestureHandler {
  constructor(canvasEngine) {
    this.engine = canvasEngine;
    this.stage  = canvasEngine.stage;

    this._touches = new Map(); // pointerId → {x, y}
    this._pinchStartDist   = null;
    this._pinchStartScale  = 1;
    this._pinchStartStageX = 0;
    this._pinchStartStageY = 0;
    this._pinchMidpoint    = { x: 0, y: 0 };
    this._isPinching = false;
    this._isPanning2 = false; // two-finger pan (not one-finger, which is for drawing)

    this._bindNativeTouch();
  }

  _bindNativeTouch() {
    const container = this.stage.container();

    container.addEventListener('touchstart', (e) => this._onTouchStart(e), { passive: false });
    container.addEventListener('touchmove',  (e) => this._onTouchMove(e),  { passive: false });
    container.addEventListener('touchend',   (e) => this._onTouchEnd(e),   { passive: false });
    container.addEventListener('touchcancel',(e) => this._onTouchEnd(e),   { passive: false });
  }

  _getTouches(e) {
    return Array.from(e.touches);
  }

  _midpoint(t1, t2) {
    return {
      x: (t1.clientX + t2.clientX) / 2,
      y: (t1.clientY + t2.clientY) / 2,
    };
  }

  _distance(t1, t2) {
    const dx = t1.clientX - t2.clientX;
    const dy = t1.clientY - t2.clientY;
    return Math.hypot(dx, dy);
  }

  _onTouchStart(e) {
    const touches = this._getTouches(e);

    if (touches.length === 2) {
      // Prevent Konva's default touch handling to avoid double-dispatch
      e.preventDefault();
      this._isPinching = true;
      this._isPanning2 = true;

      this._pinchStartDist   = this._distance(touches[0], touches[1]);
      this._pinchStartScale  = this.stage.scaleX();
      this._pinchStartStageX = this.stage.x();
      this._pinchStartStageY = this.stage.y();
      this._pinchMidpoint    = this._midpoint(touches[0], touches[1]);

      // Tell Konva to stop processing this event
      this.engine.isPanning = false;
    }
  }

  _onTouchMove(e) {
    const touches = this._getTouches(e);

    if (touches.length === 2 && this._isPinching) {
      e.preventDefault();

      const currentDist = this._distance(touches[0], touches[1]);
      const currentMid  = this._midpoint(touches[0], touches[1]);

      // ── Zoom ────────────────────────────────────────────────────
      const scaleRatio = currentDist / this._pinchStartDist;
      let newScale = this._pinchStartScale * scaleRatio;
      newScale = Math.max(this.engine.minZoom, Math.min(this.engine.maxZoom, newScale));

      // Zoom around the original pinch midpoint
      const midInCanvas = {
        x: (this._pinchMidpoint.x - this._pinchStartStageX) / this._pinchStartScale,
        y: (this._pinchMidpoint.y - this._pinchStartStageY) / this._pinchStartScale,
      };

      // ── Pan (two-finger drag) ────────────────────────────────────
      const panDx = currentMid.x - this._pinchMidpoint.x;
      const panDy = currentMid.y - this._pinchMidpoint.y;

      // Compose new stage position
      const newX = currentMid.x - midInCanvas.x * newScale + panDx * 0; // pan handled below
      const newY = currentMid.y - midInCanvas.y * newScale + panDy * 0;

      // Actually, simpler and more correct:
      const stageX = this._pinchStartStageX + panDx - (midInCanvas.x * (newScale - this._pinchStartScale));
      const stageY = this._pinchStartStageY + panDy - (midInCanvas.y * (newScale - this._pinchStartScale));

      this.stage.scale({ x: newScale, y: newScale });
      this.stage.position({ x: stageX, y: stageY });
      this.stage.batchDraw();

      this.engine.emitViewportChanged();
    }
  }

  _onTouchEnd(e) {
    if (this._getTouches(e).length < 2) {
      this._isPinching = false;
      this._isPanning2 = false;
      this._pinchStartDist = null;
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// CLASS: MobileZoomBar
// Syncs zoom display and wires zoom +/- buttons
// ─────────────────────────────────────────────────────────────────────────────
class MobileZoomBar {
  constructor(canvasEngine) {
    this.engine = canvasEngine;
    this.display = document.getElementById('zoom-display');

    document.getElementById('btn-zoom-in')?.addEventListener('click', () => {
      this.engine.zoomIn();
    });
    document.getElementById('btn-zoom-out')?.addEventListener('click', () => {
      this.engine.zoomOut();
    });
    // Tap zoom% to reset
    this.display?.addEventListener('click', () => {
      this.engine.zoomReset();
    });

    eventBus.on('viewport-changed', ({ zoom }) => {
      const pct = Math.round(zoom * 100);
      if (this.display) this.display.textContent = `${pct}%`;
    });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// CLASS: MobileDarkMode
// Wires the top-bar dark mode toggle without relying on element IDs
// that ThemeManager targets (ThemeManager looks for btn-theme-toggle, etc.)
// We let ThemeManager handle it since the HTML uses the same IDs!
// ─────────────────────────────────────────────────────────────────────────────
class MobileExportButton {
  constructor() {
    document.getElementById('btn-export-png')?.addEventListener('click', () => {
      persistenceManager.exportPNG();
      showToast('Exported as PNG!');
    });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// App Bootstrap
// ─────────────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  try {
    // 1. Init the Konva canvas engine
    const canvasEngine = new CanvasEngine('canvas-container');

    // 2. Theme — ThemeManager reads btn-theme-toggle, theme-icon-sun, theme-icon-moon
    //    which all exist in mobile/index.html with the same IDs ✓
    themeManager.init(canvasEngine);

    // 3. Tool orchestration
    toolManager.init(canvasEngine);
    canvasEngine.stage.setAttr('toolManager', toolManager);

    // 4. Persistence (autosave + load scene from localStorage)
    persistenceManager.init(canvasEngine);

    // 5. Mobile-specific UI layers
    new MobileToolbar();
    const propsSheet = new MobilePropertiesSheet();
    new TouchGestureHandler(canvasEngine);
    new MobileZoomBar(canvasEngine);
    new MobileExportButton();

    // 6. Prevent default browser gestures on the canvas container
    //    (pinch-zoom, scroll) — our TouchGestureHandler takes over
    const canvasEl = canvasEngine.stage.container();
    canvasEl.style.touchAction = 'none';

    // 7. Brief welcome toast
    setTimeout(() => showToast('InkFlow Mobile ready ✦', 2500), 400);

    console.log('✦ InkFlow Mobile initialized!');
  } catch (err) {
    console.error('InkFlow Mobile boot error:', err);
  }
});
