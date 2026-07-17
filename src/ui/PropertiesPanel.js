import { eventBus } from '../core/EventBus';
import { shapeManager } from '../managers/ShapeManager';
import { styleManager } from '../managers/StyleManager';
import { toolManager } from '../managers/ToolManager';
import { threeDPreviewManager } from '../managers/ThreeDPreviewManager';

export class PropertiesPanel {
  constructor() {
    this.panel = document.getElementById('properties-panel');
    this.btnClose = document.getElementById('btn-close-properties');

    // Geometry Inputs
    this.inpWidth = document.getElementById('prop-width');
    this.inpHeight = document.getElementById('prop-height');
    this.inpRotation = document.getElementById('prop-rotation');
    this.inpOpacity = document.getElementById('prop-opacity');

    // Palettes & Custom Pickers
    this.strokePalette = document.getElementById('prop-stroke-palette');
    this.strokeCustom = document.getElementById('prop-stroke-custom');
    this.fillPalette = document.getElementById('prop-fill-palette');
    this.fillCustom = document.getElementById('prop-fill-custom');

    // Button Groups
    this.strokeWidthGroup = document.getElementById('prop-stroke-width-group');
    this.strokeStyleGroup = document.getElementById('prop-stroke-style-group');
    
    // Typography
    this.sectionText = document.getElementById('prop-section-text');
    this.inpFontSize = document.getElementById('prop-font-size');
    this.inpFontFamily = document.getElementById('prop-font-family');
    this.textAlignGroup = document.getElementById('prop-text-align');

    // Arrange Buttons
    this.btnSendBack = document.getElementById('btn-send-back');
    this.btnSendBackward = document.getElementById('btn-send-backward');
    this.btnBringForward = document.getElementById('btn-bring-forward');
    this.btnBringFront = document.getElementById('btn-bring-front');

    // Z-Index Numeric Input and 3D Toggle
    this.inpZIndex = document.getElementById('prop-zindex');
    this.lblZIndexMax = document.getElementById('prop-zindex-max');
    this.btnToggle3D = document.getElementById('btn-toggle-3d');

    this.colors = [
      '#3b82f6', // Primary/Neutral Blue
      '#60a5fa', // Secondary Light Blue
      '#93c5fd', // Tertiary Pale Blue
      '#fed7aa', // Start/Trigger Orange
      '#a7f3d0', // End/Success Green
      '#fee2e2', // Warning/Reset Light Red
      '#fef3c7', // Decision Light Yellow
      '#ddd6fe', // AI/LLM Pale Purple
      '#dbeafe', // Inactive/Disabled
      '#fecaca', // Error Light Pink
    ];

    this.selectedShapes = [];
    this.init();
  }

  init() {
    if (!this.panel) return;

    // Build palettes dynamically
    this.buildColorPalette(this.strokePalette, 'stroke', false);
    this.buildColorPalette(this.fillPalette, 'fill', true);

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

    // Rebuild palettes on theme change to swap default colors
    eventBus.on('theme-changed', () => {
      this.buildColorPalette(this.strokePalette, 'stroke', false);
      this.buildColorPalette(this.fillPalette, 'fill', true);
      this.syncStyleInputs();
    });
  }

  buildColorPalette(container, styleKey, includeTransparent = false) {
    if (!container) return;
    container.innerHTML = '';

    const isDark = document.body.classList.contains('dark');
    // Swap the default dark slate with white in the palette depending on theme
    const paletteColors = this.colors.map(c => {
      if (isDark && c === '#1e293b') return '#ffffff';
      return c;
    });

    const colors = includeTransparent ? ['transparent', ...paletteColors] : paletteColors;

    colors.forEach(color => {
      const btn = document.createElement('button');
      btn.className = 'w-6 h-6 rounded-full border border-slate-300 transition-transform hover:scale-110 focus:outline-none';
      
      if (color === 'transparent') {
        // Transparent checkerboard representation
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

    if (this.strokeCustom) this.strokeCustom.value = style.stroke.startsWith('#') ? style.stroke : '#1e293b';
    if (this.fillCustom) this.fillCustom.value = style.fill.startsWith('#') ? style.fill : '#ffffff';

    // Button groups active states
    this.syncGroupButtonsActive(this.strokeWidthGroup, style.strokeWidth);
    this.syncGroupButtonsActive(this.strokeStyleGroup, style.strokeStyle);

    // Text style sync
    if (primary.type === 'text') {
      if (this.inpFontSize) this.inpFontSize.value = style.fontSize || 20;
      if (this.inpFontFamily) this.inpFontFamily.value = style.fontFamily || 'Inter';
      this.syncGroupButtonsActive(this.textAlignGroup, style.align || 'left');
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

  setupStyleListeners() {
    // Custom color pickers
    if (this.strokeCustom) {
      this.strokeCustom.addEventListener('input', (e) => {
        styleManager.updateStyles({ stroke: e.target.value });
      });
    }
    if (this.fillCustom) {
      this.fillCustom.addEventListener('input', (e) => {
        styleManager.updateStyles({ fill: e.target.value });
      });
    }

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
