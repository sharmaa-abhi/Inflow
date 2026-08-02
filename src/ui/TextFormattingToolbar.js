import { eventBus } from '../core/EventBus';
import { shapeManager } from '../managers/ShapeManager';
import { styleManager } from '../managers/StyleManager';
import {
  FONT_FAMILIES, FONT_SIZE_PRESETS,
  resolveFontFamily, resolveFontEntry,
  getNextFontSize, getPrevFontSize,
  DEFAULT_FONT_SIZE, DEFAULT_FONT_FAMILY_ID,
} from '../utils/fontUtils';

/**
 * TextFormattingToolbar — Excalidraw-style floating toolbar.
 *
 * Appears only when a text element is selected or being edited.
 * Contains: Font Family dropdown, Font Size dropdown, B/I/U toggles,
 * Color picker, Alignment buttons, and More Options (typography controls).
 *
 * All toolbar interactions preserve textarea focus via mousedown preventDefault.
 */
export class TextFormattingToolbar {
  constructor(canvasEngine) {
    this.canvasEngine = canvasEngine;
    this.container = null;
    this.activeTextShape = null;
    this.activeTextarea = null;
    this.isVisible = false;

    // Current state
    this.currentFontFamily = 'Virgil';
    this.currentFontSize = DEFAULT_FONT_SIZE;
    this.currentFontWeight = 400;
    this.currentFontStyle = 'normal';
    this.currentTextDecoration = 'none';
    this.currentAlign = 'left';
    this.currentColor = '#1e293b';
    this.currentOpacity = 100;
    this.currentLetterSpacing = 0;
    this.currentLineHeight = 1.35;
    this.currentWordSpacing = 0;

    // Dropdown state
    this.openDropdown = null; // 'font' | 'size' | 'color' | 'more' | null

    // Recent colors
    this.recentColors = ['#1e293b', '#e11d48', '#2563eb', '#16a34a', '#d97706'];

    this.init();
  }

  init() {
    this.createDom();
    this.subscribeEvents();
  }

  // ─── DOM Creation ──────────────────────────────────────────────────────

  createDom() {
    const el = document.createElement('div');
    el.id = 'text-formatting-toolbar';
    el.className = 'text-toolbar';
    el.style.display = 'none';

    el.innerHTML = `
      <!-- Font Family Button -->
      <button class="tt-btn tt-font-btn" data-action="toggle-font-dropdown" title="Font Family">
        <span class="tt-font-preview">Virgil</span>
        <svg class="tt-chevron" width="10" height="10" viewBox="0 0 10 10"><path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round"/></svg>
      </button>

      <!-- Font Size Button -->
      <button class="tt-btn tt-size-btn" data-action="toggle-size-dropdown" title="Font Size">
        <span class="tt-size-value">${DEFAULT_FONT_SIZE}</span>
        <svg class="tt-chevron" width="10" height="10" viewBox="0 0 10 10"><path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round"/></svg>
      </button>

      <div class="tt-divider"></div>

      <!-- Bold -->
      <button class="tt-btn tt-toggle" data-action="toggle-bold" title="Bold (Ctrl+B)">
        <strong>B</strong>
      </button>

      <!-- Italic -->
      <button class="tt-btn tt-toggle" data-action="toggle-italic" title="Italic (Ctrl+I)">
        <em>I</em>
      </button>

      <!-- Underline -->
      <button class="tt-btn tt-toggle" data-action="toggle-underline" title="Underline (Ctrl+U)">
        <span style="text-decoration:underline">U</span>
      </button>

      <!-- Strikethrough -->
      <button class="tt-btn tt-toggle" data-action="toggle-strikethrough" title="Strikethrough">
        <span style="text-decoration:line-through">S</span>
      </button>

      <div class="tt-divider"></div>

      <!-- Text Color -->
      <button class="tt-btn tt-color-btn" data-action="toggle-color-dropdown" title="Text Color">
        <div class="tt-color-swatch" style="background:#1e293b"></div>
      </button>

      <!-- Opacity -->
      <div class="tt-opacity-group" title="Opacity">
        <input type="range" class="tt-opacity-slider" min="0" max="100" value="100" />
      </div>

      <div class="tt-divider"></div>

      <!-- Alignment -->
      <button class="tt-btn tt-align-btn active" data-align="left" title="Align Left">
        <svg width="16" height="16" viewBox="0 0 16 16"><path d="M2 3h12M2 6.5h8M2 10h10M2 13.5h6" stroke="currentColor" stroke-width="1.4" fill="none" stroke-linecap="round"/></svg>
      </button>
      <button class="tt-btn tt-align-btn" data-align="center" title="Align Center">
        <svg width="16" height="16" viewBox="0 0 16 16"><path d="M2 3h12M4 6.5h8M3 10h10M5 13.5h6" stroke="currentColor" stroke-width="1.4" fill="none" stroke-linecap="round"/></svg>
      </button>
      <button class="tt-btn tt-align-btn" data-align="right" title="Align Right">
        <svg width="16" height="16" viewBox="0 0 16 16"><path d="M2 3h12M6 6.5h8M4 10h10M8 13.5h6" stroke="currentColor" stroke-width="1.4" fill="none" stroke-linecap="round"/></svg>
      </button>
      <button class="tt-btn tt-align-btn" data-align="justify" title="Justify">
        <svg width="16" height="16" viewBox="0 0 16 16"><path d="M2 3h12M2 6.5h12M2 10h12M2 13.5h12" stroke="currentColor" stroke-width="1.4" fill="none" stroke-linecap="round"/></svg>
      </button>

      <div class="tt-divider"></div>

      <!-- More Options -->
      <button class="tt-btn" data-action="toggle-more-dropdown" title="More Options">
        <svg width="16" height="16" viewBox="0 0 16 16"><circle cx="3" cy="8" r="1.3" fill="currentColor"/><circle cx="8" cy="8" r="1.3" fill="currentColor"/><circle cx="13" cy="8" r="1.3" fill="currentColor"/></svg>
      </button>
    `;

    // ─── Font Family Dropdown ──────────────────────────────────────────
    const fontDropdown = document.createElement('div');
    fontDropdown.className = 'tt-dropdown tt-font-dropdown';
    fontDropdown.style.display = 'none';

    let fontOptionsHtml = '';
    for (const font of FONT_FAMILIES) {
      fontOptionsHtml += `
        <button class="tt-dropdown-item tt-font-option" data-font-id="${font.id}" data-font-name="${font.name}">
          <span class="tt-font-aa" style="font-family:${font.preview}">Aa</span>
          <span class="tt-font-label" style="font-family:${font.preview}">${font.name}</span>
        </button>
      `;
    }
    fontDropdown.innerHTML = fontOptionsHtml;
    el.appendChild(fontDropdown);

    // ─── Font Size Dropdown ────────────────────────────────────────────
    const sizeDropdown = document.createElement('div');
    sizeDropdown.className = 'tt-dropdown tt-size-dropdown';
    sizeDropdown.style.display = 'none';

    let sizeOptionsHtml = '';
    for (const size of FONT_SIZE_PRESETS) {
      sizeOptionsHtml += `
        <button class="tt-dropdown-item tt-size-option" data-size="${size}">
          ${size}
        </button>
      `;
    }
    sizeDropdown.innerHTML = sizeOptionsHtml;
    el.appendChild(sizeDropdown);

    // ─── Color Dropdown ────────────────────────────────────────────────
    const colorDropdown = document.createElement('div');
    colorDropdown.className = 'tt-dropdown tt-color-dropdown';
    colorDropdown.style.display = 'none';

    const themeColors = [
      '#1e293b', '#64748b', '#ef4444', '#f97316',
      '#eab308', '#22c55e', '#3b82f6', '#8b5cf6',
      '#ec4899', '#14b8a6', '#ffffff', '#000000',
    ];

    let colorHtml = '<div class="tt-color-section"><span class="tt-color-label">Theme Colors</span><div class="tt-color-grid">';
    for (const c of themeColors) {
      const border = c === '#ffffff' ? 'border:1px solid #e2e8f0;' : '';
      colorHtml += `<button class="tt-color-chip" data-color="${c}" style="background:${c};${border}" title="${c}"></button>`;
    }
    colorHtml += '</div></div>';

    colorHtml += '<div class="tt-color-section"><span class="tt-color-label">Recent</span><div class="tt-color-grid tt-recent-colors">';
    for (const c of this.recentColors) {
      colorHtml += `<button class="tt-color-chip" data-color="${c}" style="background:${c}" title="${c}"></button>`;
    }
    colorHtml += '</div></div>';

    colorHtml += `
      <div class="tt-color-section">
        <span class="tt-color-label">Custom</span>
        <div class="tt-color-custom">
          <label class="tt-color-hex-label">
            <span>#</span>
            <input type="text" class="tt-color-hex-input" maxlength="6" placeholder="1e293b" />
          </label>
          <input type="color" class="tt-color-picker" value="#1e293b" />
        </div>
      </div>
      <div class="tt-color-section">
        <span class="tt-color-label">Opacity</span>
        <div class="tt-color-opacity-row">
          <input type="range" class="tt-color-opacity-slider" min="0" max="100" value="100" />
          <span class="tt-color-opacity-value">100%</span>
        </div>
      </div>
    `;
    colorDropdown.innerHTML = colorHtml;
    el.appendChild(colorDropdown);

    // ─── More Options Dropdown ─────────────────────────────────────────
    const moreDropdown = document.createElement('div');
    moreDropdown.className = 'tt-dropdown tt-more-dropdown';
    moreDropdown.style.display = 'none';
    moreDropdown.innerHTML = `
      <div class="tt-more-row">
        <span class="tt-more-label">Letter Spacing</span>
        <input type="range" class="tt-more-slider" data-prop="letterSpacing" min="-5" max="20" step="0.5" value="0" />
        <span class="tt-more-value" data-for="letterSpacing">0</span>
      </div>
      <div class="tt-more-row">
        <span class="tt-more-label">Line Height</span>
        <input type="range" class="tt-more-slider" data-prop="lineHeight" min="0.8" max="3" step="0.05" value="1.35" />
        <span class="tt-more-value" data-for="lineHeight">1.35</span>
      </div>
      <div class="tt-more-row">
        <span class="tt-more-label">Word Spacing</span>
        <input type="range" class="tt-more-slider" data-prop="wordSpacing" min="-5" max="20" step="0.5" value="0" />
        <span class="tt-more-value" data-for="wordSpacing">0</span>
      </div>
      <div class="tt-more-row tt-more-toggle-row">
        <span class="tt-more-label">Auto Width</span>
        <label class="tt-switch">
          <input type="checkbox" class="tt-auto-width-toggle" checked />
          <span class="tt-switch-slider"></span>
        </label>
      </div>
    `;
    el.appendChild(moreDropdown);

    document.body.appendChild(el);
    this.container = el;

    this.bindDomEvents();
  }

  // ─── DOM Event Binding ─────────────────────────────────────────────────

  bindDomEvents() {
    if (!this.container) return;

    // Prevent focus theft from textarea
    this.container.addEventListener('mousedown', (e) => {
      if (e.target.tagName !== 'INPUT') {
        e.preventDefault();
      }
    });

    // Click outside dropdowns to close
    document.addEventListener('mousedown', (e) => {
      if (this.openDropdown && !this.container.contains(e.target)) {
        this.closeAllDropdowns();
      }
    });

    // ─── Button actions ──────────────────────────────────────────────
    this.container.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-action]');
      if (btn) {
        const action = btn.dataset.action;
        this.handleAction(action);
        return;
      }

      // Font option
      const fontOpt = e.target.closest('.tt-font-option');
      if (fontOpt) {
        this.setFontFamily(fontOpt.dataset.fontName);
        this.closeAllDropdowns();
        this.refocusTextarea();
        return;
      }

      // Size option
      const sizeOpt = e.target.closest('.tt-size-option');
      if (sizeOpt) {
        this.setFontSize(parseInt(sizeOpt.dataset.size, 10));
        this.closeAllDropdowns();
        this.refocusTextarea();
        return;
      }

      // Color chip
      const colorChip = e.target.closest('.tt-color-chip');
      if (colorChip) {
        this.setTextColor(colorChip.dataset.color);
        this.refocusTextarea();
        return;
      }

      // Alignment
      const alignBtn = e.target.closest('.tt-align-btn');
      if (alignBtn) {
        this.setTextAlign(alignBtn.dataset.align);
        this.refocusTextarea();
        return;
      }
    });

    // ─── Color picker input ──────────────────────────────────────────
    const colorPicker = this.container.querySelector('.tt-color-picker');
    if (colorPicker) {
      colorPicker.addEventListener('input', (e) => {
        this.setTextColor(e.target.value);
      });
    }

    // HEX input
    const hexInput = this.container.querySelector('.tt-color-hex-input');
    if (hexInput) {
      hexInput.addEventListener('change', (e) => {
        let val = e.target.value.replace('#', '').trim();
        if (/^[0-9a-fA-F]{3,6}$/.test(val)) {
          this.setTextColor('#' + val);
        }
      });
    }

    // Opacity slider (in toolbar)
    const opacitySlider = this.container.querySelector('.tt-opacity-slider');
    if (opacitySlider) {
      opacitySlider.addEventListener('input', (e) => {
        const val = parseInt(e.target.value, 10);
        this.currentOpacity = val;
        this.applyUpdates({ opacity: val });
        this.refocusTextarea();
      });
    }

    // Color opacity slider (in color dropdown)
    const colorOpacitySlider = this.container.querySelector('.tt-color-opacity-slider');
    const colorOpacityValue = this.container.querySelector('.tt-color-opacity-value');
    if (colorOpacitySlider) {
      colorOpacitySlider.addEventListener('input', (e) => {
        const val = parseInt(e.target.value, 10);
        this.currentOpacity = val;
        if (colorOpacityValue) colorOpacityValue.textContent = `${val}%`;
        this.applyUpdates({ opacity: val });
      });
    }

    // ─── More options sliders ────────────────────────────────────────
    this.container.querySelectorAll('.tt-more-slider').forEach(slider => {
      slider.addEventListener('input', (e) => {
        const prop = slider.dataset.prop;
        const val = parseFloat(e.target.value);
        const label = this.container.querySelector(`.tt-more-value[data-for="${prop}"]`);
        if (label) label.textContent = val;

        const updates = {};
        updates[prop] = val;
        this.applyUpdates(updates);
      });
    });

    // Auto-width toggle
    const autoWidthToggle = this.container.querySelector('.tt-auto-width-toggle');
    if (autoWidthToggle) {
      autoWidthToggle.addEventListener('change', (e) => {
        this.applyUpdates({ autoWidth: e.target.checked });
      });
    }
  }

  // ─── Action Handler ────────────────────────────────────────────────────

  handleAction(action) {
    switch (action) {
      case 'toggle-font-dropdown':
        this.toggleDropdown('font');
        break;
      case 'toggle-size-dropdown':
        this.toggleDropdown('size');
        break;
      case 'toggle-color-dropdown':
        this.toggleDropdown('color');
        break;
      case 'toggle-more-dropdown':
        this.toggleDropdown('more');
        break;
      case 'toggle-bold':
        this.toggleBold();
        this.refocusTextarea();
        break;
      case 'toggle-italic':
        this.toggleItalic();
        this.refocusTextarea();
        break;
      case 'toggle-underline':
        this.toggleUnderline();
        this.refocusTextarea();
        break;
      case 'toggle-strikethrough':
        this.toggleStrikethrough();
        this.refocusTextarea();
        break;
    }
  }

  // ─── Dropdown Management ───────────────────────────────────────────────

  toggleDropdown(name) {
    if (this.openDropdown === name) {
      this.closeAllDropdowns();
    } else {
      this.closeAllDropdowns();
      const dropdown = this.container.querySelector(`.tt-${name}-dropdown`);
      if (dropdown) {
        dropdown.style.display = 'block';
        this.openDropdown = name;
      }
    }
  }

  closeAllDropdowns() {
    this.container.querySelectorAll('.tt-dropdown').forEach(d => {
      d.style.display = 'none';
    });
    this.openDropdown = null;
  }

  // ─── Style Setters ─────────────────────────────────────────────────────

  setFontFamily(familyName) {
    this.currentFontFamily = familyName;
    this.applyUpdates({ fontFamily: familyName });
  }

  setFontSize(size) {
    this.currentFontSize = size;
    this.applyUpdates({ fontSize: size });
  }

  toggleBold() {
    const isBold = this.currentFontWeight >= 700;
    this.currentFontWeight = isBold ? 400 : 700;
    this.applyUpdates({ fontWeight: this.currentFontWeight });
  }

  toggleItalic() {
    const isItalic = this.currentFontStyle === 'italic';
    this.currentFontStyle = isItalic ? 'normal' : 'italic';
    this.applyUpdates({ fontStyle: this.currentFontStyle });
  }

  toggleUnderline() {
    const isUnderline = this.currentTextDecoration === 'underline';
    this.currentTextDecoration = isUnderline ? 'none' : 'underline';
    this.applyUpdates({ textDecoration: this.currentTextDecoration });
  }

  toggleStrikethrough() {
    const isStrikethrough = this.currentTextDecoration === 'line-through';
    this.currentTextDecoration = isStrikethrough ? 'none' : 'line-through';
    this.applyUpdates({ textDecoration: this.currentTextDecoration });
  }

  setTextAlign(align) {
    this.currentAlign = align;
    this.applyUpdates({ align, textAlign: align });
  }

  setTextColor(color) {
    this.currentColor = color;
    this.applyUpdates({ color, stroke: color });
    this.addRecentColor(color);
  }

  addRecentColor(color) {
    const idx = this.recentColors.indexOf(color);
    if (idx > -1) this.recentColors.splice(idx, 1);
    this.recentColors.unshift(color);
    if (this.recentColors.length > 5) this.recentColors.pop();
    this.updateRecentColors();
  }

  updateRecentColors() {
    const grid = this.container.querySelector('.tt-recent-colors');
    if (!grid) return;
    grid.innerHTML = '';
    for (const c of this.recentColors) {
      const chip = document.createElement('button');
      chip.className = 'tt-color-chip';
      chip.dataset.color = c;
      chip.style.background = c;
      chip.title = c;
      grid.appendChild(chip);
    }
  }

  // ─── Apply Updates ─────────────────────────────────────────────────────

  applyUpdates(updates) {
    this.updateUI();

    // Update styleManager defaults
    styleManager.updateStyles(updates);

    // If editing in textarea mode
    if (this.activeTextarea && this.activeTextShape) {
      this.activeTextShape.updateStyle(updates);

      // Sync textarea overlay styles
      const ta = this.activeTextarea;
      if (updates.fontFamily) {
        ta.style.fontFamily = resolveFontFamily(updates.fontFamily);
      }
      if (updates.fontSize) {
        const scale = this.canvasEngine.stage.scaleX();
        ta.style.fontSize = `${updates.fontSize * scale}px`;
      }
      if (updates.fontWeight !== undefined) {
        ta.style.fontWeight = String(updates.fontWeight);
      }
      if (updates.fontStyle !== undefined) {
        ta.style.fontStyle = updates.fontStyle;
      }
      if (updates.textDecoration !== undefined) {
        ta.style.textDecoration = updates.textDecoration === 'none' ? '' : updates.textDecoration;
      }
      if (updates.textAlign || updates.align) {
        ta.style.textAlign = updates.textAlign || updates.align;
      }
      if (updates.color || updates.stroke) {
        ta.style.color = updates.color || updates.stroke;
      }
      if (updates.letterSpacing !== undefined) {
        const scale = this.canvasEngine.stage.scaleX();
        ta.style.letterSpacing = `${updates.letterSpacing * scale}px`;
      }
      if (updates.lineHeight !== undefined) {
        ta.style.lineHeight = String(updates.lineHeight);
      }
      if (updates.wordSpacing !== undefined) {
        const scale = this.canvasEngine.stage.scaleX();
        ta.style.wordSpacing = `${updates.wordSpacing * scale}px`;
      }

      // Trigger auto-resize
      ta.dispatchEvent(new Event('input', { bubbles: true }));
      return;
    }

    // If text shapes are selected on canvas (not in editing mode)
    const selectedText = shapeManager.getSelectedShapes().filter(s => s.type === 'text');
    if (selectedText.length > 0) {
      selectedText.forEach(shape => shape.updateStyle(updates));
      this.canvasEngine.shapeLayer.batchDraw();
      eventBus.emit('shapes-updated');
    }
  }

  refocusTextarea() {
    if (this.activeTextarea) {
      setTimeout(() => {
        if (this.activeTextarea) this.activeTextarea.focus();
      }, 0);
    }
  }

  // ─── Event Subscriptions ───────────────────────────────────────────────

  subscribeEvents() {
    // Text editing started
    eventBus.on('text-editing-started', ({ textShape, textarea }) => {
      this.activeTextShape = textShape;
      this.activeTextarea = textarea;
      this.syncFromShape();
      this.show();
      this.updatePosition();
    });

    // Text editing ended
    eventBus.on('text-editing-ended', () => {
      this.activeTextarea = null;
      this.activeTextShape = null;
      this.closeAllDropdowns();
      this.checkSelectionState();
    });

    // Text style changed (from Ctrl+B/I/U in TextTool)
    eventBus.on('text-style-changed', (changes) => {
      if (changes.fontWeight !== undefined) this.currentFontWeight = changes.fontWeight;
      if (changes.fontStyle !== undefined) this.currentFontStyle = changes.fontStyle;
      if (changes.textDecoration !== undefined) this.currentTextDecoration = changes.textDecoration;
      this.updateUI();
    });

    // Selection changed
    eventBus.on('selection-changed', (selectedShapes) => {
      if (this.activeTextarea) return; // Don't interrupt inline editing

      const textShapes = selectedShapes.filter(s => s.type === 'text');
      if (textShapes.length > 0) {
        this.activeTextShape = textShapes[0];
        this.syncFromShape();
        this.show();
        this.updatePosition();
      } else {
        this.activeTextShape = null;
        this.hide();
      }
    });

    // Viewport changed
    eventBus.on('viewport-changed', () => {
      if (this.isVisible) this.updatePosition();
    });

    window.addEventListener('resize', () => {
      if (this.isVisible) this.updatePosition();
    });
  }

  // ─── Sync State from Shape ─────────────────────────────────────────────

  syncFromShape() {
    const shape = this.activeTextShape;
    if (shape) {
      this.currentFontFamily = shape.fontFamily || 'Virgil';
      this.currentFontSize = shape.fontSize || DEFAULT_FONT_SIZE;
      this.currentFontWeight = shape.fontWeight || 400;
      this.currentFontStyle = shape.fontStyle || 'normal';
      this.currentTextDecoration = shape.textDecoration || 'none';
      this.currentAlign = shape.textAlign || 'left';
      this.currentColor = shape.color || shape.strokeColor || '#1e293b';
      this.currentOpacity = shape.opacity ?? 100;
      this.currentLetterSpacing = shape.letterSpacing ?? 0;
      this.currentLineHeight = shape.lineHeight ?? 1.35;
      this.currentWordSpacing = shape.wordSpacing ?? 0;
    }
    this.updateUI();
  }

  checkSelectionState() {
    const selectedText = shapeManager.getSelectedShapes().filter(s => s.type === 'text');
    if (selectedText.length > 0) {
      this.activeTextShape = selectedText[0];
      this.syncFromShape();
      this.show();
      this.updatePosition();
    } else {
      this.hide();
    }
  }

  // ─── UI State Refresh ──────────────────────────────────────────────────

  updateUI() {
    if (!this.container) return;

    // Font family button label
    const fontPreview = this.container.querySelector('.tt-font-preview');
    if (fontPreview) {
      fontPreview.textContent = this.currentFontFamily;
      const entry = resolveFontEntry(this.currentFontFamily);
      fontPreview.style.fontFamily = entry.preview;
    }

    // Font size value
    const sizeValue = this.container.querySelector('.tt-size-value');
    if (sizeValue) sizeValue.textContent = this.currentFontSize;

    // Bold active state
    const boldBtn = this.container.querySelector('[data-action="toggle-bold"]');
    if (boldBtn) boldBtn.classList.toggle('active', this.currentFontWeight >= 700);

    // Italic active state
    const italicBtn = this.container.querySelector('[data-action="toggle-italic"]');
    if (italicBtn) italicBtn.classList.toggle('active', this.currentFontStyle === 'italic');

    // Underline active state
    const underlineBtn = this.container.querySelector('[data-action="toggle-underline"]');
    if (underlineBtn) underlineBtn.classList.toggle('active', this.currentTextDecoration === 'underline');

    // Strikethrough active state
    const strikeBtn = this.container.querySelector('[data-action="toggle-strikethrough"]');
    if (strikeBtn) strikeBtn.classList.toggle('active', this.currentTextDecoration === 'line-through');

    // Color swatch
    const colorSwatch = this.container.querySelector('.tt-color-swatch');
    if (colorSwatch) colorSwatch.style.background = this.currentColor;

    // Alignment active
    this.container.querySelectorAll('.tt-align-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.align === this.currentAlign);
    });

    // Opacity slider
    const opSlider = this.container.querySelector('.tt-opacity-slider');
    if (opSlider) opSlider.value = this.currentOpacity;

    // Font dropdown active state
    this.container.querySelectorAll('.tt-font-option').forEach(opt => {
      opt.classList.toggle('active', opt.dataset.fontName === this.currentFontFamily);
    });

    // Size dropdown active state
    this.container.querySelectorAll('.tt-size-option').forEach(opt => {
      opt.classList.toggle('active', parseInt(opt.dataset.size, 10) === this.currentFontSize);
    });

    // Color picker
    const colorPicker = this.container.querySelector('.tt-color-picker');
    if (colorPicker) colorPicker.value = this.currentColor;

    // HEX input
    const hexInput = this.container.querySelector('.tt-color-hex-input');
    if (hexInput) hexInput.value = this.currentColor.replace('#', '');

    // Color opacity
    const colorOpSlider = this.container.querySelector('.tt-color-opacity-slider');
    const colorOpValue = this.container.querySelector('.tt-color-opacity-value');
    if (colorOpSlider) colorOpSlider.value = this.currentOpacity;
    if (colorOpValue) colorOpValue.textContent = `${this.currentOpacity}%`;

    // More sliders
    const lsSlider = this.container.querySelector('.tt-more-slider[data-prop="letterSpacing"]');
    if (lsSlider) lsSlider.value = this.currentLetterSpacing;
    const lsVal = this.container.querySelector('.tt-more-value[data-for="letterSpacing"]');
    if (lsVal) lsVal.textContent = this.currentLetterSpacing;

    const lhSlider = this.container.querySelector('.tt-more-slider[data-prop="lineHeight"]');
    if (lhSlider) lhSlider.value = this.currentLineHeight;
    const lhVal = this.container.querySelector('.tt-more-value[data-for="lineHeight"]');
    if (lhVal) lhVal.textContent = this.currentLineHeight;

    const wsSlider = this.container.querySelector('.tt-more-slider[data-prop="wordSpacing"]');
    if (wsSlider) wsSlider.value = this.currentWordSpacing;
    const wsVal = this.container.querySelector('.tt-more-value[data-for="wordSpacing"]');
    if (wsVal) wsVal.textContent = this.currentWordSpacing;
  }

  // ─── Positioning ───────────────────────────────────────────────────────

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
        const width = (node.width() || 100) * scale;
        targetX = screenX + width / 2;
        targetY = screenY - 56;
      }
    }

    const toolbarWidth = this.container.offsetWidth || 500;
    let left = targetX - toolbarWidth / 2;
    let top = targetY;

    // Constrain to viewport
    left = Math.max(12, Math.min(window.innerWidth - toolbarWidth - 12, left));
    if (top < 12) {
      top = targetY + 80; // Flip below
    }

    this.container.style.left = `${left}px`;
    this.container.style.top = `${top}px`;
  }

  // ─── Show / Hide ──────────────────────────────────────────────────────

  show() {
    if (!this.container) return;
    this.container.style.display = 'flex';
    this.container.classList.add('tt-enter');
    this.isVisible = true;
    this.updatePosition();

    // Remove animation class after it plays
    setTimeout(() => {
      if (this.container) this.container.classList.remove('tt-enter');
    }, 220);
  }

  hide() {
    if (!this.container) return;
    this.container.style.display = 'none';
    this.isVisible = false;
    this.closeAllDropdowns();
  }
}
