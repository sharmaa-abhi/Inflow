import { eventBus } from '../core/EventBus';
import { shapeManager } from '../managers/ShapeManager';
import { styleManager } from '../managers/StyleManager';
import { toolManager } from '../managers/ToolManager';
import { threeDPreviewManager } from '../managers/ThreeDPreviewManager';
import { COLORS, PALETTE_CATEGORIES, getColorsByCategory, DEFAULT_STROKE_COLORS, DEFAULT_FILL_COLORS, parseAnyColor, toHex, convertColor, detectFormat } from '../utils/colors';

export class PropertiesPanel {
  constructor() {
    this.panel = document.getElementById('properties-panel');
    this.btnClose = document.getElementById('btn-close-properties');

    // Geometry Inputs
    this.inpWidth = document.getElementById('prop-width');
    this.inpHeight = document.getElementById('prop-height');
    this.inpRotation = document.getElementById('prop-rotation');
    this.inpOpacity = document.getElementById('prop-opacity');

    // Palettes & Custom Pickers & Category Dropdowns
    this.strokePalette = document.getElementById('prop-stroke-palette');
    this.strokeCustom = document.getElementById('prop-stroke-custom');
    this.strokeText   = document.getElementById('prop-stroke-text');
    this.strokeFmt    = document.getElementById('prop-stroke-fmt');
    this.strokeCategory = document.getElementById('prop-stroke-category');
    this.fillPalette = document.getElementById('prop-fill-palette');
    this.fillCustom = document.getElementById('prop-fill-custom');
    this.fillText   = document.getElementById('prop-fill-text');
    this.fillFmt    = document.getElementById('prop-fill-fmt');
    this.fillCategory = document.getElementById('prop-fill-category');

    // Button Groups
    this.strokeWidthGroup = document.getElementById('prop-stroke-width-group');
    this.strokeStyleGroup = document.getElementById('prop-stroke-style-group');
    this.fillStyleGroup   = document.getElementById('prop-fill-style-group');

    // Active format state per channel: 'hex' | 'rgb' | 'hsl'
    this.strokeColorFmt = 'hex';
    this.fillColorFmt   = 'hex';

    // Category states
    this.activeStrokeCategory = 'quick';
    this.activeFillCategory = 'quick';

    this.selectedShapes = [];
    this.init();
  }

  init() {
    if (!this.panel) return;

    this.initCategorySelects();

    // Build palettes dynamically
    this.buildColorPalette(this.strokePalette, 'stroke', false, this.activeStrokeCategory);
    this.buildColorPalette(this.fillPalette, 'fill', true, this.activeFillCategory);

    // Bind basic events
    if (this.btnClose) {
      this.btnClose.addEventListener('click', () => {
        shapeManager.deselectAll();
      });
    }

    // Bind Arrange actions
    if (this.btnSendBack) this.btnSendBack.addEventListener('click', () => toolManager.reorderSelected('back'));
    if (this.btnSendBackward) this.btnSendBackward.addEventListener('click', () => toolManager.reorderSelected('backward'));
    if (this.btnBringForward) this.btnBringForward.addEventListener('click', () => toolManager.reorderSelected('forward'));
    if (this.btnBringFront) this.btnBringFront.addEventListener('click', () => toolManager.reorderSelected('front'));

    // Bind Z-index change
    if (this.inpZIndex) {
      this.inpZIndex.addEventListener('change', (e) => {
        const val = parseInt(e.target.value, 10);
        if (!isNaN(val)) {
          toolManager.changeSelectedZIndex(val);
        }
      });

      // Auto-trigger 3D preview on focus
      this.inpZIndex.addEventListener('focus', () => {
        threeDPreviewManager.activate();
      });

      // Close 3D preview on blur unless manually activated
      this.inpZIndex.addEventListener('blur', () => {
        setTimeout(() => {
          if (document.activeElement !== this.inpZIndex && !threeDPreviewManager.overlay.classList.contains('manual-active')) {
            threeDPreviewManager.deactivate();
          }
        }, 300);
      });
    }

    // Bind Manual 3D Toggle
    if (this.btnToggle3D) {
      this.btnToggle3D.addEventListener('click', () => {
        if (threeDPreviewManager.isActive) {
          threeDPreviewManager.overlay.classList.remove('manual-active');
          this.btnToggle3D.classList.remove('btn-active');
          threeDPreviewManager.deactivate();
        } else {
          threeDPreviewManager.overlay.classList.add('manual-active');
          this.btnToggle3D.classList.add('btn-active');
          threeDPreviewManager.activate();
        }
      });
    }

    this.setupGeometryListeners();
    this.setupStyleListeners();
    this.setupTypographyListeners();

    // Subscribe to selection events to show/hide panel
    eventBus.on('selection-changed', (selectedShapes) => {
      this.handleSelectionChanged(selectedShapes);
    });

    // Also update UI when shape transforms on canvas
    eventBus.on('shape-transformed', () => {
      this.syncGeometryInputs();
    });

    // Sync styles back if they are updated by undo/redo
    eventBus.on('shapes-style-modified', () => {
      this.syncStyleInputs();
    });

    // Sync Z-index back when shapes list is updated/reordered
    eventBus.on('shapes-updated', () => {
      this.syncZIndexInput();
    });

    // Rebuild palettes on theme change
    eventBus.on('theme-changed', () => {
      this.buildColorPalette(this.strokePalette, 'stroke', false, this.activeStrokeCategory);
      this.buildColorPalette(this.fillPalette, 'fill', true, this.activeFillCategory);
      this.syncStyleInputs();
    });
  }

  initCategorySelects() {
    const setupSelect = (selectEl, styleKey, isFill) => {
      if (!selectEl) return;
      selectEl.innerHTML = '';
      PALETTE_CATEGORIES.forEach(cat => {
        const opt = document.createElement('option');
        opt.value = cat.id;
        opt.textContent = cat.name;
        selectEl.appendChild(opt);
      });
      selectEl.value = isFill ? this.activeFillCategory : this.activeStrokeCategory;
      selectEl.addEventListener('change', (e) => {
        const catId = e.target.value;
        if (isFill) {
          this.activeFillCategory = catId;
          this.buildColorPalette(this.fillPalette, 'fill', true, catId);
        } else {
          this.activeStrokeCategory = catId;
          this.buildColorPalette(this.strokePalette, 'stroke', false, catId);
        }
        this.syncStyleInputs();
      });
    };

    setupSelect(this.strokeCategory, 'stroke', false);
    setupSelect(this.fillCategory, 'fill', true);
  }

  buildColorPalette(container, styleKey, includeTransparent = false, categoryId = 'quick') {
    if (!container) return;
    container.innerHTML = '';

    const paletteColors = getColorsByCategory(categoryId);
    const colors = includeTransparent ? ['transparent', ...paletteColors] : paletteColors;

    colors.forEach(color => {
      const btn = document.createElement('button');
      btn.className = 'w-5 h-5 rounded-full border border-slate-300 transition-transform hover:scale-125 focus:outline-none flex-shrink-0 cursor-pointer';
      
      if (color === 'transparent') {
        btn.style.background = 'linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)';
        btn.style.backgroundSize = '8px 8px';
        btn.style.backgroundPosition = '0 0, 0 4px, 4px -4px, -4px 0px';
        btn.style.backgroundColor = '#ffffff';
        btn.title = 'Transparent';
      } else {
        btn.style.backgroundColor = color;
        btn.title = color;
      }

      btn.addEventListener('click', () => {
        styleManager.updateStyles({ [styleKey]: color });
        this.updatePaletteActiveStyles(container, color);
      });

      container.appendChild(btn);
    });
  }

  updatePaletteActiveStyles(container, activeColor) {
    if (!container) return;
    Array.from(container.children).forEach(btn => {
      const isTransparent = btn.title === 'Transparent';
      const colorVal = isTransparent ? 'transparent' : btn.title;

      if (colorVal.toLowerCase() === activeColor.toLowerCase()) {
        btn.classList.add('ring-2', 'ring-indigo-500', 'ring-offset-2');
      } else {
        btn.classList.remove('ring-2', 'ring-indigo-500', 'ring-offset-2');
      }
    });
  }

  handleSelectionChanged(selectedShapes) {
    this.selectedShapes = selectedShapes;

    if (selectedShapes.length === 0) {
      this.panel.classList.add('hidden');
    } else {
      this.panel.classList.remove('hidden');

      // Check if text properties need to be displayed
      const hasText = selectedShapes.some(s => s.type === 'text');
      if (hasText) {
        this.sectionText.classList.remove('hidden');
      } else {
        this.sectionText.classList.add('hidden');
      }

      // Check if line smoothing properties need to be displayed
      const hasPen = selectedShapes.some(s => s.type === 'pen');
      if (this.sectionSmoothing) {
        if (hasPen) {
          this.sectionSmoothing.classList.remove('hidden');
        } else {
          this.sectionSmoothing.classList.add('hidden');
        }
      }

      this.syncGeometryInputs();
      this.syncStyleInputs();
      this.syncZIndexInput();
    }
  }

  syncGeometryInputs() {
    if (this.selectedShapes.length === 0) return;

    // Use values of the first selected shape
    const primary = this.selectedShapes[0];
    const geom = primary.getGeometry();
    const node = primary.konvaNode;

    // Update coordinates, handling rotation and scaling
    // Konva scale changes dimensions, so display scaled width/height
    const scaleX = node.scaleX();
    const scaleY = node.scaleY();

    if (this.inpWidth) {
      this.inpWidth.value = Math.round((geom.width || node.width()) * Math.abs(scaleX));
    }
    if (this.inpHeight) {
      this.inpHeight.value = Math.round((geom.height || node.height()) * Math.abs(scaleY));
    }
    if (this.inpRotation) {
      this.inpRotation.value = Math.round(node.rotation());
    }
    if (this.inpOpacity) {
      this.inpOpacity.value = node.opacity();
    }
  }

  syncStyleInputs() {
    if (this.selectedShapes.length === 0) return;

    const primary = this.selectedShapes[0];
    const style = primary.style;

    // Color buttons
    this.updatePaletteActiveStyles(this.strokePalette, style.stroke || '');
    this.updatePaletteActiveStyles(this.fillPalette, style.fill || '');

    // Sync native color swatch
    if (this.strokeCustom) this.strokeCustom.value = style.stroke?.startsWith('#') ? style.stroke : '#1e293b';
    if (this.fillCustom)   this.fillCustom.value   = style.fill?.startsWith('#')   ? style.fill   : '#ffffff';

    // Sync multi-format text fields
    if (this.strokeText) {
      const s = style.stroke || '#1e293b';
      this.strokeText.value = convertColor(s, this.strokeColorFmt) || s;
      if (this.strokeFmt) this.strokeFmt.textContent = this.strokeColorFmt.toUpperCase();
    }
    if (this.fillText) {
      const f = style.fill || 'transparent';
      if (f === 'transparent') {
        this.fillText.value = 'transparent';
      } else {
        this.fillText.value = convertColor(f, this.fillColorFmt) || f;
      }
      if (this.fillFmt) this.fillFmt.textContent = this.fillColorFmt.toUpperCase();
    }

    // Button groups active states
    this.syncGroupButtonsActive(this.strokeWidthGroup, style.strokeWidth);
    this.syncGroupButtonsActive(this.strokeStyleGroup, style.strokeStyle);
    this.syncGroupButtonsActive(this.fillStyleGroup,   style.fillStyle || 'hachure');

    // Text style sync
    if (primary.type === 'text') {
      if (this.inpFontSize) this.inpFontSize.value = style.fontSize || 20;
      if (this.inpFontFamily) this.inpFontFamily.value = style.fontFamily || 'Inter';
      this.syncGroupButtonsActive(this.textAlignGroup, style.align || 'left');
    }

    // Sync line smoothing styles
    if (this.toggleERDP) {
      this.toggleERDP.checked = (style.smoothingMode || 'erdp') === 'erdp';
    }
    if (this.sliderSmoothing) {
      const tension = style.smoothingTension !== undefined ? style.smoothingTension : 0.4;
      this.sliderSmoothing.value = Math.round(tension * 100);
      if (this.valSmoothing) {
        this.valSmoothing.textContent = `${Math.round(tension * 100)}%`;
      }
    }
  }

  syncZIndexInput() {
    if (!this.inpZIndex) return;

    if (this.selectedShapes.length !== 1) {
      this.inpZIndex.disabled = true;
      this.inpZIndex.value = '';
      if (this.lblZIndexMax) {
        this.lblZIndexMax.textContent = '';
      }
      return;
    }

    this.inpZIndex.disabled = false;
    const shape = this.selectedShapes[0];
    const allShapes = shapeManager.getAllShapes();
    const currentIndex = allShapes.findIndex(s => s.id === shape.id);

    this.inpZIndex.value = currentIndex;
    this.inpZIndex.max = allShapes.length - 1;
    this.inpZIndex.min = 0;

    if (this.lblZIndexMax) {
      this.lblZIndexMax.textContent = `/ ${allShapes.length - 1}`;
    }
  }

  syncGroupButtonsActive(group, value) {
    if (!group) return;
    Array.from(group.querySelectorAll('button')).forEach(btn => {
      const valAttr = btn.getAttribute('data-val');
      // Convert to number if it matches a numeric value
      const match = valAttr === String(value) || (Number(valAttr) === value);
      
      if (match) {
        btn.classList.add('bg-white', 'shadow-sm', 'text-indigo-600');
        btn.classList.remove('text-slate-600');
      } else {
        btn.classList.remove('bg-white', 'shadow-sm', 'text-indigo-600');
        btn.classList.add('text-slate-600');
      }
    });
  }

  setupGeometryListeners() {
    // Listen to manual typing in width, height, rotation, opacity
    const triggerGeometryUpdate = (prop, value) => {
      if (this.selectedShapes.length === 0) return;
      eventBus.emit('geometry-updated-input', {
        property: prop,
        value,
        shapes: this.selectedShapes
      });
    };

    if (this.inpWidth) {
      this.inpWidth.addEventListener('input', (e) => {
        triggerGeometryUpdate('width', Number(e.target.value));
      });
    }
    if (this.inpHeight) {
      this.inpHeight.addEventListener('input', (e) => {
        triggerGeometryUpdate('height', Number(e.target.value));
      });
    }
    if (this.inpRotation) {
      this.inpRotation.addEventListener('input', (e) => {
        triggerGeometryUpdate('rotation', Number(e.target.value));
      });
    }
    if (this.inpOpacity) {
      this.inpOpacity.addEventListener('input', (e) => {
        styleManager.updateStyles({ opacity: Number(e.target.value) });
      });
    }
  }

  // ── Multi-format color helper ─────────────────────────────────────────────
  _setupColorChannel({
    customEl, textEl, fmtEl,
    getFmt, setFmt,
    styleKey, paletteEl,
  }) {
    const CYCLE = ['hex', 'rgb', 'hsl'];

    // Native color swatch → sync text field
    if (customEl) {
      customEl.addEventListener('input', (e) => {
        const hex = e.target.value;          // always #rrggbb from <input type=color>
        const displayed = convertColor(hex, getFmt());
        if (textEl) textEl.value = displayed;
        styleManager.updateStyles({ [styleKey]: hex });
        this.updatePaletteActiveStyles(paletteEl, hex);
      });
    }

    // Text field → parse any format, apply
    if (textEl) {
      const applyText = () => {
        const raw = textEl.value.trim();
        if (!raw) return;
        if (raw === 'transparent') {
          styleManager.updateStyles({ [styleKey]: 'transparent' });
          if (customEl) customEl.value = '#ffffff';
          this.updatePaletteActiveStyles(paletteEl, 'transparent');
          return;
        }
        const parsed = parseAnyColor(raw);
        if (!parsed) {
          // invalid — shake the input border
          textEl.closest('div')?.classList.add('border-red-400');
          setTimeout(() => textEl.closest('div')?.classList.remove('border-red-400'), 800);
          return;
        }
        const hex = toHex(parsed);
        // Detect the format the user typed and lock to it
        const fmt = detectFormat(raw);
        if (fmt !== 'unknown' && fmt !== 'transparent') setFmt(fmt);
        if (fmtEl) fmtEl.textContent = getFmt().toUpperCase();
        styleManager.updateStyles({ [styleKey]: hex });
        if (customEl) customEl.value = hex;
        this.updatePaletteActiveStyles(paletteEl, hex);
      };

      textEl.addEventListener('blur', applyText);
      textEl.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') { e.preventDefault(); applyText(); textEl.blur(); }
        if (e.key === 'Escape') { textEl.blur(); }
      });
    }

    // Format badge button → cycle HEX → RGB → HSL
    if (fmtEl) {
      fmtEl.addEventListener('click', () => {
        const cur = CYCLE.indexOf(getFmt());
        const next = CYCLE[(cur + 1) % CYCLE.length];
        setFmt(next);
        fmtEl.textContent = next.toUpperCase();
        // Re-display current color in new format
        if (textEl) {
          const current = textEl.value.trim() || '';
          if (current && current !== 'transparent') {
            textEl.value = convertColor(current, next);
          }
        }
      });
    }
  }

  setupStyleListeners() {
    // Wire up multi-format stroke color channel
    this._setupColorChannel({
      customEl: this.strokeCustom,
      textEl:   this.strokeText,
      fmtEl:    this.strokeFmt,
      getFmt:   () => this.strokeColorFmt,
      setFmt:   (f) => { this.strokeColorFmt = f; },
      styleKey: 'stroke',
      paletteEl: this.strokePalette,
    });

    // Wire up multi-format fill color channel
    this._setupColorChannel({
      customEl: this.fillCustom,
      textEl:   this.fillText,
      fmtEl:    this.fillFmt,
      getFmt:   () => this.fillColorFmt,
      setFmt:   (f) => { this.fillColorFmt = f; },
      styleKey: 'fill',
      paletteEl: this.fillPalette,
    });

    // Button click groups
    const bindGroupClick = (group, styleKey) => {
      if (!group) return;
      Array.from(group.querySelectorAll('button')).forEach(btn => {
        btn.addEventListener('click', () => {
          const val = btn.getAttribute('data-val');
          // Parse width as number, style as string
          const parsedVal = isNaN(Number(val)) ? val : Number(val);
          styleManager.updateStyles({ [styleKey]: parsedVal });
          this.syncGroupButtonsActive(group, parsedVal);
        });
      });
    };

    bindGroupClick(this.strokeWidthGroup, 'strokeWidth');
    bindGroupClick(this.strokeStyleGroup, 'strokeStyle');
    bindGroupClick(this.fillStyleGroup,   'fillStyle');

    // Smoothing controls
    if (this.toggleERDP) {
      this.toggleERDP.addEventListener('change', (e) => {
        const mode = e.target.checked ? 'erdp' : 'standard';
        styleManager.updateStyles({ smoothingMode: mode });
      });
    }

    if (this.sliderSmoothing) {
      this.sliderSmoothing.addEventListener('input', (e) => {
        const val = Number(e.target.value);
        if (this.valSmoothing) {
          this.valSmoothing.textContent = `${val}%`;
        }
        styleManager.updateStyles({ smoothingTension: val / 100 });
      });
    }
  }

  setupTypographyListeners() {
    if (this.inpFontSize) {
      this.inpFontSize.addEventListener('change', (e) => {
        styleManager.updateStyles({ fontSize: Number(e.target.value) });
      });
    }
    if (this.inpFontFamily) {
      this.inpFontFamily.addEventListener('change', (e) => {
        styleManager.updateStyles({ fontFamily: e.target.value });
      });
    }

    // Text align button group
    if (this.textAlignGroup) {
      Array.from(this.textAlignGroup.querySelectorAll('button')).forEach(btn => {
        btn.addEventListener('click', () => {
          const align = btn.getAttribute('data-val');
          styleManager.updateStyles({ align });
          this.syncGroupButtonsActive(this.textAlignGroup, align);
        });
      });
    }
  }
}
