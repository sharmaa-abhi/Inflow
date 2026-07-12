import Konva from 'konva';
import { BaseTool } from './BaseTool';
import { eventBus } from '../core/EventBus';
import { rectIntersect, getRotatedBB } from '../utils/math';

export class SelectTool extends BaseTool {
  /**
   * @param {CanvasEngine} canvasEngine 
   * @param {ShapeManager} shapeManager 
   * @param {StyleManager} styleManager 
   */
  constructor(canvasEngine, shapeManager, styleManager) {
    super(canvasEngine);
    this.shapeManager = shapeManager;
    this.styleManager = styleManager;

    this.selectedShapes = [];
    this.isMarqueeSelecting = false;
    this.marqueeStart = { x: 0, y: 0 };
    
    // Create marquee selection rect
    this.marqueeRect = new Konva.Rect({
      stroke: '#3b82f6', // blue-500
      strokeWidth: 1,
      dash: [4, 4],
      fill: 'rgba(59, 130, 246, 0.1)', // blue-500 10% opacity
      visible: false,
      listening: false, // Don't block hits
    });
    this.canvasEngine.overlayLayer.add(this.marqueeRect);

    // Initialize transformer
    this.transformer = new Konva.Transformer({
      id: 'selection-transformer',
      rotateAnchorOffset: 25,
      anchorSize: 8,
      anchorCornerRadius: 2,
      anchorStroke: '#3b82f6',
      anchorFill: '#ffffff',
      borderStroke: '#3b82f6',
      borderStrokeWidth: 1.5,
      padding: 4,
      // Excalidraw-like rotate handle line styling
      rotateLineVisible: true,
    });
    this.canvasEngine.selectionLayer.add(this.transformer);

    this.initTransformerEvents();
  }

  activate() {
    super.activate();
    this.transformer.visible(true);
    this.canvasEngine.selectionLayer.batchDraw();
  }

  deactivate() {
    super.deactivate();
    this.clearSelection();
    this.transformer.visible(false);
    this.canvasEngine.selectionLayer.batchDraw();
  }

  selectShapes(shapes, isToggle = false) {
    let newSelection = [];

    if (isToggle) {
      // Toggle mode (Shift key clicked)
      newSelection = [...this.selectedShapes];
      shapes.forEach((shape) => {
        const idx = newSelection.indexOf(shape);
        if (idx !== -1) {
          newSelection.splice(idx, 1);
        } else {
          newSelection.push(shape);
        }
      });
    } else {
      newSelection = [...shapes];
    }

    this.selectedShapes = newSelection;

    // Attach Konva nodes to transformer
    const nodes = this.selectedShapes.map((shape) => shape.konvaNode);
    this.transformer.nodes(nodes);
    
    this.canvasEngine.selectionLayer.batchDraw();
    eventBus.emit('selection-changed', this.selectedShapes);
  }

  clearSelection() {
    if (this.selectedShapes.length === 0) return;
    this.selectedShapes = [];
    this.transformer.nodes([]);
    this.canvasEngine.selectionLayer.batchDraw();
    eventBus.emit('selection-changed', []);
  }

  onPointerDown(data) {
    const { canvasPos, event } = data;
    const clickedNode = event.target;
    
    // 1. Clicked on stage background (empty space)
    if (clickedNode === this.canvasEngine.stage) {
      this.clearSelection();

      // Start marquee selection drag
      this.isMarqueeSelecting = true;
      this.marqueeStart = { ...canvasPos };
      this.marqueeRect.setAttrs({
        x: this.marqueeStart.x,
        y: this.marqueeStart.y,
        width: 0,
        height: 0,
        visible: true,
      });
      this.canvasEngine.overlayLayer.batchDraw();
      return;
    }

    // 2. Clicked on a Transformer handle
    const isTransformer = clickedNode.getParent() === this.transformer || clickedNode === this.transformer;
    if (isTransformer) {
      return; // Handled by Konva Transformer internally
    }

    // 3. Clicked on a shape node
    let shapeId = clickedNode.id();
    
    // In case the shape has grouped nodes, traverse up to find registered id
    let parent = clickedNode;
    while (parent && !shapeId) {
      parent = parent.getParent();
      if (parent) shapeId = parent.id();
    }

    const clickedShape = this.shapeManager.getShapeById(shapeId);
    if (clickedShape) {
      const isShift = event.evt && event.evt.shiftKey;
      const isAlreadySelected = this.selectedShapes.includes(clickedShape);

      // Handle double click for text editing
      const isDoubleClick = event.evt && event.evt.detail === 2;
      if (isDoubleClick && clickedShape.type === 'text') {
        const textTool = this.canvasEngine.stage.getAttr('toolManager')?.tools.text;
        if (textTool) {
          this.clearSelection();
          textTool.startEditing(clickedShape, false);
          return;
        }
      }

      if (isShift) {
        this.selectShapes([clickedShape], true);
      } else if (!isAlreadySelected) {
        this.selectShapes([clickedShape], false);
      }
    } else {
      this.clearSelection();
    }
  }

  onPointerMove(data) {
    if (!this.isMarqueeSelecting) return;

    const { canvasPos } = data;
    const currentX = canvasPos.x;
    const currentY = canvasPos.y;

    // Calculate selection boundary
    const x = Math.min(this.marqueeStart.x, currentX);
    const y = Math.min(this.marqueeStart.y, currentY);
    const width = Math.abs(currentX - this.marqueeStart.x);
    const height = Math.abs(currentY - this.marqueeStart.y);

    this.marqueeRect.setAttrs({ x, y, width, height });
    this.canvasEngine.overlayLayer.batchDraw();

    // Select shapes within selection rect
    const selectionBox = { x, y, width, height };
    const shapesToSelect = [];

    this.shapeManager.getShapes().forEach((shape) => {
      const geom = shape.getGeometry();
      const rotation = shape.konvaNode.rotation();
      
      // Calculate rotated bounding box bounds
      const bb = getRotatedBB(geom.x, geom.y, geom.width, geom.height, rotation);
      const shapeBox = {
        x: bb.minX,
        y: bb.minY,
        width: bb.maxX - bb.minX,
        height: bb.maxY - bb.minY,
      };

      if (rectIntersect(selectionBox, shapeBox)) {
        shapesToSelect.push(shape);
      }
    });

    this.selectShapes(shapesToSelect, false);
  }

  onPointerUp(data) {
    if (this.isMarqueeSelecting) {
      this.isMarqueeSelecting = false;
      this.marqueeRect.visible(false);
      this.canvasEngine.overlayLayer.batchDraw();
    }
  }

  initTransformerEvents() {
    let oldTransformData = null;

    // Listen to transform start to capture undo state
    this.transformer.on('transformstart', () => {
      oldTransformData = this.selectedShapes.map((shape) => ({
        shapeId: shape.id,
        geometry: shape.getGeometry(),
        rotation: shape.konvaNode.rotation(),
        scaleX: shape.konvaNode.scaleX(),
        scaleY: shape.konvaNode.scaleY(),
      }));
    });

    // Listen to transform end to fire history event
    this.transformer.on('transformend', () => {
      if (!oldTransformData) return;

      const newTransformData = this.selectedShapes.map((shape) => ({
        shapeId: shape.id,
        geometry: shape.getGeometry(),
        rotation: shape.konvaNode.rotation(),
        scaleX: shape.konvaNode.scaleX(),
        scaleY: shape.konvaNode.scaleY(),
      }));

      eventBus.emit('shapes-transformed-history', {
        oldData: oldTransformData,
        newData: newTransformData,
      });

      eventBus.emit('shape-transformed');
      oldTransformData = null;
    });

    // Listen to drag events inside selection (moves nodes)
    this.draggedShapeIds = [];
    this.initialDragPositions = new Map();

    this.canvasEngine.stage.on('dragstart', (e) => {
      const draggedNode = e.target;
      const selectedShapes = this.shapeManager.getSelectedShapes();
      
      this.draggedShapeIds = selectedShapes.map(s => s.id);
      this.initialDragPositions.clear();

      selectedShapes.forEach(shape => {
        this.initialDragPositions.set(shape.id, {
          x: shape.konvaNode.x(),
          y: shape.konvaNode.y()
        });
      });
    });

    this.canvasEngine.stage.on('dragmove', (e) => {
      const draggedNode = e.target;
      const shapeId = draggedNode.id();
      
      if (this.initialDragPositions.has(shapeId)) {
        const initial = this.initialDragPositions.get(shapeId);
        
        // Single shape snapping support
        const selectedShapes = this.shapeManager.getSelectedShapes();
        if (selectedShapes.length === 1) {
          import('../managers/SnapManager').then(({ snapManager }) => {
            snapManager.snap(this.canvasEngine, draggedNode);
          });
        }

        const dx = draggedNode.x() - initial.x;
        const dy = draggedNode.y() - initial.y;

        // Move all other selected nodes by the same delta
        selectedShapes.forEach(shape => {
          if (shape.id !== shapeId) {
            const initPos = this.initialDragPositions.get(shape.id);
            if (initPos) {
              shape.konvaNode.x(initPos.x + dx);
              shape.konvaNode.y(initPos.y + dy);
            }
          }
        });
        this.canvasEngine.shapeLayer.batchDraw();
      }
    });

    this.canvasEngine.stage.on('dragend', (e) => {
      import('../managers/SnapManager').then(({ snapManager }) => {
        snapManager.clearGuides(this.canvasEngine);
      });

      if (this.draggedShapeIds.length === 0) return;

      const newDragData = this.selectedShapes.map((s) => ({
        shapeId: s.id,
        x: s.konvaNode.x(),
        y: s.konvaNode.y(),
      }));

      const oldDragData = Array.from(this.initialDragPositions).map(([id, pos]) => ({
        shapeId: id,
        ...pos
      }));

      // Verify that dragging actually moved shapes before writing to history
      const hasMoved = oldDragData.some((oldVal, idx) => {
        const newVal = newDragData.find(n => n.shapeId === oldVal.shapeId);
        return newVal && (oldVal.x !== newVal.x || oldVal.y !== newVal.y);
      });

      if (hasMoved) {
        eventBus.emit('shapes-dragged-history', {
          oldData: oldDragData,
          newData: newDragData,
        });
      }

      eventBus.emit('shape-transformed'); // Triggers properties panel updates
    });

    // Link PropertiesPanel geometry edits back to shape transformer updates
    eventBus.on('geometry-updated-input', ({ property, value, shapes }) => {
      shapes.forEach((shape) => {
        const node = shape.konvaNode;
        if (property === 'width' || property === 'height') {
          // If shape is scaled, changing base width/height requires updating scale back to 1
          node.scale({ x: 1, y: 1 });
          shape.updateGeometry({ [property]: value });
        } else if (property === 'rotation') {
          node.rotation(value);
        }
      });
      
      this.canvasEngine.batchDrawAll();
      this.transformer.forceUpdate(); // Re-align transformer border box
      this.canvasEngine.selectionLayer.batchDraw();
    });
  }
}
