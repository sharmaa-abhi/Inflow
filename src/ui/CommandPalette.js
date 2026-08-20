import { eventBus } from '../core/EventBus';
import { toolManager } from '../managers/ToolManager';
import { shapeManager } from '../managers/ShapeManager';
import { historyManager } from '../managers/HistoryManager';
import { persistenceManager } from '../managers/PersistenceManager';
import { themeManager } from '../managers/ThemeManager';

export class CommandPalette {
  constructor(canvasEngine) {
    this.canvasEngine = canvasEngine;
    this.modalEl = null;
    this.inputEl = null;
    this.listEl = null;
    this.isOpen = false;
    this.selectedIndex = 0;
    this.filteredCommands = [];

    this.commands = [
      // Tools
      { id: 'tool-select', title: 'Tool: Selection', category: 'Tools', shortcut: 'V or 1', action: () => toolManager.setTool('select') },
      { id: 'tool-hand', title: 'Tool: Hand (Panning tool)', category: 'Tools', shortcut: 'H or 2', action: () => toolManager.setTool('hand') },
      { id: 'tool-rect', title: 'Tool: Rectangle', category: 'Tools', shortcut: 'R or 3', action: () => toolManager.setTool('rectangle') },
      { id: 'tool-circle', title: 'Tool: Ellipse / Circle', category: 'Tools', shortcut: 'O or 4', action: () => toolManager.setTool('circle') },
      { id: 'tool-diamond', title: 'Tool: Diamond', category: 'Tools', shortcut: 'D or 5', action: () => toolManager.setTool('diamond') },
      { id: 'tool-line', title: 'Tool: Line', category: 'Tools', shortcut: 'L or 6', action: () => toolManager.setTool('line') },
      { id: 'tool-arrow', title: 'Tool: Arrow', category: 'Tools', shortcut: 'A or 7', action: () => toolManager.setTool('arrow') },
      { id: 'tool-pen', title: 'Tool: Draw / Freehand Pen', category: 'Tools', shortcut: 'P or 8', action: () => toolManager.setTool('pen') },
      { id: 'tool-text', title: 'Tool: Text', category: 'Tools', shortcut: 'T or 9', action: () => toolManager.setTool('text') },
      { id: 'tool-eraser', title: 'Tool: Eraser', category: 'Tools', shortcut: 'E or 0', action: () => toolManager.setTool('eraser') },
      { id: 'tool-laser', title: 'Tool: Laser Pointer', category: 'Tools', shortcut: 'K', action: () => toolManager.setTool('laser') },
      { id: 'tool-sticky', title: 'Tool: Sticky Note', category: 'Tools', shortcut: 'Shift+9', action: () => toolManager.setTool('sticky') },

      // Preferences & Modes
      { id: 'pref-tool-lock', title: 'Toggle Tool Lock', category: 'Preferences', shortcut: 'Q', action: () => toolManager.toggleToolLock() },
      { id: 'pref-zen-mode', title: 'Toggle Zen Mode', category: 'Preferences', shortcut: 'Alt+Z', action: () => toolManager.toggleZenMode() },
      { id: 'pref-view-mode', title: 'Toggle View Mode', category: 'Preferences', shortcut: 'Alt+R', action: () => this.canvasEngine.toggleViewMode() },
      { id: 'pref-grid', title: 'Toggle Grid', category: 'Preferences', shortcut: "Ctrl+'", action: () => this.canvasEngine.toggleGrid() },
      { id: 'pref-snap', title: 'Toggle Snap to Objects', category: 'Preferences', shortcut: 'Alt+S', action: () => eventBus.emit('toggle-snap-objects') },
      { id: 'pref-select-wrap', title: 'Selection Mode: Wrap (Enclosing)', category: 'Preferences', action: () => eventBus.emit('select-mode-changed', 'wrap') },
      { id: 'pref-select-overlap', title: 'Selection Mode: Overlap (Intersecting)', category: 'Preferences', action: () => eventBus.emit('select-mode-changed', 'overlap') },

      // Edit Actions
      { id: 'edit-undo', title: 'Undo', category: 'Edit', shortcut: 'Ctrl+Z', action: () => historyManager.undo() },
      { id: 'edit-redo', title: 'Redo', category: 'Edit', shortcut: 'Ctrl+Y', action: () => historyManager.redo() },
      { id: 'edit-copy', title: 'Copy Selection', category: 'Edit', shortcut: 'Ctrl+C', action: () => toolManager.copySelected() },
      { id: 'edit-paste', title: 'Paste', category: 'Edit', shortcut: 'Ctrl+V', action: () => toolManager.pasteCopied() },
      { id: 'edit-duplicate', title: 'Duplicate Selection', category: 'Edit', shortcut: 'Ctrl+D', action: () => toolManager.duplicateSelected() },
      { id: 'edit-cut', title: 'Cut Selection', category: 'Edit', shortcut: 'Ctrl+X', action: () => shapeManager.cutSelected() },
      { id: 'edit-delete', title: 'Delete Selection', category: 'Edit', shortcut: 'Delete', action: () => toolManager.deleteSelectedShapes() },
      { id: 'edit-group', title: 'Group Selected', category: 'Edit', shortcut: 'Ctrl+G', action: () => shapeManager.groupSelected() },
      { id: 'edit-ungroup', title: 'Ungroup Selected', category: 'Edit', shortcut: 'Ctrl+Shift+G', action: () => shapeManager.ungroupSelected() },
      { id: 'edit-select-all', title: 'Select All', category: 'Edit', shortcut: 'Ctrl+A', action: () => shapeManager.selectAll() },
      { id: 'edit-find', title: 'Find on Canvas', category: 'Edit', shortcut: 'Ctrl+F', action: () => eventBus.emit('open-search') },
      { id: 'edit-clear', title: 'Reset the Canvas', category: 'Edit', shortcut: 'Ctrl+Delete', action: () => document.getElementById('menu-btn-clear')?.click() },

      // Zoom & View
      { id: 'view-zoom-in', title: 'Zoom In', category: 'View', shortcut: '+', action: () => this.canvasEngine.zoomIn() },
      { id: 'view-zoom-out', title: 'Zoom Out', category: 'View', shortcut: '-', action: () => this.canvasEngine.zoomOut() },
      { id: 'view-zoom-reset', title: 'Reset Zoom (100%)', category: 'View', shortcut: 'Ctrl+0', action: () => this.canvasEngine.zoomReset() },
      { id: 'view-zoom-fit', title: 'Zoom to Fit', category: 'View', shortcut: 'Shift+1', action: () => this.canvasEngine.zoomToFit() },
      { id: 'view-zoom-sel', title: 'Zoom to Selection', category: 'View', shortcut: 'Shift+2', action: () => this.canvasEngine.zoomToSelection() },

      // File & Export
      { id: 'file-open', title: 'Open / Import JSON', category: 'File', shortcut: 'Ctrl+O', action: () => document.getElementById('menu-btn-import-json')?.click() },
      { id: 'file-save', title: 'Save / Export JSON', category: 'File', shortcut: 'Ctrl+S', action: () => persistenceManager.exportJSON(this.canvasEngine) },
      { id: 'file-export-png', title: 'Export Image (PNG)', category: 'File', shortcut: 'Ctrl+Shift+E', action: () => persistenceManager.exportPNG(this.canvasEngine) },
      { id: 'file-export-svg', title: 'Export Vector SVG', category: 'File', action: () => persistenceManager.exportSVG(this.canvasEngine) },
      { id: 'file-export-pdf', title: 'Export Searchable PDF', category: 'File', action: () => persistenceManager.exportPDF(this.canvasEngine) },

      // Themes
      { id: 'theme-dark', title: 'Theme: Dark Mode', category: 'Theme', action: () => themeManager.setMode('dark') },
      { id: 'theme-light', title: 'Theme: Light Mode', category: 'Theme', action: () => themeManager.setMode('light') },
      { id: 'theme-system', title: 'Theme: System Default', category: 'Theme', action: () => themeManager.setMode('system') },

      // Help
      { id: 'help-shortcuts', title: 'Help: Keyboard Shortcuts', category: 'Help', shortcut: '?', action: () => eventBus.emit('open-shortcuts-modal') },
    ];

    this.init();
  }

  init() {
    this.createDom();
    this.subscribeEvents();
  }

  createDom() {
    const modal = document.createElement('div');
    modal.id = 'command-palette-modal';
    modal.className = 'command-palette-backdrop hidden';
    modal.innerHTML = `
      <div class="command-palette-card" role="dialog" aria-modal="true">
        <div class="command-palette-input-wrap">
          <svg class="command-palette-search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" fill="currentColor" stroke="none" />
          </svg>
          <input type="text" class="command-palette-input" placeholder="Type a command or search..." autocomplete="off" spellcheck="false" />
          <kbd class="command-palette-esc-badge">ESC</kbd>
        </div>
        <div class="command-palette-list-wrap">
          <ul class="command-palette-list" role="listbox"></ul>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    this.modalEl = modal;
    this.inputEl = modal.querySelector('.command-palette-input');
    this.listEl = modal.querySelector('.command-palette-list');

    // Click outside to close
    modal.addEventListener('click', (e) => {
      if (e.target === modal) this.close();
    });

    // Input events
    this.inputEl.addEventListener('input', () => {
      this.filterCommands(this.inputEl.value);
    });

    this.inputEl.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        this.navigate(1);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        this.navigate(-1);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        this.executeSelected();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        this.close();
      }
    });
  }

  subscribeEvents() {
    eventBus.on('open-command-palette', () => this.open());
  }

  filterCommands(query = '') {
    const q = query.trim().toLowerCase();
    if (!q) {
      this.filteredCommands = [...this.commands];
    } else {
      this.filteredCommands = this.commands.filter((cmd) => {
        return cmd.title.toLowerCase().includes(q) ||
               cmd.category.toLowerCase().includes(q) ||
               (cmd.shortcut && cmd.shortcut.toLowerCase().includes(q));
      });
    }

    this.selectedIndex = 0;
    this.renderList();
  }

  renderList() {
    if (!this.listEl) return;
    this.listEl.innerHTML = '';

    if (this.filteredCommands.length === 0) {
      const emptyItem = document.createElement('li');
      emptyItem.className = 'command-palette-empty';
      emptyItem.textContent = 'No matching commands found.';
      this.listEl.appendChild(emptyItem);
      return;
    }

    this.filteredCommands.forEach((cmd, idx) => {
      const li = document.createElement('li');
      li.className = `command-palette-item ${idx === this.selectedIndex ? 'selected' : ''}`;
      li.setAttribute('role', 'option');
      li.setAttribute('aria-selected', idx === this.selectedIndex ? 'true' : 'false');
      li.innerHTML = `
        <div class="command-palette-item-left">
          <span class="command-palette-item-category">${cmd.category}</span>
          <span class="command-palette-item-title">${cmd.title}</span>
        </div>
        ${cmd.shortcut ? `<kbd class="command-palette-shortcut">${cmd.shortcut}</kbd>` : ''}
      `;

      li.addEventListener('mouseenter', () => {
        this.selectedIndex = idx;
        this.updateSelection();
      });

      li.addEventListener('click', () => {
        this.selectedIndex = idx;
        this.executeSelected();
      });

      this.listEl.appendChild(li);
    });
  }

  updateSelection() {
    const items = this.listEl.querySelectorAll('.command-palette-item');
    items.forEach((item, idx) => {
      if (idx === this.selectedIndex) {
        item.classList.add('selected');
        item.setAttribute('aria-selected', 'true');
        item.scrollIntoView({ block: 'nearest' });
      } else {
        item.classList.remove('selected');
        item.setAttribute('aria-selected', 'false');
      }
    });
  }

  navigate(dir) {
    if (this.filteredCommands.length === 0) return;
    this.selectedIndex = (this.selectedIndex + dir + this.filteredCommands.length) % this.filteredCommands.length;
    this.updateSelection();
  }

  executeSelected() {
    const cmd = this.filteredCommands[this.selectedIndex];
    if (cmd && typeof cmd.action === 'function') {
      this.close();
      cmd.action();
    }
  }

  open() {
    if (!this.modalEl) return;
    this.modalEl.classList.remove('hidden');
    this.isOpen = true;
    if (this.inputEl) {
      this.inputEl.value = '';
      this.inputEl.focus();
    }
    this.filterCommands('');
  }

  close() {
    if (!this.modalEl) return;
    this.modalEl.classList.add('hidden');
    this.isOpen = false;
  }
}
