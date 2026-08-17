import { eventBus } from '../core/EventBus';
import { historyManager } from '../managers/HistoryManager';

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
    this.btnUndo = document.getElementById('btn-undo');
    this.btnRedo = document.getElementById('btn-redo');
    this.btnHelpBottom = document.getElementById('btn-help-bottom');

    this.initEventListeners();
    this.subscribeEvents();
    this.updateHistoryButtons();
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

    if (this.zoomDisplay) {
      this.zoomDisplay.addEventListener('click', () => {
        this.canvasEngine.zoomReset();
      });
    }

    // Undo / Redo Actions
    if (this.btnUndo) {
      this.btnUndo.addEventListener('click', () => {
        historyManager.undo();
      });
    }

    if (this.btnRedo) {
      this.btnRedo.addEventListener('click', () => {
        historyManager.redo();
      });
    }

    // Help Button
    if (this.btnHelpBottom) {
      this.btnHelpBottom.addEventListener('click', () => {
        eventBus.emit('open-shortcuts-modal');
      });
    }
  }

  updateHistoryButtons() {
    if (this.btnUndo) {
      this.btnUndo.disabled = !historyManager.canUndo();
    }
    if (this.btnRedo) {
      this.btnRedo.disabled = !historyManager.canRedo();
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

    // Sync Undo/Redo button states
    eventBus.on('shapes-updated', () => this.updateHistoryButtons());
    eventBus.on('history-changed', () => this.updateHistoryButtons());
  }
}
