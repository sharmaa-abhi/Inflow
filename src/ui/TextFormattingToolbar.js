import { eventBus } from '../core/EventBus';
import { shapeManager } from '../managers/ShapeManager';
import { styleManager } from '../managers/StyleManager';
import { FONT_FAMILIES, resolveFontFamilyName } from '../utils/fontUtils';

export class TextFormattingToolbar {
  constructor(canvasEngine) {
    this.canvasEngine = canvasEngine;
    this.container = null;
    this.activeTextShape = null;
    this.activeTextarea = null;
    this.isVisible = false;

    this.currentFontFamily = 'Virgil';
    this.currentFontSize = 24;
    this.currentAlign = 'left';
    this.currentColor = '#1e293b';

    this.init();
  }

  init() {
    this.createDom();
    this.subscribeEvents();
  }

  createDom() {
    const el = document.createElement('div');
    el.id = 'text-formatting-toolbar';
    el.className = 'text-formatting-toolbar hidden fixed z-50 flex items-center gap-2 p-1.5 rounded-xl shadow-2xl backdrop-blur-md bg-white/90 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 text-xs transition-opacity duration-150 select-none';
    
    el.innerHTML = `
      <!-- Font Family Group -->
      <div class="flex items-center bg-slate-100 dark:bg-slate-800/80 p-0.5 rounded-lg border border-slate-200/60 dark:border-slate-700/60">
        <button data-family="Virgil" data-id="1" title="Virgil (Handwritten)" class="btn-tf-font px-2 py-1 rounded-md font-medium transition-colors hover:bg-white dark:hover:bg-slate-700 font-handwritten">
          Virgil
        </button>
        <button data-family="Helvetica" data-id="2" title="Helvetica (Sans-Serif)" class="btn-tf-font px-2 py-1 rounded-md font-medium transition-colors hover:bg-white dark:hover:bg-slate-700 font-sans">
          Helvetica
        </button>
        <button data-family="Cascadia" data-id="3" title="Cascadia (Code / Monospace)" class="btn-tf-font px-2 py-1 rounded-md font-medium transition-colors hover:bg-white dark:hover:bg-slate-700 font-mono">
          Cascadia
        </button>
      </div>

      <div class="h-4 w-px bg-slate-200 dark:bg-slate-700"></div>

      <!-- Font Size Presets -->
      <div class="flex items-center bg-slate-100 dark:bg-slate-800/80 p-0.5 rounded-lg border border-slate-200/60 dark:border-slate-700/60">
        <button data-size="16" title="Small (16px)" class="btn-tf-size w-7 h-6 flex items-center justify-center rounded-md font-semibold text-[11px] transition-colors hover:bg-white dark:hover:bg-slate-700">S</button>
        <button data-size="24" title="Medium (24px)" class="btn-tf-size w-7 h-6 flex items-center justify-center rounded-md font-semibold text-[13px] transition-colors hover:bg-white dark:hover:bg-slate-700">M</button>
        <button data-size="36" title="Large (36px)" class="btn-tf-size w-7 h-6 flex items-center justify-center rounded-md font-semibold text-[15px] transition-colors hover:bg-white dark:hover:bg-slate-700">L</button>
        <button data-size="48" title="Extra Large (48px)" class="btn-tf-size w-7 h-6 flex items-center justify-center rounded-md font-semibold text-[17px] transition-colors hover:bg-white dark:hover:bg-slate-700">XL</button>
      </div>

      <div class="h-4 w-px bg-slate-200 dark:bg-slate-700"></div>

      <!-- Alignment Buttons -->
      <div class="flex items-center bg-slate-100 dark:bg-slate-800/80 p-0.5 rounded-lg border border-slate-200/60 dark:border-slate-700/60">
        <button data-align="left" title="Align Left" class="btn-tf-align p-1 rounded-md transition-colors hover:bg-white dark:hover:bg-slate-700">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h10M4 18h14"/></svg>
        </button>
        <button data-align="center" title="Align Center" class="btn-tf-align p-1 rounded-md transition-colors hover:bg-white dark:hover:bg-slate-700">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M7 12h10M5 18h14"/></svg>
        </button>
        <button data-align="right" title="Align Right" class="btn-tf-align p-1 rounded-md transition-colors hover:bg-white dark:hover:bg-slate-700">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M10 12h10M6 18h14"/></svg>
        </button>
      </div>

      <div class="h-4 w-px bg-slate-200 dark:bg-slate-700"></div>

      <!-- Color Swatches & Picker -->
      <div class="flex items-center gap-1.5 px-0.5">
        <button data-color="#1e293b" class="btn-tf-color w-5 h-5 rounded-full border border-slate-300 dark:border-slate-600 bg-[#1e293b]" title="#1e293b"></button>
        <button data-color="#e11d48" class="btn-tf-color w-5 h-5 rounded-full border border-slate-300 dark:border-slate-600 bg-[#e11d48]" title="#e11d48"></button>
        <button data-color="#2563eb" class="btn-tf-color w-5 h-5 rounded-full border border-slate-300 dark:border-slate-600 bg-[#2563eb]" title="#2563eb"></button>
        <button data-color="#16a34a" class="btn-tf-color w-5 h-5 rounded-full border border-slate-300 dark:border-slate-600 bg-[#16a34a]" title="#16a34a"></button>
        <button data-color="#d97706" class="btn-tf-color w-5 h-5 rounded-full border border-slate-300 dark:border-slate-600 bg-[#d97706]" title="#d97706"></button>
        <button data-color="#9333ea" class="btn-tf-color w-5 h-5 rounded-full border border-slate-300 dark:border-slate-600 bg-[#9333ea]" title="#9333ea"></button>
        
        <label class="relative w-5 h-5 rounded-full overflow-hidden border border-slate-300 dark:border-slate-600 cursor-pointer flex items-center justify-center bg-gradient-to-tr from-indigo-500 via-rose-500 to-amber-400" title="Custom Color">
          <input type="color" id="tf-custom-color" class="absolute opacity-0 inset-0 w-full h-full cursor-pointer" />
        </label>
      </div>
    `;

    document.body.appendChild(el);
    this.container = el;

    this.bindDomEvents();
  }

  bindDomEvents() {
    if (!this.container) return;

    // Prevent mousedown from taking focus away from active textarea
    this.container.addEventListener('mousedown', (e) => {
      if (e.target.tagName !== 'INPUT') {
        e.preventDefault();
      }
    });

    const handleAction = (fn) => (e) => {
      e.preventDefault();
      fn();
      if (this.activeTextarea) {
        this.activeTextarea.focus();
      }
    };

    // Font Family buttons
    this.container.querySelectorAll('.btn-tf-font').forEach(btn => {
      const handler = handleAction(() => {
        const family = btn.getAttribute('data-family');
        this.setFontFamily(family);
      });
      btn.addEventListener('mousedown', handler);
      btn.addEventListener('pointerdown', handler);
    });

    // Font Size buttons
    this.container.querySelectorAll('.btn-tf-size').forEach(btn => {
      const handler = handleAction(() => {
        const size = parseInt(btn.getAttribute('data-size'), 10);
        this.setFontSize(size);
      });
      btn.addEventListener('mousedown', handler);
      btn.addEventListener('pointerdown', handler);
    });

    // Alignment buttons
    this.container.querySelectorAll('.btn-tf-align').forEach(btn => {
      const handler = handleAction(() => {
        const align = btn.getAttribute('data-align');
        this.setTextAlign(align);
      });
      btn.addEventListener('mousedown', handler);
      btn.addEventListener('pointerdown', handler);
    });

    // Color Swatches
    this.container.querySelectorAll('.btn-tf-color').forEach(btn => {
      const handler = handleAction(() => {
        const color = btn.getAttribute('data-color');
        this.setTextColor(color);
      });
      btn.addEventListener('mousedown', handler);
      btn.addEventListener('pointerdown', handler);
    });

    // Custom Color Picker
    const customColorInput = this.container.querySelector('#tf-custom-color');
    if (customColorInput) {
      customColorInput.addEventListener('input', (e) => {
        this.setTextColor(e.target.value);
        if (this.activeTextarea) {
          this.activeTextarea.focus();
        }
      });
    }
  }

  subscribeEvents() {
    // Listen for text editing started / finished
    eventBus.on('text-editing-started', ({ textShape, textarea }) => {
      this.activeTextShape = textShape;
      this.activeTextarea = textarea;
      this.syncActiveValues();
      this.show();
      this.updatePosition();
    });

    eventBus.on('text-editing-ended', () => {
      this.activeTextarea = null;
      this.activeTextShape = null;
      this.checkSelectionState();
    });

    // Selection changed
    eventBus.on('selection-changed', (selectedShapes) => {
      if (this.activeTextarea) return; // Don't interrupt active inline editing
      
      const textShapes = selectedShapes.filter(s => s.type === 'text');
      if (textShapes.length > 0) {
        this.activeTextShape = textShapes[0];
        this.syncActiveValues();
        this.show();
        this.updatePosition();
      } else {
        this.activeTextShape = null;
        this.hide();
      }
    });

    // Viewport changed (pan/zoom)
    eventBus.on('viewport-changed', () => {
      if (this.isVisible) {
        this.updatePosition();
      }
    });

    window.addEventListener('resize', () => {
      if (this.isVisible) this.updatePosition();
    });
  }

  checkSelectionState() {
    const selectedText = shapeManager.getSelectedShapes().filter(s => s.type === 'text');
    if (selectedText.length > 0) {
      this.activeTextShape = selectedText[0];
      this.syncActiveValues();
      this.show();
      this.updatePosition();
    } else {
      this.hide();
    }
  }

  syncActiveValues() {
    if (this.activeTextShape) {
      this.currentFontFamily = this.activeTextShape.fontFamily || 'Architects Daughter';
      this.currentFontSize = this.activeTextShape.fontSize || 24;
      this.currentAlign = this.activeTextShape.textAlign || 'left';
      this.currentColor = this.activeTextShape.color || this.activeTextShape.strokeColor || '#1e293b';
    } else {
      const styles = styleManager.getActiveStyles();
      this.currentFontFamily = styles.fontFamily || 'Architects Daughter';
      this.currentFontSize = styles.fontSize || 24;
      this.currentAlign = styles.align || 'left';
      this.currentColor = styles.stroke || '#1e293b';
    }
    this.updateActiveUiState();
  }

  updateActiveUiState() {
    if (!this.container) return;

    // Font family highlight
    this.container.querySelectorAll('.btn-tf-font').forEach(btn => {
      const family = btn.getAttribute('data-family');
      const id = parseInt(btn.getAttribute('data-id'), 10);
      const isMatch = (
        family === this.currentFontFamily ||
        id === this.currentFontFamily ||
        (id === 1 && (this.currentFontFamily === 'handwritten' || this.currentFontFamily === 'Architects Daughter')) ||
        (id === 2 && (this.currentFontFamily === 'sans' || this.currentFontFamily === 'Inter')) ||
        (id === 3 && (this.currentFontFamily === 'code' || this.currentFontFamily === 'Fira Code'))
      );

      if (isMatch) {
        btn.classList.add('bg-white', 'dark:bg-slate-700', 'shadow-sm', 'text-indigo-600', 'dark:text-indigo-400');
      } else {
        btn.classList.remove('bg-white', 'dark:bg-slate-700', 'shadow-sm', 'text-indigo-600', 'dark:text-indigo-400');
      }
    });

    // Font size highlight
    this.container.querySelectorAll('.btn-tf-size').forEach(btn => {
      const size = parseInt(btn.getAttribute('data-size'), 10);
      if (size === this.currentFontSize) {
        btn.classList.add('bg-white', 'dark:bg-slate-700', 'shadow-sm', 'text-indigo-600', 'dark:text-indigo-400');
      } else {
        btn.classList.remove('bg-white', 'dark:bg-slate-700', 'shadow-sm', 'text-indigo-600', 'dark:text-indigo-400');
      }
    });

    // Alignment highlight
    this.container.querySelectorAll('.btn-tf-align').forEach(btn => {
      const align = btn.getAttribute('data-align');
      if (align === this.currentAlign) {
        btn.classList.add('bg-white', 'dark:bg-slate-700', 'shadow-sm', 'text-indigo-600', 'dark:text-indigo-400');
      } else {
        btn.classList.remove('bg-white', 'dark:bg-slate-700', 'shadow-sm', 'text-indigo-600', 'dark:text-indigo-400');
      }
    });

    // Color highlight
    this.container.querySelectorAll('.btn-tf-color').forEach(btn => {
      const color = btn.getAttribute('data-color');
      if (color.toLowerCase() === (this.currentColor || '').toLowerCase()) {
        btn.classList.add('ring-2', 'ring-indigo-500', 'ring-offset-1');
      } else {
        btn.classList.remove('ring-2', 'ring-indigo-500', 'ring-offset-1');
      }
    });
  }

  setFontFamily(family) {
    this.currentFontFamily = family;
    this.applyUpdates({ fontFamily: family });
  }

  setFontSize(size) {
    this.currentFontSize = size;
    this.applyUpdates({ fontSize: size });
  }

  setTextAlign(align) {
    this.currentAlign = align;
    this.applyUpdates({ align, textAlign: align });
  }

  setTextColor(color) {
    this.currentColor = color;
    this.applyUpdates({ color, stroke: color });
  }

  applyUpdates(updates) {
    this.updateActiveUiState();

    // Update styleManager so newly drawn shapes inherit choice
    styleManager.updateStyles(updates);

    // If active in textarea overlay
    if (this.activeTextarea && this.activeTextShape) {
      if (updates.fontFamily) {
        this.activeTextarea.style.fontFamily = resolveFontFamilyName(updates.fontFamily);
      }
      if (updates.fontSize) {
        const scale = this.canvasEngine.stage.scaleX();
        this.activeTextarea.style.fontSize = `${updates.fontSize * scale}px`;
      }
      if (updates.textAlign || updates.align) {
        this.activeTextarea.style.textAlign = updates.textAlign || updates.align;
      }
      if (updates.color || updates.stroke) {
        this.activeTextarea.style.color = updates.color || updates.stroke;
      }
      this.activeTextShape.updateStyle(updates);

      // Trigger auto-resize on active textarea
      const event = new Event('input', { bubbles: true });
      this.activeTextarea.dispatchEvent(event);
      return;
    }

    // If text shape(s) are selected on canvas
    const selectedText = shapeManager.getSelectedShapes().filter(s => s.type === 'text');
    if (selectedText.length > 0) {
      selectedText.forEach(shape => {
        shape.updateStyle(updates);
      });
      this.canvasEngine.shapeLayer.batchDraw();
      eventBus.emit('shapes-updated');
    }
  }

  updatePosition() {
    if (!this.container || !this.isVisible) return;

    let targetX = window.innerWidth / 2;
    let targetY = 80;

    if (this.activeTextarea) {
      const rect = this.activeTextarea.getBoundingClientRect();
      targetX = rect.left + rect.width / 2;
      targetY = rect.top - 56;
    } else if (this.activeTextShape && this.canvasEngine) {
      const stage = this.canvasEngine.stage;
      const scale = stage.scaleX();
      const stagePos = stage.position();
      const node = this.activeTextShape.konvaNode;
      if (node) {
        const screenX = node.x() * scale + stagePos.x;
        const screenY = node.y() * scale + stagePos.y;
        const width = node.width() * scale;
        targetX = screenX + width / 2;
        targetY = screenY - 56;
      }
    }

    const toolbarWidth = this.container.offsetWidth || 340;
    const toolbarHeight = this.container.offsetHeight || 44;

    let left = targetX - toolbarWidth / 2;
    let top = targetY;

    // Constrain within screen bounds
    left = Math.max(16, Math.min(window.innerWidth - toolbarWidth - 16, left));
    if (top < 16) {
      top = targetY + 80; // Flip below if off top screen
    }

    this.container.style.left = `${left}px`;
    this.container.style.top = `${top}px`;
  }

  show() {
    if (!this.container) return;
    this.container.classList.remove('hidden');
    this.isVisible = true;
    this.updatePosition();
  }

  hide() {
    if (!this.container) return;
    this.container.classList.add('hidden');
    this.isVisible = false;
  }
}
