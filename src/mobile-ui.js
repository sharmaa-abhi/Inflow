/**
 * InkFlow Mobile Responsive UI Controller
 * ─────────────────────────────────────────
 * Handles all responsive behavior for the main InkFlow app.
 * On screens <= 768px:
 *  - Moves toolbar to bottom-center scrollable pill
 *  - Collapses menu to a compact top bar
 *  - Turns the properties panel into a slide-up bottom sheet
 *  - Turns the sidebar into a slide-up bottom sheet
 *  - Adds a "More Actions" bottom sheet for file/zoom actions
 *  - Adds pinch-to-zoom touch support
 */

import { shapeManager } from './managers/ShapeManager.js';

const BREAKPOINT = 768;

// ── Helpers ───────────────────────────────────────────────────────────────────
function isMobile() {
  return window.innerWidth <= BREAKPOINT;
}

let _canvasEngineRef = null;

// ── Toast ─────────────────────────────────────────────────────────────────────
let _toastEl = null;
let _toastTimer = null;

function showToast(msg, ms = 1800) {
  if (!_toastEl) return;
  _toastEl.textContent = msg;
  _toastEl.classList.add('mobile-toast-show');
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => _toastEl.classList.remove('mobile-toast-show'), ms);
}

// ═════════════════════════════════════════════════════════════════════════════
// DOM CREATION — inject all mobile-only elements once
// ═════════════════════════════════════════════════════════════════════════════
function createMobileDOM() {
  // Check if already initialized to prevent duplicates
  if (document.getElementById('mobile-backdrop')) {
    _toastEl = document.getElementById('mobile-toast');
    return {
      backdrop: document.getElementById('mobile-backdrop'),
      moreSheet: document.getElementById('mobile-more-sheet')
    };
  }

  // ── Backdrop ────────────────────────────────────────────────────────────────
  const backdrop = el('div', { id: 'mobile-backdrop', className: 'mobile-backdrop' });
  document.body.appendChild(backdrop);

  // ── Toast ───────────────────────────────────────────────────────────────────
  _toastEl = el('div', { id: 'mobile-toast', className: 'mobile-toast' });
  document.body.appendChild(_toastEl);

  // ── Props panel drag handle ─────────────────────────────────────────────────
  const propsPanel = document.getElementById('properties-panel');
  if (propsPanel) {
    const handleRow = el('div', {
      id: 'mobile-props-drag-handle',
      className: 'mobile-sheet-drag-area',
      innerHTML: '<div class="mobile-sheet-handle-pill"></div>',
    });
    propsPanel.insertBefore(handleRow, propsPanel.firstChild);

    // Init drag-to-dismiss on props panel
    initDragDismiss(handleRow, propsPanel, () => {
      // On dismiss → deselect shapes so PropertiesPanel.js hides it natively
      shapeManager.deselectAll();
    });
  }

  // ── Sidebar drag handle ──────────────────────────────────────────────────────
  const sidebarPanel = document.getElementById('sidebar-panel');
  if (sidebarPanel) {
    const sidebarHandle = el('div', {
      className: 'mobile-sheet-drag-area',
      innerHTML: '<div class="mobile-sheet-handle-pill"></div>',
    });
    sidebarPanel.insertBefore(sidebarHandle, sidebarPanel.firstChild);
    initDragDismiss(sidebarHandle, sidebarPanel, () => {
      document.getElementById('btn-close-sidebar')?.click();
    });
  }

  // ── "More Actions / Footer Menu" bottom sheet ───────────────────────────────
  const moreSheet = el('div', {
    id: 'mobile-more-sheet',
    className: 'mobile-more-sheet',
    innerHTML: `
      <div class="mobile-sheet-drag-area"><div class="mobile-sheet-handle-pill"></div></div>
      <div class="mobile-more-sheet-header">
        <div class="flex items-center justify-between w-full">
          <div class="flex items-center gap-2">
            <div class="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-xs shadow-sm">IF</div>
            <div>
              <h3 class="mobile-more-title font-bold text-slate-800 dark:text-slate-100 text-sm leading-tight">InkFlow Menu</h3>
              <p class="text-[10px] text-slate-500 dark:text-slate-400">Canvas & File Details</p>
            </div>
          </div>
          <button id="mobile-menu-close-btn" class="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 flex items-center justify-center transition-colors">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>
      </div>

      <div class="mobile-more-body">
        <!-- Canvas Settings Section -->
        <div class="mobile-menu-section mb-4">
          <div class="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">Canvas Settings</div>
          <div class="grid grid-cols-2 gap-2">
            <div class="flex flex-col gap-1 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
              <label class="text-xs font-semibold text-slate-700 dark:text-slate-300">Grid Type</label>
              <select id="m-menu-grid-select" class="text-xs bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 p-1.5 rounded-lg border border-slate-300 dark:border-slate-700 font-medium outline-none">
                <option value="plain">Plain</option>
                <option value="dot-grid" selected>Dot Grid</option>
                <option value="square-grid">Square Grid</option>
                <option value="watercolor-paper">Watercolor Paper</option>
              </select>
            </div>
            <div class="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
              <div class="flex flex-col">
                <span class="text-xs font-semibold text-slate-700 dark:text-slate-300">Snap to Objects</span>
                <span class="text-[9px] text-slate-400">Alignment guides</span>
              </div>
              <input type="checkbox" id="m-menu-snap-toggle" class="w-4 h-4 accent-indigo-600 rounded cursor-pointer" checked>
            </div>
          </div>
        </div>

        <!-- Diagram Templates Section -->
        <div class="mobile-menu-section mb-4">
          <div class="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">Diagram Templates</div>
          <div class="grid grid-cols-2 gap-2">
            <button class="mobile-menu-card-btn flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 text-left transition-all active:scale-95" id="m-load-architecture">
              <span class="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex-shrink-0">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/></svg>
              </span>
              <div>
                <div class="text-xs font-semibold text-slate-800 dark:text-slate-200">Architecture</div>
                <div class="text-[9px] text-slate-400">Cloud diagram</div>
              </div>
            </button>
            <button class="mobile-menu-card-btn flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 text-left transition-all active:scale-95" id="m-load-physics">
              <span class="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex-shrink-0">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg>
              </span>
              <div>
                <div class="text-xs font-semibold text-slate-800 dark:text-slate-200">Physics</div>
                <div class="text-[9px] text-slate-400">Textbook diagram</div>
              </div>
            </button>
          </div>
        </div>

        <!-- File Actions & Export Section -->
        <div class="mobile-menu-section mb-4">
          <div class="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">File & Export Options</div>
          <div class="mobile-action-grid">
            <button class="mobile-action-btn" id="m-import">
              <span class="mobile-action-icon"><svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v6m0 0l-3-3m3 3l3-3m-12 1a9 9 0 1118 0 9 9 0 01-18 0z"/></svg></span>
              <span>Import JSON</span>
            </button>
            <button class="mobile-action-btn" id="m-import-svg">
              <span class="mobile-action-icon"><svg class="w-4 h-4 text-indigo-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"/></svg></span>
              <span>Import SVG</span>
            </button>
            <button class="mobile-action-btn" id="m-export-json">
              <span class="mobile-action-icon"><svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9V3m0 0L9 6m3-3l3 3m-9 8a9 9 0 0018 0v-5a9 9 0 00-18 0v5z"/></svg></span>
              <span>Save JSON</span>
            </button>
            <button class="mobile-action-btn" id="m-export-png">
              <span class="mobile-action-icon"><svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg></span>
              <span>Export PNG</span>
            </button>
            <button class="mobile-action-btn" id="m-export-svg">
              <span class="mobile-action-icon"><svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg></span>
              <span>Export SVG</span>
            </button>
            <button class="mobile-action-btn" id="m-export-pdf">
              <span class="mobile-action-icon"><svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/></svg></span>
              <span>Export PDF</span>
            </button>
            <button class="mobile-action-btn" id="m-shortcuts">
              <span class="mobile-action-icon"><svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg></span>
              <span>Shortcuts</span>
            </button>
            <button class="mobile-action-btn danger" id="m-clear">
              <span class="mobile-action-icon"><svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg></span>
              <span>Clear All</span>
            </button>
          </div>
        </div>

        <!-- History & Navigation Section -->
        <div class="mobile-menu-section">
          <div class="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">History & Controls</div>
          <div class="grid grid-cols-3 gap-2">
            <button class="mobile-action-btn" id="m-undo">
              <span class="mobile-action-icon"><svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3"/></svg></span>
              <span>Undo</span>
            </button>
            <button class="mobile-action-btn" id="m-redo">
              <span class="mobile-action-icon"><svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/></svg></span>
              <span>Redo</span>
            </button>
            <button class="mobile-action-btn" id="m-zoom-reset">
              <span class="mobile-action-icon"><svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"/></svg></span>
              <span>100% Zoom</span>
            </button>
          </div>
        </div>
      </div>
    `,
  });
  document.body.appendChild(moreSheet);

  // Drag handle on more sheet
  const moreHandle = moreSheet.querySelector('.mobile-sheet-drag-area');
  if (moreHandle) {
    initDragDismiss(moreHandle, moreSheet, closeMoreSheet);
  }

  return { backdrop, moreSheet };
}

// ── createElement helper ──────────────────────────────────────────────────────
function el(tag, props = {}) {
  const node = document.createElement(tag);
  Object.assign(node, props);
  if (props.className) node.className = props.className;
  if (props.innerHTML) node.innerHTML = props.innerHTML;
  return node;
}

// ── Drag-to-dismiss ──────────────────────────────────────────────────────────
function initDragDismiss(handleEl, sheetEl, onDismiss) {
  let startY = 0, currentDY = 0, dragging = false;

  handleEl.addEventListener('pointerdown', (e) => {
    dragging = true;
    startY = e.clientY;
    currentDY = 0;
    handleEl.setPointerCapture(e.pointerId);
    sheetEl.style.transition = 'none';
  });
  handleEl.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const dy = e.clientY - startY;
    currentDY = dy;
    if (dy > 0) sheetEl.style.transform = `translateY(${dy}px)`;
  });
  handleEl.addEventListener('pointerup', () => {
    if (!dragging) return;
    dragging = false;
    sheetEl.style.transition = '';
    sheetEl.style.transform = '';
    if (currentDY > 90) onDismiss();
  });
  handleEl.addEventListener('pointercancel', () => {
    dragging = false;
    sheetEl.style.transition = '';
    sheetEl.style.transform = '';
  });
}

// ── Sheet open/close ─────────────────────────────────────────────────────────
let _backdrop = null;
let _moreSheet = null;

export function openMobileMenuSheet() {
  openMoreSheet();
}
if (typeof window !== 'undefined') {
  window.openMobileMenuSheet = openMoreSheet;
}

function openMoreSheet() {
  _moreSheet?.classList.add('mobile-sheet-open');
  _backdrop?.classList.add('mobile-backdrop-visible');
}

function closeMoreSheet() {
  _moreSheet?.classList.remove('mobile-sheet-open');
  checkBackdrop();
}

function checkBackdrop() {
  const propsOpen = document.getElementById('properties-panel') &&
    !document.getElementById('properties-panel').classList.contains('hidden');
  const sidebarOpen = document.getElementById('sidebar-panel') &&
    !document.getElementById('sidebar-panel').classList.contains('hidden');
  const moreOpen = _moreSheet?.classList.contains('mobile-sheet-open');
  const anyOpen = propsOpen || sidebarOpen || moreOpen;
  _backdrop?.classList.toggle('mobile-backdrop-visible', !!anyOpen);
}

// ═════════════════════════════════════════════════════════════════════════════
// MOBILE MENU BUTTONS — add "More" + "Theme" to top menu panel
// ═════════════════════════════════════════════════════════════════════════════
function injectMenuButtons() {
  const menuPanel = document.getElementById('menu-panel');
  if (!menuPanel) return;

  // Theme mirror button (dark mode in compact menu)
  const themeBtn = el('button', {
    id: 'mobile-theme-mirror',
    className: 'p-1.5 rounded-lg text-slate-700 hover:bg-slate-100 dark:text-slate-300 transition-all duration-200 mobile-only-btn',
    title: 'Toggle Dark Mode',
    innerHTML: `
      <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round"
          d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m12.728 12.728l.707.707M12 8a4 4 0 100 8 4 4 0 000-8z"/>
      </svg>`,
  });
  themeBtn.addEventListener('click', () => document.getElementById('btn-theme-toggle')?.click());

  // More button (hamburger)
  const moreBtn = el('button', {
    id: 'mobile-more-trigger',
    className: 'p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 dark:text-slate-300 transition-colors mobile-only-btn',
    title: 'InkFlow Menu',
    innerHTML: `
      <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16"/>
      </svg>`,
  });
  moreBtn.addEventListener('click', openMoreSheet);

  menuPanel.appendChild(themeBtn);
  menuPanel.appendChild(moreBtn);
}

// ═════════════════════════════════════════════════════════════════════════════
// WIRE UP "MORE SHEET" PROXY BUTTONS
// ═════════════════════════════════════════════════════════════════════════════
function wireMoreSheetButtons() {
  const map = {
    'm-load-architecture': 'menu-btn-architecture',
    'm-load-physics': 'menu-btn-physics',
    'm-import': 'menu-btn-import-json',
    'm-import-svg': 'menu-btn-import-svg',
    'm-export-json': 'menu-btn-export-json',
    'm-export-png': 'menu-btn-export-png',
    'm-export-svg': 'menu-btn-export-svg',
    'm-export-pdf': 'menu-btn-export-pdf',
    'm-shortcuts': 'menu-btn-shortcuts',
    'm-clear': 'menu-btn-clear',
    'm-undo': 'btn-undo',
    'm-redo': 'btn-redo',
    'm-zoom-reset': 'btn-zoom-reset',
  };

  Object.entries(map).forEach(([mId, dId]) => {
    document.getElementById(mId)?.addEventListener('click', () => {
      document.getElementById(dId)?.click();
      closeMoreSheet();
    });
  });

  // Sync mobile grid selector with main menu grid selector
  const mobileGrid = document.getElementById('m-menu-grid-select');
  const desktopGrid = document.getElementById('menu-grid-select');
  if (mobileGrid && desktopGrid) {
    mobileGrid.value = desktopGrid.value;
    mobileGrid.addEventListener('change', (e) => {
      desktopGrid.value = e.target.value;
      desktopGrid.dispatchEvent(new Event('change'));
    });
  }

  // Sync mobile snap toggle with main menu snap toggle
  const mobileSnap = document.getElementById('m-menu-snap-toggle');
  const desktopSnap = document.getElementById('menu-snap-toggle');
  if (mobileSnap && desktopSnap) {
    mobileSnap.checked = desktopSnap.checked;
    mobileSnap.addEventListener('change', (e) => {
      desktopSnap.checked = e.target.checked;
      desktopSnap.dispatchEvent(new Event('change'));
    });
  }

  // Close button inside footer menu header
  document.getElementById('mobile-menu-close-btn')?.addEventListener('click', closeMoreSheet);
}

// ═════════════════════════════════════════════════════════════════════════════
// MUTATION OBSERVERS — watch native panel show/hide
// ═════════════════════════════════════════════════════════════════════════════
function watchPropertiesPanel() {
  const panel = document.getElementById('properties-panel');
  if (!panel) return;

  const obs = new MutationObserver(() => {
    if (!isMobile()) return;
    checkBackdrop();
  });
  obs.observe(panel, { attributes: true, attributeFilter: ['class', 'style'] });
}

function watchSidebarPanel() {
  const sidebar = document.getElementById('sidebar-panel');
  if (!sidebar) return;

  const obs = new MutationObserver(() => {
    if (!isMobile()) return;
    checkBackdrop();
  });
  obs.observe(sidebar, { attributes: true, attributeFilter: ['class', 'style'] });
}

// ═════════════════════════════════════════════════════════════════════════════
// TOUCH GESTURE HANDLER — pinch-to-zoom + two-finger pan
// ═════════════════════════════════════════════════════════════════════════════
class TouchGestureHandler {
  constructor(canvasEngine) {
    this.engine = canvasEngine;
    this.stage  = canvasEngine.stage;
    this._pinching = false;
    this._startDist = 0;
    this._startScale = 1;
    this._startStageX = 0;
    this._startStageY = 0;
    this._startMid = { x: 0, y: 0 };
    this._bind();
  }

  _dist(t1, t2) {
    return Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
  }

  _mid(t1, t2) {
    return { x: (t1.clientX + t2.clientX) / 2, y: (t1.clientY + t2.clientY) / 2 };
  }

  _bind() {
    const c = this.stage.container();
    c.addEventListener('touchstart', (e) => this._start(e), { passive: false });
    c.addEventListener('touchmove',  (e) => this._move(e),  { passive: false });
    c.addEventListener('touchend',   (e) => this._end(e),   { passive: false });
  }

  _start(e) {
    const t = e.touches;
    if (t.length !== 2) return;
    e.preventDefault();
    this._pinching = true;
    this._startDist   = this._dist(t[0], t[1]);
    this._startScale  = this.stage.scaleX();
    this._startStageX = this.stage.x();
    this._startStageY = this.stage.y();
    this._startMid    = this._mid(t[0], t[1]);
  }

  _move(e) {
    const t = e.touches;
    if (!this._pinching || t.length !== 2) return;
    e.preventDefault();

    const curDist  = this._dist(t[0], t[1]);
    const curMid   = this._mid(t[0], t[1]);
    const ratio    = curDist / this._startDist;

    let newScale   = this._startScale * ratio;
    newScale = Math.max(this.engine.minZoom, Math.min(this.engine.maxZoom, newScale));

    // Anchor to start midpoint in canvas space
    const anchorInCanvas = {
      x: (this._startMid.x - this._startStageX) / this._startScale,
      y: (this._startMid.y - this._startStageY) / this._startScale,
    };

    const panDx = curMid.x - this._startMid.x;
    const panDy = curMid.y - this._startMid.y;

    const newX = this._startStageX + panDx - anchorInCanvas.x * (newScale - this._startScale);
    const newY = this._startStageY + panDy - anchorInCanvas.y * (newScale - this._startScale);

    this.stage.scale({ x: newScale, y: newScale });
    this.stage.position({ x: newX, y: newY });
    this.stage.batchDraw();
    this.engine.emitViewportChanged();
  }

  _end(e) {
    if (e.touches.length < 2) this._pinching = false;
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// BACKDROP CLICK — close whatever is open
// ═════════════════════════════════════════════════════════════════════════════
function initBackdropClick() {
  _backdrop?.addEventListener('click', () => {
    // Close more sheet
    _moreSheet?.classList.remove('mobile-sheet-open');

    // Close properties (by deselecting)
    shapeManager.deselectAll();

    // Close sidebar
    const sidebar = document.getElementById('sidebar-panel');
    if (sidebar && !sidebar.classList.contains('hidden')) {
      document.getElementById('btn-close-sidebar')?.click();
    }

    _backdrop?.classList.remove('mobile-backdrop-visible');
  });
}

// ═════════════════════════════════════════════════════════════════════════════
// PUBLIC INIT — called from main.js
// ═════════════════════════════════════════════════════════════════════════════
export function initMobileUI(canvasEngine) {
  _canvasEngineRef = canvasEngine;

  // Always inject DOM (CSS controls visibility)
  injectMenuButtons();
  const { backdrop, moreSheet } = createMobileDOM();
  _backdrop  = backdrop;
  _moreSheet = moreSheet;

  wireMoreSheetButtons();
  watchPropertiesPanel();
  watchSidebarPanel();
  initBackdropClick();

  // Pinch-to-zoom on mobile
  if (isMobile()) {
    new TouchGestureHandler(canvasEngine);
    setTimeout(() => showToast('Pinch to zoom • Tap shapes to style', 2500), 800);
  }

  // Re-init touch on resize crossing breakpoint
  let _pinchActive = isMobile();
  window.addEventListener('resize', () => {
    const nowMobile = isMobile();
    if (nowMobile && !_pinchActive) {
      _pinchActive = true;
      new TouchGestureHandler(canvasEngine);
    }
  });
}
