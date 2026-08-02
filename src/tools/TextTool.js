import { BaseTool } from './BaseTool';
import { TextShape } from '../shapes/TextShape';
import { resolveFontFamily, resolveFontEntry, DEFAULT_FONT_SIZE, DEFAULT_FONT_FAMILY_ID, getNextFontSize, getPrevFontSize } from '../utils/fontUtils';
import { eventBus } from '../core/EventBus';
import { historyManager } from '../managers/HistoryManager';

/**
 * TextTool — Excalidraw-style inline text editing.
 *
 * Behavior:
 *  - Press T or click Text in toolbar → activates tool
 *  - Click on canvas → creates new text, opens inline editor
 *  - Click on existing text → opens inline editor with content
 *  - Enter → commits text (finishes editing)
 *  - Ctrl+Enter / Shift+Enter → inserts newline
 *  - Escape → cancels editing (reverts to original)
 *  - Ctrl+B / Ctrl+I / Ctrl+U → toggle bold/italic/underline
 *  - Ctrl+Shift+> / Ctrl+Shift+< → increase/decrease font size
 *  - Live preview updates canvas as you type
 *  - Auto-resizing textarea (no scrollbars)
 *  - Pixel-perfect font syncing between textarea and canvas
 */
export class TextTool extends BaseTool {
  constructor(canvasEngine, shapeManager, styleManager) {
    super(canvasEngine);
    this.shapeManager = shapeManager;
    this.styleManager = styleManager;

    // Editing state
    this.editingTextarea = null;
    this.activeEditingShape = null;
    this.isNewShape = false;
    this.originalText = '';
    this.originalGeometry = null;

    // Viewport sync
    this.viewportListener = null;

    // Measurement canvas (shared, lazy-created)
    this._measureCanvas = null;
    this._measureCtx = null;
  }

  // ─── Pointer Handler ──────────────────────────────────────────────────

  onPointerDown(data) {
    // If already editing, commit current and don't start new
    if (this.editingTextarea) {
      this.commitEditing();
      return;
    }

    const { canvasPos, event } = data;

    // Check if clicked on an existing text shape
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
      this.createNewText(canvasPos);
    }
  }

  // ─── Create New Text ──────────────────────────────────────────────────

  createNewText(canvasPos) {
    const activeStyle = this.styleManager.getActiveStyles();
    const fontSize = activeStyle.fontSize || DEFAULT_FONT_SIZE;
    const fontFamily = activeStyle.fontFamily || DEFAULT_FONT_FAMILY_ID;
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
      fontWeight: 400,
      fontStyle: 'normal',
      textDecoration: 'none',
      autoWidth: true,
    });

    this.shapeManager.addShape(newTextShape);
    this.canvasEngine.shapeLayer.add(newTextShape.konvaNode);
    this.startEditing(newTextShape, true);
  }

  // ─── Start Editing ────────────────────────────────────────────────────

  /**
   * Opens the floating textarea overlay for inline editing.
   * @param {TextShape} textShape
   * @param {boolean} isNew
   */
  startEditing(textShape, isNew) {
    if (this.editingTextarea) {
      this.commitEditing();
    }

    this.activeEditingShape = textShape;
    this.isNewShape = isNew;
    this.originalText = textShape.text;
    this.originalGeometry = textShape.getGeometry();

    const node = textShape.konvaNode;

    // Hide canvas text while editing
    node.visible(false);
    this.canvasEngine.shapeLayer.batchDraw();

    // Create textarea
    const textarea = document.createElement('textarea');
    this.editingTextarea = textarea;
    textarea.className = 'text-editor-overlay';
    textarea.value = isNew ? '' : textShape.text;
    textarea.placeholder = 'Double-click or press Enter to edit text';
    textarea.spellcheck = false;
    textarea.autocomplete = 'off';

    // Core inline styles (CSS class handles most styling)
    textarea.style.position = 'fixed';
    textarea.style.zIndex = '1000';
    textarea.style.resize = 'none';
    textarea.style.overflow = 'hidden';
    textarea.style.boxSizing = 'border-box';

    document.body.appendChild(textarea);

    // Sync position + font styles
    this.syncOverlayPosition();
    this.syncOverlayStyles();

    // Auto-focus immediately
    textarea.focus();
    if (!isNew && textarea.value) {
      // Place cursor at end
      textarea.selectionStart = textarea.value.length;
      textarea.selectionEnd = textarea.value.length;
    }

    // ─── Input handler: live preview + auto-resize ────────────────────
    this._onInput = () => {
      if (!this.editingTextarea || !this.activeEditingShape) return;
      this.autoResize();

      // Live preview: update canvas text in real-time
      const text = this.editingTextarea.value;
      this.activeEditingShape.text = text;
      this.activeEditingShape.konvaNode.text(text || ' ');
    };
    textarea.addEventListener('input', this._onInput);
    this.autoResize();

    // ─── Viewport sync (pan/zoom) ────────────────────────────────────
    this.viewportListener = () => {
      if (this.editingTextarea) {
        this.syncOverlayPosition();
        this.syncOverlayStyles();
        this.autoResize();
      }
    };
    eventBus.on('viewport-changed', this.viewportListener);

    // ─── Notify toolbar ──────────────────────────────────────────────
    eventBus.emit('text-editing-started', { textShape, textarea });

    // ─── Blur handler ────────────────────────────────────────────────
    this._onBlur = (e) => {
      // Delay to allow toolbar click detection
      setTimeout(() => {
        const active = document.activeElement;
        const toolbar = document.getElementById('text-formatting-toolbar');
        if (toolbar && (toolbar.contains(active) || toolbar.contains(e.relatedTarget))) {
          // Clicked on toolbar — re-focus textarea
          if (this.editingTextarea) this.editingTextarea.focus();
          return;
        }
        if (this.editingTextarea === textarea) {
          this.commitEditing();
        }
      }, 100);
    };
    textarea.addEventListener('blur', this._onBlur);

    // ─── Keydown handler ─────────────────────────────────────────────
    this._onKeydown = (e) => {
      // Prevent global shortcuts from firing
      e.stopPropagation();

      // Enter → commit (finish editing)
      if (e.key === 'Enter' && !e.ctrlKey && !e.metaKey && !e.shiftKey) {
        e.preventDefault();
        this.commitEditing();
        return;
      }

      // Ctrl+Enter or Shift+Enter → insert newline
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey || e.shiftKey)) {
        e.preventDefault();
        const ta = this.editingTextarea;
        const start = ta.selectionStart;
        const end = ta.selectionEnd;
        const val = ta.value;
        ta.value = val.substring(0, start) + '\n' + val.substring(end);
        ta.selectionStart = ta.selectionEnd = start + 1;

        // Trigger input event for live preview
        ta.dispatchEvent(new Event('input', { bubbles: true }));
        return;
      }

      // Escape → cancel
      if (e.key === 'Escape') {
        e.preventDefault();
        this.cancelEditing();
        return;
      }

      // Ctrl+B → toggle bold
      if (e.key.toLowerCase() === 'b' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        const shape = this.activeEditingShape;
        const newWeight = shape.fontWeight >= 700 ? 400 : 700;
        shape.updateStyle({ fontWeight: newWeight });
        this.syncOverlayStyles();
        this.autoResize();
        eventBus.emit('text-style-changed', { fontWeight: newWeight });
        return;
      }

      // Ctrl+I → toggle italic
      if (e.key.toLowerCase() === 'i' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        const shape = this.activeEditingShape;
        const newStyle = shape.fontStyle === 'italic' ? 'normal' : 'italic';
        shape.updateStyle({ fontStyle: newStyle });
        this.syncOverlayStyles();
        this.autoResize();
        eventBus.emit('text-style-changed', { fontStyle: newStyle });
        return;
      }

      // Ctrl+U → toggle underline
      if (e.key.toLowerCase() === 'u' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        const shape = this.activeEditingShape;
        const newDeco = shape.textDecoration === 'underline' ? 'none' : 'underline';
        shape.updateStyle({ textDecoration: newDeco });
        this.syncOverlayStyles();
        eventBus.emit('text-style-changed', { textDecoration: newDeco });
        return;
      }

      // Ctrl+Shift+> -> Increase font size
      if ((e.key === '>' || e.key === '.') && (e.ctrlKey || e.metaKey) && e.shiftKey) {
        e.preventDefault();
        const shape = this.activeEditingShape;
        const newSize = getNextFontSize(shape.fontSize);
        shape.updateStyle({ fontSize: newSize });
        this.syncOverlayStyles();
        this.autoResize();
        eventBus.emit('text-style-changed', { fontSize: newSize });
        return;
      }

      // Ctrl+Shift+< -> Decrease font size
      if ((e.key === '<' || e.key === ',') && (e.ctrlKey || e.metaKey) && e.shiftKey) {
        e.preventDefault();
        const shape = this.activeEditingShape;
        const newSize = getPrevFontSize(shape.fontSize);
        shape.updateStyle({ fontSize: newSize });
        this.syncOverlayStyles();
        this.autoResize();
        eventBus.emit('text-style-changed', { fontSize: newSize });
        return;
      }
    };
    textarea.addEventListener('keydown', this._onKeydown);
  }

  // ─── Overlay Position Sync ────────────────────────────────────────────

  syncOverlayPosition() {
    if (!this.editingTextarea || !this.activeEditingShape || !this.canvasEngine) return;

    const textarea = this.editingTextarea;
    const shape = this.activeEditingShape;
    const stage = this.canvasEngine.stage;
    const zoom = stage.scaleX();
    const stagePos = stage.position();

    // Canvas → screen coordinates
    const screenX = shape.x * zoom + stagePos.x;
    const screenY = shape.y * zoom + stagePos.y;

    textarea.style.left = `${screenX}px`;
    textarea.style.top = `${screenY}px`;
  }

  // ─── Overlay Style Sync ───────────────────────────────────────────────

  syncOverlayStyles() {
    if (!this.editingTextarea || !this.activeEditingShape) return;

    const textarea = this.editingTextarea;
    const shape = this.activeEditingShape;
    const zoom = this.canvasEngine.stage.scaleX();

    const fontFamilyCSS = resolveFontFamily(shape.fontFamily);
    const scaledFontSize = shape.fontSize * zoom;

    textarea.style.fontFamily = fontFamilyCSS;
    textarea.style.fontSize = `${scaledFontSize}px`;
    textarea.style.color = shape.color || '#1e293b';
    textarea.style.textAlign = shape.textAlign || 'left';
    textarea.style.lineHeight = String(shape.lineHeight || 1.35);
    textarea.style.fontWeight = String(shape.fontWeight || 400);
    textarea.style.fontStyle = shape.fontStyle || 'normal';
    textarea.style.letterSpacing = shape.letterSpacing ? `${shape.letterSpacing * zoom}px` : '0px';
    textarea.style.wordSpacing = shape.wordSpacing ? `${shape.wordSpacing * zoom}px` : '0px';

    // Underline
    if (shape.textDecoration === 'underline') {
      textarea.style.textDecoration = 'underline';
    } else if (shape.textDecoration === 'line-through') {
      textarea.style.textDecoration = 'line-through';
    } else {
      textarea.style.textDecoration = 'none';
    }
  }

  // ─── Auto-Resize ─────────────────────────────────────────────────────

  autoResize() {
    if (!this.editingTextarea || !this.activeEditingShape) return;

    const textarea = this.editingTextarea;
    const shape = this.activeEditingShape;
    const zoom = this.canvasEngine.stage.scaleX();
    const scaledFontSize = shape.fontSize * zoom;

    // Measure using offscreen canvas
    if (!this._measureCanvas) {
      this._measureCanvas = document.createElement('canvas');
      this._measureCtx = this._measureCanvas.getContext('2d');
    }
    const ctx = this._measureCtx;
    const fontFamilyCSS = resolveFontFamily(shape.fontFamily);

    const weightStr = shape.fontWeight >= 700 ? 'bold' : (shape.fontWeight !== 400 ? String(shape.fontWeight) : '');
    const italicStr = shape.fontStyle === 'italic' ? 'italic' : '';
    ctx.font = `${italicStr} ${weightStr} ${scaledFontSize}px ${fontFamilyCSS}`.trim();

    if (shape.letterSpacing) {
      try { ctx.letterSpacing = `${shape.letterSpacing * zoom}px`; } catch(e) {}
    }

    const text = textarea.value || textarea.placeholder || ' ';
    const lines = text.split('\n');
    let maxLineWidth = 0;
    for (const line of lines) {
      const m = ctx.measureText(line || ' ');
      if (m.width > maxLineWidth) maxLineWidth = m.width;
    }

    const lineH = scaledFontSize * (shape.lineHeight || 1.35);
    const contentHeight = Math.max(lineH + 8, lines.length * lineH + 8);
    const contentWidth = Math.max(80 * zoom, maxLineWidth + 24);

    textarea.style.width = `${contentWidth}px`;
    textarea.style.height = `${contentHeight}px`;

    // Update shape dimensions in canvas units
    shape.width = contentWidth / zoom;
    shape.height = contentHeight / zoom;
  }

  // ─── Commit Editing ───────────────────────────────────────────────────

  commitEditing() {
    if (!this.editingTextarea || !this.activeEditingShape) return;

    const textarea = this.editingTextarea;
    const textShape = this.activeEditingShape;
    const text = textarea.value;

    // Cleanup
    this._cleanup();

    const node = textShape.konvaNode;
    node.visible(true);

    eventBus.emit('text-editing-ended');

    if (text.trim() === '') {
      // Empty text → delete shape
      this.shapeManager.removeShape(textShape.id);
      this.canvasEngine.shapeLayer.batchDraw();

      if (!this.isNewShape) {
        // Undo: restore the deleted shape
        const serialized = { ...this.originalGeometry, id: textShape.id, type: 'text', text: this.originalText };
        historyManager.registerChange({
          type: 'delete',
          shapeId: textShape.id,
          undo: () => {
            const restored = this.shapeManager.recreateShape(serialized);
            if (restored) {
              this.canvasEngine.shapeLayer.add(restored.konvaNode);
              this.canvasEngine.shapeLayer.batchDraw();
            }
          },
          redo: () => {
            this.shapeManager.removeShape(textShape.id);
            this.canvasEngine.shapeLayer.batchDraw();
          },
        });
      }
    } else {
      // Apply final text
      textShape.updateGeometry({
        text,
        width: textShape.width,
        height: textShape.height,
      });

      this.canvasEngine.shapeLayer.batchDraw();

      if (this.isNewShape) {
        // Undo: remove the new shape
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
          },
        });
        eventBus.emit('shapes-updated');
      } else if (this.originalText !== text) {
        // Undo: restore previous text
        const shape = textShape;
        const oldGeom = { text: this.originalText };
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
          },
        });
        eventBus.emit('shapes-updated');
      }
    }

    this.canvasEngine.batchDrawAll();

    // Switch to select after new text creation
    if (this.isNewShape) {
      eventBus.emit('tool-action-completed');
    }
  }

  // ─── Cancel Editing ───────────────────────────────────────────────────

  cancelEditing() {
    if (!this.editingTextarea || !this.activeEditingShape) return;

    const textShape = this.activeEditingShape;

    this._cleanup();

    // Restore original state
    textShape.konvaNode.visible(true);
    eventBus.emit('text-editing-ended');

    if (this.isNewShape) {
      // Cancel new → delete the empty shape
      this.shapeManager.removeShape(textShape.id);
    } else {
      // Revert to original text
      textShape.updateGeometry({ text: this.originalText });
    }

    this.canvasEngine.batchDrawAll();

    if (this.isNewShape) {
      eventBus.emit('tool-action-completed');
    }
  }

  // ─── Cleanup Helpers ──────────────────────────────────────────────────

  _cleanup() {
    // Remove event listeners
    if (this.viewportListener) {
      eventBus.off('viewport-changed', this.viewportListener);
      this.viewportListener = null;
    }

    // Remove textarea
    if (this.editingTextarea) {
      this.editingTextarea.removeEventListener('input', this._onInput);
      this.editingTextarea.removeEventListener('blur', this._onBlur);
      this.editingTextarea.removeEventListener('keydown', this._onKeydown);
      this.editingTextarea.remove();
    }

    this.editingTextarea = null;
    this.activeEditingShape = null;
  }

  // ─── Tool Lifecycle ───────────────────────────────────────────────────

  deactivate() {
    super.deactivate();
    if (this.editingTextarea) {
      this.commitEditing();
    }
  }
}
