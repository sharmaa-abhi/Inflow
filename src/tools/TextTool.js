import { BaseTool } from './BaseTool';
import { TextShape } from '../shapes/TextShape';
import { eventBus } from '../core/EventBus';

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
  }

  onPointerDown(data) {
    // If already editing, don't trigger another one
    if (this.editingTextarea) return;

    const { canvasPos, event } = data;
    
    // Check if clicked on an existing text shape
    const clickedNode = event.target;
    let existingShape = null;

    if (clickedNode && clickedNode.className === 'Text') {
      const shapeId = clickedNode.id();
      existingShape = this.shapeManager.getShapeById(shapeId);
    }

    if (existingShape) {
      this.startEditing(existingShape, false);
    } else {
      // Create new text shape
      const style = { ...this.styleManager.activeStyle };
      const newTextShape = new TextShape({
        x: canvasPos.x,
        y: canvasPos.y,
        text: '',
        style,
        width: 150, // default width
      });
      
      this.shapeManager.addShape(newTextShape, false);
      this.canvasEngine.shapeLayer.add(newTextShape.konvaNode);
      this.startEditing(newTextShape, true);
    }
  }

  /**
   * Activates inline editing mode for a TextShape.
   * @param {TextShape} textShape - Text shape to edit
   * @param {boolean} isNew - True if the shape was just created
   */
  startEditing(textShape, isNew) {
    this.activeEditingShape = textShape;
    this.isNewShape = isNew;

    const node = textShape.konvaNode;
    
    // Temporarily hide the canvas text node while typing
    node.visible(false);
    this.canvasEngine.shapeLayer.batchDraw();

    // Get viewport details for styling the textarea overlay
    const stage = this.canvasEngine.stage;
    const scale = stage.scaleX();
    const stagePos = stage.position();

    // Translate text canvas coordinate to screen pixels
    const screenX = node.x() * scale + stagePos.x;
    const screenY = node.y() * scale + stagePos.y;
    
    // Width and height in screen space
    const width = node.width() * scale;
    const height = node.height() * scale;
    
    const fontSize = textShape.style.fontSize * scale;
    const fontFamily = textShape.style.fontFamily;
    const color = textShape.style.stroke;
    const align = textShape.style.textAlign || 'left';
    const rotation = node.rotation();

    // Create textarea
    const textarea = document.createElement('textarea');
    this.editingTextarea = textarea;
    textarea.className = 'canvas-textarea';
    textarea.value = isNew ? '' : textShape.text;
    
    // Style the textarea to match the text shape appearance and position exactly
    textarea.style.position = 'absolute';
    textarea.style.left = `${screenX}px`;
    textarea.style.top = `${screenY}px`;
    textarea.style.width = `${Math.max(120, width)}px`;
    textarea.style.height = `${Math.max(30, height)}px`;
    textarea.style.fontSize = `${fontSize}px`;
    textarea.style.fontFamily = fontFamily;
    textarea.style.color = color;
    textarea.style.textAlign = align;
    textarea.style.transform = `rotate(${rotation}deg)`;
    textarea.style.transformOrigin = 'left top';

    // Append to body overlay
    document.body.appendChild(textarea);
    textarea.focus();
    if (!isNew) {
      textarea.select();
    }

    // Auto resize textarea during typing
    const autoResize = () => {
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    };
    textarea.addEventListener('input', autoResize);
    autoResize();

    // Handle editing finalization
    const finalize = () => {
      this.finalizeEditing();
    };

    textarea.addEventListener('blur', finalize);

    // Stop propagation of keystrokes so they don't trigger global shortcuts (like 'V' or 'R')
    textarea.addEventListener('keydown', (e) => {
      e.stopPropagation();

      // Enter key ends editing ONLY if Ctrl/Cmd is held down, otherwise it adds a newline
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        textarea.blur();
      }
      
      // Escape key aborts editing
      if (e.key === 'Escape') {
        if (this.isNewShape) {
          textarea.value = ''; // Will delete the shape
        } else {
          textarea.value = textShape.text; // Restore old text
        }
        textarea.blur();
      }
    });
  }

  finalizeEditing() {
    if (!this.editingTextarea || !this.activeEditingShape) return;

    const textarea = this.editingTextarea;
    const textShape = this.activeEditingShape;
    const text = textarea.value.trim();

    // Remove textarea from DOM
    textarea.remove();
    this.editingTextarea = null;
    this.activeEditingShape = null;

    const node = textShape.konvaNode;
    node.visible(true);

    if (text === '') {
      // Delete shape if empty
      this.shapeManager.removeShape(textShape.id);
    } else {
      const oldText = textShape.text;
      
      // Update text shape contents
      textShape.updateGeometry({ text });

      // Automatically recalculate node height based on wrapped text length
      const scale = this.canvasEngine.stage.scaleX();
      // Wait, Konva Text computes its own height. Let's make sure it updates layout.
      node.height(node.getTextHeight());

      this.canvasEngine.shapeLayer.batchDraw();

      if (this.isNewShape) {
        // Save to history as a new shape
        eventBus.emit('shape-created-history', textShape);
      } else if (oldText !== text) {
        // Save to history as geometry text modification
        eventBus.emit('geometry-changed-history', {
          shapeId: textShape.id,
          oldGeom: { text: oldText },
          newGeom: { text },
        });
      }
    }

    this.canvasEngine.batchDrawAll();
  }

  deactivate() {
    super.deactivate();
    if (this.editingTextarea) {
      this.finalizeEditing();
    }
  }
}
