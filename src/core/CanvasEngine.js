import Konva from 'konva';
import { eventBus } from './EventBus';

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

    this.gridType = 'dot-grid'; // 'plain', 'dot-grid', 'square-grid'
    this.isPanning = false;
    this.lastPointerPos = { x: 0, y: 0 };
    this.isSpacePressed = false;

    this.initStage();
    this.initLayers();
    this.initGrid();
    this.setupEventListeners();
    this.handleResize();
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

        const isDark = document.body.classList.contains('dark');
        const gridColor = isDark ? '#1a1a1a' : '#e2e8f0'; // very subtle dark line / slate-200
        const dotColor = isDark ? '#333333' : '#cbd5e1';  // subtle dark dot / slate-300

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
    if (['plain', 'dot-grid', 'square-grid'].includes(type)) {
      this.gridType = type;
      this.backgroundLayer.batchDraw();
      eventBus.emit('grid-changed', type);
    }
  }

  setupEventListeners() {
    window.addEventListener('resize', () => this.handleResize());

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
    // Check if user is typing in a textarea
    return document.activeElement && document.activeElement.tagName === 'TEXTAREA';
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
    const stage = this.stage;
    const oldScale = stage.scaleX();
    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    // Determine zoom scale factor
    // Supports standard wheel zoom (mostly pans or small zooms) and Ctrl + Wheel zoom
    let zoomAmount = this.zoomFactor;
    if (e.evt.deltaY > 0) {
      zoomAmount = 1 / this.zoomFactor;
    }

    let newScale = oldScale * zoomAmount;
    newScale = Math.max(this.minZoom, Math.min(this.maxZoom, newScale));

    // Scale stage around the pointer position
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
  }

  zoomIn() {
    this.zoomToCenter(this.zoomFactor);
  }

  zoomOut() {
    this.zoomToCenter(1 / this.zoomFactor);
  }

  zoomReset() {
    this.stage.scale({ x: 1, y: 1 });
    this.stage.position({ x: 0, y: 0 });
    this.stage.batchDraw();
    this.emitViewportChanged();
  }

  zoomToCenter(factor) {
    const stage = this.stage;
    const oldScale = stage.scaleX();
    const center = {
      x: stage.width() / 2,
      y: stage.height() / 2,
    };

    let newScale = oldScale * factor;
    newScale = Math.max(this.minZoom, Math.min(this.maxZoom, newScale));

    const mousePointTo = {
      x: (center.x - stage.x()) / oldScale,
      y: (center.y - stage.y()) / oldScale,
    };

    stage.scale({ x: newScale, y: newScale });
    
    const newPos = {
      x: center.x - mousePointTo.x * newScale,
      y: center.y - mousePointTo.y * newScale,
    };
    stage.position(newPos);
    stage.batchDraw();

    this.emitViewportChanged();
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
