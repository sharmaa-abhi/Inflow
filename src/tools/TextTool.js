import { BaseTool } from './BaseTool';
import { TextShape } from '../shapes/TextShape';
import { resolveFontFamilyName, preloadFont } from '../utils/fontUtils';
import { eventBus } from '../core/EventBus';
import { historyManager } from '../managers/HistoryManager';

export class TextTool extends BaseTool {
  /**
   * @param {CanvasEngine} canvasEngine 
   * @param {ShapeManager} shapeManager 
   * @param {StyleManager} styleManager 
   */
  constructor(canvasEngine, shapeManager, styleManager) {
    super(canvasEngine);
    this.shapeManager = shapeManager;
    this.styleManager = styleManager;
    this.editingTextarea = null;
    this.activeEditingShape = null;
    this.isNewShape = false;
    this.viewportListener = null;
  }

  onPointerDown(data) {
    // If already active editing, finalize it first
    if (this.editingTextarea) {
      this.finalizeEditing();
      return;
    }

    const { canvasPos, event } = data;
    
    // Check if user clicked on an existing text shape
    const clickedNode = event.target;
    let existingShape = null;

    if (clickedNode) {
      let shapeId = clickedNode.id();
      let parent = clickedNode;
      while (parent && !shapeId) {
        parent = parent.getParent();
        if (parent) shapeId = parent.id();
      }
      if (shapeId) {
        const found = this.shapeManager.getShapeById(shapeId);
        if (found && found.type === 'text') {
          existingShape = found;
        }
      }
    }

    if (existingShape) {
      this.startEditing(existingShape, false);
    } else {
      // Create new text shape at exact canvas position
      const activeStyle = this.styleManager.getActiveStyles();
      const fontSize = activeStyle.fontSize || 24;
      const fontFamily = activeStyle.fontFamily || 'Architects Daughter';
      const color = activeStyle.stroke || '#1e293b';
      const textAlign = activeStyle.align || 'left';

      const newTextShape = new TextShape({
        x: canvasPos.x,
        y: canvasPos.y,
        text: '',
        fontSize,
        fontFamily,
        color,
        strokeColor: color,
        textAlign,
        width: 160,
        height: 32,
      });
      
      this.shapeManager.addShape(newTextShape);
      this.canvasEngine.shapeLayer.add(newTextShape.konvaNode);
      this.startEditing(newTextShape, true);
    }
  }

  /**
   * Activates floating inline editing mode for a TextShape.
   * @param {TextShape} textShape - Text shape to edit
   * @param {boolean} isNew - True if shape was just created
   */
  startEditing(textShape, isNew) {
    if (this.editingTextarea) {
      this.finalizeEditing();
    }

    this.activeEditingShape = textShape;
    this.isNewShape = isNew;

    const node = textShape.konvaNode;
    
    // Temporarily hide canvas text node while floating editor is active
    node.visible(false);
    this.canvasEngine.shapeLayer.batchDraw();

    // Create floating textarea overlay
    const textarea = document.createElement('textarea');
    this.editingTextarea = textarea;
    textarea.className = 'canvas-textarea';
    textarea.value = isNew ? '' : textShape.text;
    textarea.wrap = 'off';
    
    // Smooth outline focus styling, transparent background, no borders, no scrollbars
    textarea.style.position = 'fixed';
    textarea.style.background = 'transparent';
    textarea.style.border = 'none';
    textarea.style.outline = '1.5px dashed #6366f1';
    textarea.style.borderRadius = '3px';
    textarea.style.boxShadow = '0 0 0 2px rgba(99, 102, 241, 0.15)';
    textarea.style.padding = '2px 4px';
    textarea.style.margin = '0';
    textarea.style.resize = 'none';
    textarea.style.overflow = 'hidden';
    textarea.style.whiteSpace = 'pre';
    textarea.style.lineHeight = '1.25';
    textarea.style.zIndex = '1000';
    textarea.style.boxSizing = 'border-box';

    document.body.appendChild(textarea);

    // Initial position & scale syncing
    this.syncOverlayPosition();

    // Focus & select text
    setTimeout(() => {
      textarea.focus();
      if (!isNew && textarea.value) {
        textarea.select();
      }
    }, 10);

    // Dynamic auto-resizing function as user types
    const autoResize = () => {
      if (!this.editingTextarea || !this.activeEditingShape) return;
      const stage = this.canvasEngine.stage;
      const zoom = stage.scaleX();
      const currentFontSize = this.activeEditingShape.fontSize || 24;
      const fontName = resolveFontFamilyName(this.activeEditingShape.fontFamily || 'Architects Daughter');
      
      // Calculate text dimensions using offscreen canvas 2d measurement
      const canvas = autoResize.canvas || (autoResize.canvas = document.createElement('canvas'));
      const ctx = canvas.getContext('2d');
      ctx.font = `${currentFontSize * zoom}px ${fontName}`;
      
      const lines = textarea.value.split('\n');
      let maxLineWidth = 0;
      for (const line of lines) {
        const metrics = ctx.measureText(line || ' ');
        if (metrics.width > maxLineWidth) {
          maxLineWidth = metrics.width;
        }
      }

      const scaledFontSize = currentFontSize * zoom;
      const lineH = scaledFontSize * 1.25;
      const contentHeight = Math.max(lineH + 8, lines.length * lineH + 8);
      const contentWidth = Math.max(120 * zoom, maxLineWidth + 16);

      textarea.style.width = `${contentWidth}px`;
      textarea.style.height = `${contentHeight}px`;

      // Update shape geometry width/height in canvas units
      this.activeEditingShape.width = contentWidth / zoom;
      this.activeEditingShape.height = contentHeight / zoom;
    };

    textarea.addEventListener('input', autoResize);
    autoResize();

    // Position syncing subscription on viewport changes (pan & zoom)
    this.viewportListener = () => {
      if (this.editingTextarea) {
        this.syncOverlayPosition();
        autoResize();
      }
    };
    eventBus.on('viewport-changed', this.viewportListener);

    // Notify TextFormattingToolbar
    eventBus.emit('text-editing-started', {
      textShape,
      textarea,
    });

    // Handle blur finalization
    const onBlur = () => {
      // Delay finalization slightly in case user clicked formatting toolbar button
      setTimeout(() => {
        const active = document.activeElement;
        const formattingToolbar = document.getElementById('text-formatting-toolbar');
        if (formattingToolbar && formattingToolbar.contains(active)) {
          textarea.focus();
          return;
        }
        this.finalizeEditing();
      }, 100);
    };

    textarea.addEventListener('blur', onBlur);

    // Keydown handlers
    textarea.addEventListener('keydown', (e) => {
      // Prevent keyboard shortcuts from triggering global app shortcuts
      e.stopPropagation();

      // Ctrl + Enter or Cmd + Enter commits changes
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        textarea.blur();
      }
      
      // Escape cancels changes
      if (e.key === 'Escape') {
        e.preventDefault();
        if (this.isNewShape) {
          textarea.value = '';
        } else {
          textarea.value = textShape.text;
        }
        textarea.blur();
      }
    });
  }

  /**
   * Recalculates floating textarea position and styling relative to canvas stage pan/zoom.
   */
  syncOverlayPosition() {
    if (!this.editingTextarea || !this.activeEditingShape || !this.canvasEngine) return;

    const textarea = this.editingTextarea;
    const textShape = this.activeEditingShape;
    const stage = this.canvasEngine.stage;
    const zoom = stage.scaleX();
    const stagePos = stage.position();

    // Canvas coordinates -> Screen position
    const screenX = textShape.x * zoom + stagePos.x;
    const screenY = textShape.y * zoom + stagePos.y;

    const fontName = resolveFontFamilyName(textShape.fontFamily || 'Architects Daughter');
    const scaledFontSize = textShape.fontSize * zoom;
    const color = textShape.color || textShape.strokeColor || '#1e293b';
    const align = textShape.textAlign || 'left';

    textarea.style.left = `${screenX}px`;
    textarea.style.top = `${screenY}px`;
    textarea.style.fontSize = `${scaledFontSize}px`;
    textarea.style.fontFamily = fontName;
    textarea.style.color = color;
    textarea.style.textAlign = align;
  }

  finalizeEditing() {
    if (!this.editingTextarea || !this.activeEditingShape) return;

    const textarea = this.editingTextarea;
    const textShape = this.activeEditingShape;
    const text = textarea.value;

    // Unsubscribe viewport listener
    if (this.viewportListener) {
      eventBus.off('viewport-changed', this.viewportListener);
      this.viewportListener = null;
    }

    // Remove textarea from DOM
    textarea.remove();
    this.editingTextarea = null;
    this.activeEditingShape = null;

    const node = textShape.konvaNode;
    node.visible(true);

    eventBus.emit('text-editing-ended');

    if (text.trim() === '') {
      // If text is empty, delete shape from canvas
      this.shapeManager.removeShape(textShape.id);
      this.canvasEngine.shapeLayer.batchDraw();
    } else {
      const oldText = textShape.text;
      
      // Update text shape contents
      textShape.updateGeometry({
        text,
        width: textShape.width,
        height: textShape.height,
      });

      this.canvasEngine.shapeLayer.batchDraw();

      if (this.isNewShape) {
        // Register new shape in undo history
        const shape = textShape;
        historyManager.registerChange({
          type: 'add',
          shapeId: shape.id,
          shapeData: shape.serialize(),
          undo: () => {
            this.shapeManager.removeShape(shape.id);
            shape.destroy();
            this.canvasEngine.shapeLayer.batchDraw();
          },
          redo: () => {
            const reCreated = this.shapeManager.recreateShape(shape.serialize());
            this.canvasEngine.shapeLayer.add(reCreated.konvaNode);
            this.canvasEngine.shapeLayer.batchDraw();
          }
        });
        eventBus.emit('shapes-updated');
      } else if (oldText !== text) {
        // Register modification in undo history
        const shape = textShape;
        const oldGeom = { text: oldText };
        const newGeom = { text };
        
        historyManager.registerChange({
          type: 'geometry-change',
          shapeId: shape.id,
          oldGeom,
          newGeom,
          undo: () => {
            shape.updateGeometry(oldGeom);
            this.canvasEngine.shapeLayer.batchDraw();
            eventBus.emit('shapes-updated');
          },
          redo: () => {
            shape.updateGeometry(newGeom);
            this.canvasEngine.shapeLayer.batchDraw();
            eventBus.emit('shapes-updated');
          }
        });
        eventBus.emit('shapes-updated');
      }
    }

    this.canvasEngine.batchDrawAll();
    
    // Switch back to select tool after text creation completes
    if (this.isNewShape) {
      eventBus.emit('tool-action-completed');
    }
  }

  deactivate() {
    super.deactivate();
    if (this.editingTextarea) {
      this.finalizeEditing();
    }
  }
}
