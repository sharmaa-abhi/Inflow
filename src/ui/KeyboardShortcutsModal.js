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
    // ─── Help / Keyboard Shortcuts Modal ──────────────────────────────────────
    const modal = document.createElement('div');
    modal.id = 'shortcuts-modal';
    modal.className = 'shortcuts-modal-backdrop hidden';
    modal.innerHTML = `
      <div class="shortcuts-modal-card">
        <div class="shortcuts-modal-header">
          <h2 class="shortcuts-modal-title">Help</h2>
          <button class="shortcuts-modal-close" title="Close (Esc)">&times;</button>
        </div>

        <div class="shortcuts-modal-action-pills">
          <a href="https://github.com/sharmaa-abhi/Inflow" target="_blank" rel="noopener noreferrer" class="help-pill-btn">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
            <span>Documentation</span>
          </a>
          <a href="https://github.com/sharmaa-abhi/Inflow/releases" target="_blank" rel="noopener noreferrer" class="help-pill-btn active">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
            <span>Read our blog</span>
          </a>
          <a href="https://github.com/sharmaa-abhi/Inflow/issues" target="_blank" rel="noopener noreferrer" class="help-pill-btn">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path></svg>
            <span>Found an issue? Submit</span>
          </a>
          <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" class="help-pill-btn">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
            <span>YouTube</span>
          </a>
        </div>

        <h3 class="shortcuts-subtitle">Keyboard shortcuts</h3>

        <div class="shortcuts-two-column-body">
          <!-- Left Column: Tools -->
          <div class="shortcuts-column">
            <h4 class="shortcuts-col-heading">Tools</h4>
            <div class="shortcuts-list">
              <div class="shortcut-row"><span>Hand (panning tool)</span><div class="shortcut-keys"><kbd>H</kbd></div></div>
              <div class="shortcut-row"><span>Selection</span><div class="shortcut-keys"><kbd>V</kbd><span>or</span><kbd>1</kbd></div></div>
              <div class="shortcut-row"><span>Rectangle</span><div class="shortcut-keys"><kbd>R</kbd><span>or</span><kbd>2</kbd></div></div>
              <div class="shortcut-row"><span>Diamond</span><div class="shortcut-keys"><kbd>D</kbd><span>or</span><kbd>3</kbd></div></div>
              <div class="shortcut-row"><span>Ellipse</span><div class="shortcut-keys"><kbd>O</kbd><span>or</span><kbd>4</kbd></div></div>
              <div class="shortcut-row"><span>Arrow</span><div class="shortcut-keys"><kbd>A</kbd><span>or</span><kbd>5</kbd></div></div>
              <div class="shortcut-row"><span>Line</span><div class="shortcut-keys"><kbd>L</kbd><span>or</span><kbd>6</kbd></div></div>
              <div class="shortcut-row"><span>Draw</span><div class="shortcut-keys"><kbd>P</kbd><span>or</span><kbd>7</kbd></div></div>
              <div class="shortcut-row"><span>Text</span><div class="shortcut-keys"><kbd>T</kbd><span>or</span><kbd>8</kbd></div></div>
              <div class="shortcut-row"><span>Eraser</span><div class="shortcut-keys"><kbd>E</kbd><span>or</span><kbd>0</kbd></div></div>
              <div class="shortcut-row"><span>Laser pointer</span><div class="shortcut-keys"><kbd>K</kbd></div></div>
            </div>
          </div>

          <!-- Right Column: Editor -->
          <div class="shortcuts-column">
            <h4 class="shortcuts-col-heading">Editor</h4>
            <div class="shortcuts-list">
              <div class="shortcut-row"><span>Create a flowchart from a generic element</span><div class="shortcut-keys"><kbd>Ctrl</kbd><kbd>Arrow Key</kbd></div></div>
              <div class="shortcut-row"><span>Navigate a flowchart</span><div class="shortcut-keys"><kbd>Alt</kbd><kbd>Arrow Key</kbd></div></div>
              <div class="shortcut-row"><span>Move canvas</span><div class="shortcut-keys"><kbd>Space</kbd><span>drag</span><span>or</span><kbd>Wheel</kbd><span>drag</span></div></div>
              <div class="shortcut-row"><span>Reset the canvas</span><div class="shortcut-keys"><kbd>Ctrl</kbd><kbd>Delete</kbd></div></div>
              <div class="shortcut-row"><span>Delete</span><div class="shortcut-keys"><kbd>Delete</kbd></div></div>
              <div class="shortcut-row"><span>Cut</span><div class="shortcut-keys"><kbd>Ctrl</kbd><kbd>X</kbd></div></div>
              <div class="shortcut-row"><span>Copy</span><div class="shortcut-keys"><kbd>Ctrl</kbd><kbd>C</kbd></div></div>
              <div class="shortcut-row"><span>Paste</span><div class="shortcut-keys"><kbd>Ctrl</kbd><kbd>V</kbd></div></div>
              <div class="shortcut-row"><span>Paste as plaintext</span><div class="shortcut-keys"><kbd>Ctrl</kbd><kbd>Shift</kbd><kbd>V</kbd></div></div>
              <div class="shortcut-row"><span>Undo / Redo</span><div class="shortcut-keys"><kbd>Ctrl</kbd><kbd>Z</kbd><span>/</span><kbd>Ctrl</kbd><kbd>Y</kbd></div></div>
              <div class="shortcut-row"><span>Group / Ungroup</span><div class="shortcut-keys"><kbd>Ctrl</kbd><kbd>G</kbd><span>/</span><kbd>Ctrl</kbd><kbd>Shift</kbd><kbd>G</kbd></div></div>
              <div class="shortcut-row"><span>Command palette</span><div class="shortcut-keys"><kbd>Ctrl</kbd><kbd>/</kbd></div></div>
              <div class="shortcut-row"><span>Find on canvas</span><div class="shortcut-keys"><kbd>Ctrl</kbd><kbd>F</kbd></div></div>
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
