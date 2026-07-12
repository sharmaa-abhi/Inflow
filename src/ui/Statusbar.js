import { eventBus } from '../core/EventBus';

export class Statusbar {
  /**
   * @param {CanvasEngine} canvasEngine - Reference to the CanvasEngine instance.
   */
  constructor(canvasEngine) {
    this.canvasEngine = canvasEngine;

    // Cache DOM Elements
    this.coordDisplay = document.getElementById('coord-display');
    this.zoomDisplay = document.getElementById('zoom-display');
    this.btnZoomIn = document.getElementById('btn-zoom-in');
    this.btnZoomOut = document.getElementById('btn-zoom-out');
    this.btnZoomReset = document.getElementById('btn-zoom-reset');
    this.gridSelect = document.getElementById('grid-select');

    this.initEventListeners();
    this.subscribeEvents();
  }

  initEventListeners() {
    // Zoom Actions
    if (this.btnZoomIn) {
      this.btnZoomIn.addEventListener('click', () => {
        this.canvasEngine.zoomIn();
      });
    }

    if (this.btnZoomOut) {
      this.btnZoomOut.addEventListener('click', () => {
        this.canvasEngine.zoomOut();
      });
    }

    if (this.btnZoomReset) {
      this.btnZoomReset.addEventListener('click', () => {
        this.canvasEngine.zoomReset();
      });
    }

    // Grid selector
    if (this.gridSelect) {
      this.gridSelect.addEventListener('change', (e) => {
        this.canvasEngine.setGridType(e.target.value);
      });
    }
  }

  subscribeEvents() {
    // Coordinate display updates
    eventBus.on('pointer-moved', ({ canvasPos }) => {
      if (this.coordDisplay) {
        const x = Math.round(canvasPos.x);
        const y = Math.round(canvasPos.y);
        this.coordDisplay.textContent = `${x}, ${y} px`;
      }
    });

    // Zoom scale updates
    eventBus.on('viewport-changed', ({ zoom }) => {
      if (this.zoomDisplay) {
        const percentage = Math.round(zoom * 100);
        this.zoomDisplay.textContent = `${percentage}%`;
      }
    });

    // Synchronize initial grid state
    eventBus.on('grid-changed', (type) => {
      if (this.gridSelect && this.gridSelect.value !== type) {
        this.gridSelect.value = type;
      }
    });
  }
}
