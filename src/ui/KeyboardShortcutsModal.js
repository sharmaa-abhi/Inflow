import { eventBus } from '../core/EventBus';
import { shapeManager } from '../managers/ShapeManager';

export class KeyboardShortcutsModal {
  constructor(canvasEngine) {
    this.canvasEngine = canvasEngine;
    this.modalEl = null;
    this.searchEl = null;
    this.isOpen = false;
    this.isSearchOpen = false;

    this.init();
  }

  init() {
    this.createDom();
    this.subscribeEvents();
  }

  createDom() {
    // ─── Keyboard Shortcuts Modal ──────────────────────────────────────
    const modal = document.createElement('div');
    modal.id = 'shortcuts-modal';
    modal.className = 'shortcuts-modal-backdrop hidden';
    modal.innerHTML = `
      <div class="shortcuts-modal-card">
        <div class="shortcuts-modal-header">
          <div class="shortcuts-modal-title">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 3H6a3 3 0 00-3 3v12a3 3 0 003 3h12a3 3 0 003-3V6a3 3 0 00-3-3z"/><path d="M8 8h.01M12 8h.01M16 8h.01M8 12h.01M12 12h.01M16 12h.01M8 16h8"/></svg>
            <span>Keyboard Shortcuts</span>
          </div>
          <button class="shortcuts-modal-close" title="Close (Esc)">&times;</button>
        </div>

        <div class="shortcuts-modal-body">
          <!-- Tools Section -->
          <div class="shortcuts-group">
            <h4 class="shortcuts-group-title">Primary Drawing Tools (Number Keys)</h4>
            <div class="shortcuts-grid">
              <div class="shortcut-item"><kbd>1</kbd><span>Select Tool</span></div>
              <div class="shortcut-item"><kbd>2</kbd><span>Hand / Pan Tool</span></div>
              <div class="shortcut-item"><kbd>3</kbd><span>Rectangle</span></div>
              <div class="shortcut-item"><kbd>4</kbd><span>Ellipse / Circle</span></div>
              <div class="shortcut-item"><kbd>5</kbd><span>Diamond</span></div>
              <div class="shortcut-item"><kbd>6</kbd><span>Line</span></div>
              <div class="shortcut-item"><kbd>7</kbd><span>Arrow</span></div>
              <div class="shortcut-item"><kbd>8</kbd><span>Freehand / Pencil</span></div>
              <div class="shortcut-item"><kbd>9</kbd><span>Text Tool</span></div>
              <div class="shortcut-item"><kbd>0</kbd><span>Eraser</span></div>
            </div>
          </div>

          <!-- Secondary Tools Section -->
          <div class="shortcuts-group">
            <h4 class="shortcuts-group-title">Secondary Tools (Shift + Number)</h4>
            <div class="shortcuts-grid">
              <div class="shortcut-item"><kbd>Shift + 1</kbd><span>Multi Select</span></div>
              <div class="shortcut-item"><kbd>Shift + 2</kbd><span>Laser Pointer</span></div>
              <div class="shortcut-item"><kbd>Shift + 3</kbd><span>Rounded Rectangle</span></div>
              <div class="shortcut-item"><kbd>Shift + 4</kbd><span>Perfect Circle</span></div>
              <div class="shortcut-item"><kbd>Shift + 5</kbd><span>Hexagon / Star</span></div>
              <div class="shortcut-item"><kbd>Shift + 6</kbd><span>Polyline</span></div>
              <div class="shortcut-item"><kbd>Shift + 7</kbd><span>Curved Arrow</span></div>
              <div class="shortcut-item"><kbd>Shift + 8</kbd><span>Highlighter</span></div>
              <div class="shortcut-item"><kbd>Shift + 9</kbd><span>Sticky Note</span></div>
              <div class="shortcut-item"><kbd>Shift + 0</kbd><span>Clear Selection</span></div>
            </div>
          </div>

          <!-- Mouse & Canvas Modifiers -->
          <div class="shortcuts-group">
            <h4 class="shortcuts-group-title">Mouse & Canvas Actions</h4>
            <div class="shortcuts-grid">
              <div class="shortcut-item"><kbd>Space (Hold)</kbd><span>Temporary Hand Tool</span></div>
              <div class="shortcut-item"><kbd>Alt + Drag</kbd><span>Duplicate Object</span></div>
              <div class="shortcut-item"><kbd>Shift + Drag</kbd><span>Constrain Movement Axis</span></div>
              <div class="shortcut-item"><kbd>Ctrl + Drag</kbd><span>Disable Snapping</span></div>
              <div class="shortcut-item"><kbd>Ctrl + Wheel</kbd><span>Zoom In / Out</span></div>
              <div class="shortcut-item"><kbd>Shift + Wheel</kbd><span>Horizontal Scroll</span></div>
              <div class="shortcut-item"><kbd>Middle Click</kbd><span>Pan Canvas</span></div>
              <div class="shortcut-item"><kbd>Double Click</kbd><span>Edit Text</span></div>
            </div>
          </div>

          <!-- Essential Commands -->
          <div class="shortcuts-group">
            <h4 class="shortcuts-group-title">Essential Shortcuts</h4>
            <div class="shortcuts-grid">
              <div class="shortcut-item"><kbd>Ctrl + Z</kbd><span>Undo</span></div>
              <div class="shortcut-item"><kbd>Ctrl + Y / Shift+Z</kbd><span>Redo</span></div>
              <div class="shortcut-item"><kbd>Ctrl + C</kbd><span>Copy</span></div>
              <div class="shortcut-item"><kbd>Ctrl + X</kbd><span>Cut</span></div>
              <div class="shortcut-item"><kbd>Ctrl + V</kbd><span>Paste</span></div>
              <div class="shortcut-item"><kbd>Ctrl + D</kbd><span>Duplicate</span></div>
              <div class="shortcut-item"><kbd>Ctrl + G</kbd><span>Group</span></div>
              <div class="shortcut-item"><kbd>Ctrl + Shift + G</kbd><span>Ungroup</span></div>
              <div class="shortcut-item"><kbd>Ctrl + A</kbd><span>Select All</span></div>
              <div class="shortcut-item"><kbd>Ctrl + F</kbd><span>Find Text on Canvas</span></div>
              <div class="shortcut-item"><kbd>Ctrl + S</kbd><span>Save / Export JSON</span></div>
              <div class="shortcut-item"><kbd>Ctrl + E</kbd><span>Export PNG</span></div>
              <div class="shortcut-item"><kbd>+</kbd> / <kbd>-</kbd><span>Zoom In / Out</span></div>
              <div class="shortcut-item"><kbd>Ctrl + 0</kbd><span>Reset Zoom (100%)</span></div>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    this.modalEl = modal;

    // Close button & backdrop click
    modal.querySelector('.shortcuts-modal-close').addEventListener('click', () => this.close());
    modal.addEventListener('click', (e) => {
      if (e.target === modal) this.close();
    });

    // ─── Canvas Search Bar Popup ──────────────────────────────────────
    const search = document.createElement('div');
    search.id = 'canvas-search-bar';
    search.className = 'canvas-search-bar hidden';
    search.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
      <input type="text" class="canvas-search-input" placeholder="Search text on canvas..." />
      <span class="canvas-search-count">0 found</span>
      <button class="canvas-search-close">&times;</button>
    `;
    document.body.appendChild(search);
    this.searchEl = search;

    const input = search.querySelector('.canvas-search-input');
    const count = search.querySelector('.canvas-search-count');
    input.addEventListener('input', (e) => {
      const q = e.target.value;
      const matches = shapeManager.searchShapes(q);
      count.textContent = `${matches.length} found`;

      if (matches.length > 0) {
        shapeManager.select(matches.map(s => s.id));
      }
    });

    search.querySelector('.canvas-search-close').addEventListener('click', () => this.closeSearch());
  }

  subscribeEvents() {
    eventBus.on('open-shortcuts-modal', () => this.open());
    eventBus.on('open-search', () => this.openSearch());
  }

  open() {
    if (!this.modalEl) return;
    this.modalEl.classList.remove('hidden');
    this.isOpen = true;
  }

  close() {
    if (!this.modalEl) return;
    this.modalEl.classList.add('hidden');
    this.isOpen = false;
  }

  openSearch() {
    if (!this.searchEl) return;
    this.searchEl.classList.remove('hidden');
    this.isSearchOpen = true;
    const input = this.searchEl.querySelector('.canvas-search-input');
    if (input) {
      input.focus();
      input.select();
    }
  }

  closeSearch() {
    if (!this.searchEl) return;
    this.searchEl.classList.add('hidden');
    this.isSearchOpen = false;
  }
}
