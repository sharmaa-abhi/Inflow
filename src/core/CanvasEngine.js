import Konva from 'konva';
import { eventBus } from './EventBus';
import { getWatercolorPaperPattern } from '../utils/watercolorPaper';

export class CanvasEngine {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    if (!this.container) {
      throw new Error(`Canvas container #${containerId} not found.`);
    }

    // Config defaults
    this.minZoom = 0.1;
    this.maxZoom = 20;
    this.zoomFactor = 1.1;
    this.gridSpacing = 30; // base spacing in px
    this.ZOOM_PRESETS = [0.1, 0.25, 0.5, 0.75, 1.0, 1.25, 1.5, 2.0, 3.0, 5.0, 10.0, 20.0];
    this.animFrameId = null;
    this.shapeManager = null;

    this.gridType = 'watercolor-paper'; // 'plain', 'dot-grid', 'square-grid', 'watercolor-paper'
    this.isPanning = false;
    this.lastPointerPos = { x: 0, y: 0 };
    this.isSpacePressed = false;
    this.isDark = document.body.classList.contains('dark');

    this.initStage();
    this.initLayers();
    this.initGrid();
    this.setupEventListeners();
    this.handleResize();
  }

  setShapeManager(shapeManager) {
    this.shapeManager = shapeManager;
  }

  initStage() {
    this.stage = new Konva.Stage({
      container: this.container,
      width: this.container.clientWidth || window.innerWidth,
      height: this.container.clientHeight || window.innerHeight,
      draggable: false, // Managed manually via space-panning
    });
  }

  initLayers() {
    // 6-Layer Rendering Architecture
    this.backgroundLayer = new Konva.Layer({ id: 'background' });
    this.shapeLayer = new Konva.Layer({ id: 'shapes' });
    this.penLayer = new Konva.Layer({ id: 'pen' });
    this.textLayer = new Konva.Layer({ id: 'text' });
    this.selectionLayer = new Konva.Layer({ id: 'selection' });
    this.overlayLayer = new Konva.Layer({ id: 'overlay' });

    // Add all layers in order
    this.stage.add(this.backgroundLayer);
    this.stage.add(this.shapeLayer);
    this.stage.add(this.penLayer);
    this.stage.add(this.textLayer);
    this.stage.add(this.selectionLayer);
    this.stage.add(this.overlayLayer);
  }

  initGrid() {
    const engine = this;
    
    // Custom grid shape that calculates visible area and renders dynamically
    this.gridShape = new Konva.Shape({
      x: 0,
      y: 0,
      listening: false, // Grid shouldn't block pointer events
      sceneFunc(context, shape) {
        const stage = engine.stage;
        const scale = stage.scaleX();
        const x = stage.x();
        const y = stage.y();
        const width = stage.width();
        const height = stage.height();

        // Canvas transform context
        const ctx = context._context;
        ctx.save();
        
        // Reset scale/translation for drawing screen-aligned grid
        ctx.setTransform(1, 0, 0, 1, 0, 0);

        const type = engine.gridType;
        if (type === 'plain') {
          ctx.restore();
          return;
        }

        if (type === 'watercolor-paper') {
          const pattern = getWatercolorPaperPattern(ctx);
          if (pattern) {
            ctx.fillStyle = pattern;
            ctx.fillRect(0, 0, width, height);
          }
          ctx.restore();
          return;
        }

        const isDark = engine.isDark;
        const gridColor = isDark ? 'rgba(255, 255, 255, 0.08)' : '#e2e8f0';
        const dotColor = isDark ? 'rgba(255, 255, 255, 0.22)' : '#cbd5e1';

        const spacing = engine.gridSpacing * scale;
        const offsetX = x % spacing;
        const offsetY = y % spacing;

        ctx.strokeStyle = gridColor;
        ctx.lineWidth = 1;

        if (type === 'dot-grid') {
          ctx.fillStyle = dotColor;
          const dotRadius = 1;
          for (let gx = offsetX; gx < width; gx += spacing) {
            for (let gy = offsetY; gy < height; gy += spacing) {
              ctx.beginPath();
              ctx.arc(gx, gy, dotRadius * Math.min(2, Math.max(0.6, scale)), 0, Math.PI * 2);
              ctx.fill();
            }
          }
        } else if (type === 'square-grid') {
          // Draw vertical lines
          ctx.beginPath();
          for (let gx = offsetX; gx < width; gx += spacing) {
            ctx.moveTo(gx, 0);
            ctx.lineTo(gx, height);
          }
          // Draw horizontal lines
          for (let gy = offsetY; gy < height; gy += spacing) {
            ctx.moveTo(0, gy);
            ctx.lineTo(width, gy);
          }
          ctx.stroke();
        }

        ctx.restore();
      }
    });

    this.backgroundLayer.add(this.gridShape);
    this.backgroundLayer.batchDraw();
  }

  setGridType(type) {
    if (['plain', 'dot-grid', 'square-grid', 'watercolor-paper'].includes(type)) {
      this.gridType = type;
      this.backgroundLayer.batchDraw();
      eventBus.emit('grid-changed', type);
    }
  }

  setupEventListeners() {
    window.addEventListener('resize', () => this.handleResize());

    eventBus.on('theme-changed', (theme) => {
      this.isDark = (theme === 'dark');
      this.backgroundLayer.batchDraw();
    });

    // Mouse wheel zoom
    this.stage.on('wheel', (e) => this.handleWheelZoom(e));

    // Handle stage level pointer events
    this.stage.on('mousedown touchstart', (e) => this.handlePointerDown(e));
    this.stage.on('mousemove touchmove', (e) => this.handlePointerMove(e));
    this.stage.on('mouseup touchend', (e) => this.handlePointerUp(e));

    // Keyboard handlers for panning (Space key)
    window.addEventListener('keydown', (e) => {
      if (e.code === 'Space' && !this.isEditingText()) {
        e.preventDefault();
        this.isSpacePressed = true;
        this.updateCursor();
      }
    });

    window.addEventListener('keyup', (e) => {
      if (e.code === 'Space') {
        this.isSpacePressed = false;
        this.updateCursor();
      }
    });
  }

  isEditingText() {
    // Check if user is typing in a text input, textarea, or contentEditable element
    if (!document.activeElement) return false;
    const tag = document.activeElement.tagName;
    return tag === 'TEXTAREA' || tag === 'INPUT' || document.activeElement.isContentEditable;
  }

  handleResize() {
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;
    this.stage.width(width);
    this.stage.height(height);
    this.stage.batchDraw();
    eventBus.emit('stage-resized', { width, height });
  }

  updateCursor() {
    if (this.isSpacePressed) {
      this.stage.container().style.cursor = this.isPanning ? 'grabbing' : 'grab';
    } else {
      this.stage.container().style.cursor = 'default';
    }
  }

  /**
   * Translates screen position to coordinates in canvas/world space.
   * @param {{x: number, y: number}} screenPos 
   * @returns {{x: number, y: number}} Canvas coords
   */
  getCanvasCoords(screenPos) {
    const stage = this.stage;
    return {
      x: (screenPos.x - stage.x()) / stage.scaleX(),
      y: (screenPos.y - stage.y()) / stage.scaleY(),
    };
  }

  /**
   * Translates canvas position to coordinates in screen space.
   * @param {{x: number, y: number}} canvasPos
   * @returns {{x: number, y: number}} Screen coords
   */
  getScreenCoords(canvasPos) {
    const stage = this.stage;
    return {
      x: canvasPos.x * stage.scaleX() + stage.x(),
      y: canvasPos.y * stage.scaleY() + stage.y(),
    };
  }

  /**
   * Retrieves active pointer position in canvas space.
   * @returns {{x: number, y: number}} Pointer coords
   */
  getPointerCanvasCoords() {
    const pos = this.stage.getPointerPosition();
    if (!pos) return { x: 0, y: 0 };
    return this.getCanvasCoords(pos);
  }

  handlePointerDown(e) {
    // Check if middle click or space key drag is active for panning
    const isMiddleButton = e.evt && e.evt.button === 1;
    
    if (this.isSpacePressed || isMiddleButton) {
      e.evt?.preventDefault();
      this.isPanning = true;
      const pointer = this.stage.getPointerPosition();
      if (pointer) {
        this.lastPointerPos = { ...pointer };
      }
      this.updateCursor();
    } else {
      // Forward standard interaction downwards
      const pos = this.getPointerCanvasCoords();
      eventBus.emit('pointer-down', {
        event: e,
        canvasPos: pos,
        screenPos: this.stage.getPointerPosition() || { x: 0, y: 0 }
      });
    }
  }

  handlePointerMove(e) {
    const pointer = this.stage.getPointerPosition();
    if (!pointer) return;

    if (this.isPanning) {
      e.evt?.preventDefault();
      const dx = pointer.x - this.lastPointerPos.x;
      const dy = pointer.y - this.lastPointerPos.y;

      this.stage.x(this.stage.x() + dx);
      this.stage.y(this.stage.y() + dy);
      
      this.lastPointerPos = { ...pointer };
      this.stage.batchDraw();
      
      this.emitViewportChanged();
    } else {
      const pos = this.getCanvasCoords(pointer);
      
      // Update coordinates display
      eventBus.emit('pointer-moved', {
        canvasPos: pos,
        screenPos: pointer
      });
      
      eventBus.emit('pointer-move', {
        event: e,
        canvasPos: pos,
        screenPos: pointer
      });
    }
  }

  handlePointerUp(e) {
    if (this.isPanning) {
      this.isPanning = false;
      this.updateCursor();
    } else {
      const pos = this.getPointerCanvasCoords();
      eventBus.emit('pointer-up', {
        event: e,
        canvasPos: pos,
        screenPos: this.stage.getPointerPosition() || { x: 0, y: 0 }
      });
    }
  }

  handleWheelZoom(e) {
    e.evt.preventDefault();
    const evt = e.evt;
    const stage = this.stage;

    // Ctrl + Wheel (or Pinch trackpad gesture) -> Exponential continuous Zoom
    if (evt.ctrlKey || evt.metaKey) {
      const oldScale = stage.scaleX();
      const pointer = stage.getPointerPosition() || { x: stage.width() / 2, y: stage.height() / 2 };

      // Continuous exponential factor: Math.exp(-deltaY * SENSITIVITY)
      const SENSITIVITY = 0.0015;
      const zoomFactor = Math.exp(-evt.deltaY * SENSITIVITY);

      let newScale = oldScale * zoomFactor;
      newScale = Math.max(this.minZoom, Math.min(this.maxZoom, newScale));

      const mousePointTo = {
        x: (pointer.x - stage.x()) / oldScale,
        y: (pointer.y - stage.y()) / oldScale,
      };

      stage.scale({ x: newScale, y: newScale });

      const newPos = {
        x: pointer.x - mousePointTo.x * newScale,
        y: pointer.y - mousePointTo.y * newScale,
      };
      stage.position(newPos);
      stage.batchDraw();

      this.emitViewportChanged();
      return;
    }

    // Shift + Wheel -> Horizontal Scroll / Pan
    if (evt.shiftKey) {
      const dx = evt.deltaY || evt.deltaX;
      stage.x(stage.x() - dx);
      stage.batchDraw();
      this.emitViewportChanged();
      return;
    }

    // Standard Mouse Wheel -> Vertical Scroll / Pan
    const dy = evt.deltaY;
    stage.y(stage.y() - dy);
    stage.batchDraw();
    this.emitViewportChanged();
  }

  getNextZoomIn(currentScale) {
    const next = this.ZOOM_PRESETS.find(p => p > currentScale + 0.005);
    return next ? next : Math.min(this.maxZoom, currentScale * 1.25);
  }

  getNextZoomOut(currentScale) {
    const prev = [...this.ZOOM_PRESETS].reverse().find(p => p < currentScale - 0.005);
    return prev ? prev : Math.max(this.minZoom, currentScale / 1.25);
  }

  getSmartZoomAnchor() {
    // 1. If active selection exists, anchor to selection centroid
    const selectedShapes = this.shapeManager?.getSelectedShapes?.() || [];
    if (selectedShapes.length > 0) {
      const bbox = this.getShapesBoundingBox(selectedShapes);
      if (bbox) {
        return this.getScreenCoords({ x: bbox.x + bbox.width / 2, y: bbox.y + bbox.height / 2 });
      }
    }

    // 2. If pointer inside stage boundaries, anchor to pointer
    const pointer = this.stage.getPointerPosition();
    if (pointer && pointer.x >= 0 && pointer.x <= this.stage.width() && pointer.y >= 0 && pointer.y <= this.stage.height()) {
      return pointer;
    }

    // 3. Fallback to stage center
    return { x: this.stage.width() / 2, y: this.stage.height() / 2 };
  }

  zoomIn() {
    const targetScale = this.getNextZoomIn(this.stage.scaleX());
    const anchor = this.getSmartZoomAnchor();
    this.zoomToPointAnimated(targetScale, anchor);
  }

  zoomOut() {
    const targetScale = this.getNextZoomOut(this.stage.scaleX());
    const anchor = this.getSmartZoomAnchor();
    this.zoomToPointAnimated(targetScale, anchor);
  }

  zoomReset() {
    this.animateViewportTo(1.0, 0, 0);
  }

  zoomToCenter(factor) {
    const targetScale = Math.max(this.minZoom, Math.min(this.maxZoom, this.stage.scaleX() * factor));
    const center = { x: this.stage.width() / 2, y: this.stage.height() / 2 };
    this.zoomToPointAnimated(targetScale, center);
  }

  zoomToPointAnimated(targetScale, screenAnchor, durationMs = 180) {
    const stage = this.stage;
    const startScale = stage.scaleX();
    const startPos = stage.position();
    const clampedScale = Math.max(this.minZoom, Math.min(this.maxZoom, targetScale));

    const mousePointTo = {
      x: (screenAnchor.x - startPos.x) / startScale,
      y: (screenAnchor.y - startPos.y) / startScale,
    };

    const targetPos = {
      x: screenAnchor.x - mousePointTo.x * clampedScale,
      y: screenAnchor.y - mousePointTo.y * clampedScale,
    };

    this.animateViewportTo(clampedScale, targetPos.x, targetPos.y, durationMs);
  }

  animateViewportTo(targetScale, targetX, targetY, durationMs = 180) {
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }

    const stage = this.stage;
    const startScale = stage.scaleX();
    const startX = stage.x();
    const startY = stage.y();
    const startTime = performance.now();

    const animate = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / durationMs);
      // Cubic ease-out curve for natural inertia: 1 - (1 - t)^3
      const ease = 1 - Math.pow(1 - progress, 3);

      const curScale = startScale + (targetScale - startScale) * ease;
      const curX = startX + (targetX - startX) * ease;
      const curY = startY + (targetY - startY) * ease;

      stage.scale({ x: curScale, y: curScale });
      stage.position({ x: curX, y: curY });
      stage.batchDraw();
      this.emitViewportChanged();

      if (progress < 1) {
        this.animFrameId = requestAnimationFrame(animate);
      } else {
        this.animFrameId = null;
      }
    };

    this.animFrameId = requestAnimationFrame(animate);
  }

  getShapesBoundingBox(shapes) {
    if (!shapes || shapes.length === 0) return null;
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

    shapes.forEach(shape => {
      if (typeof shape.x === 'number' && typeof shape.y === 'number' && typeof shape.width === 'number' && typeof shape.height === 'number') {
        minX = Math.min(minX, shape.x);
        minY = Math.min(minY, shape.y);
        maxX = Math.max(maxX, shape.x + shape.width);
        maxY = Math.max(maxY, shape.y + shape.height);
      } else if (shape.konvaNode) {
        const rect = shape.konvaNode.getClientRect();
        const canvasMin = this.getCanvasCoords({ x: rect.x, y: rect.y });
        const canvasMax = this.getCanvasCoords({ x: rect.x + rect.width, y: rect.y + rect.height });
        minX = Math.min(minX, canvasMin.x);
        minY = Math.min(minY, canvasMin.y);
        maxX = Math.max(maxX, canvasMax.x);
        maxY = Math.max(maxY, canvasMax.y);
      }
    });

    if (!isFinite(minX) || !isFinite(minY) || !isFinite(maxX) || !isFinite(maxY)) return null;
    return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
  }

  zoomToFit(shapes = null, padding = 60) {
    const targetShapes = shapes || this.shapeManager?.getAllShapes?.() || [];
    if (!targetShapes || targetShapes.length === 0) {
      this.zoomReset();
      return;
    }

    const bbox = this.getShapesBoundingBox(targetShapes);
    if (!bbox || bbox.width <= 0 || bbox.height <= 0) {
      this.zoomReset();
      return;
    }

    const stageWidth = this.stage.width();
    const stageHeight = this.stage.height();

    const scaleX = (stageWidth - padding * 2) / bbox.width;
    const scaleY = (stageHeight - padding * 2) / bbox.height;
    let targetScale = Math.min(scaleX, scaleY);
    targetScale = Math.max(this.minZoom, Math.min(this.maxZoom, targetScale));

    const bboxCenter = { x: bbox.x + bbox.width / 2, y: bbox.y + bbox.height / 2 };
    const targetX = stageWidth / 2 - bboxCenter.x * targetScale;
    const targetY = stageHeight / 2 - bboxCenter.y * targetScale;

    this.animateViewportTo(targetScale, targetX, targetY);
  }

  zoomToSelection(padding = 60) {
    const selectedShapes = this.shapeManager?.getSelectedShapes?.() || [];
    if (selectedShapes.length > 0) {
      this.zoomToFit(selectedShapes, padding);
    }
  }

  emitViewportChanged() {
    eventBus.emit('viewport-changed', {
      x: this.stage.x(),
      y: this.stage.y(),
      zoom: this.stage.scaleX(),
    });
  }

  batchDrawAll() {
    this.backgroundLayer.batchDraw();
    this.shapeLayer.batchDraw();
    this.penLayer.batchDraw();
    this.textLayer.batchDraw();
    this.selectionLayer.batchDraw();
    this.overlayLayer.batchDraw();
  }
}
