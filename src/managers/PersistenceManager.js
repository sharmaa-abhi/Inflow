import { eventBus } from '../core/EventBus';
import { debounce } from '../utils/helpers';
import { shapeManager } from './ShapeManager';
import { styleManager } from './StyleManager';
import { historyManager } from './HistoryManager';
import { PenShape } from '../shapes/PenShape';
import { TextShape } from '../shapes/TextShape';

class PersistenceManager {
  constructor() {
    this.canvasEngine = null;
    this.storageKey = 'inkflow_scene_state';
    
    // Debounce save operation to avoid lag during fast drawing/updates
    this.autosave = debounce(() => this.saveScene(), 500);
  }

  /**
   * Initializes the manager with the CanvasEngine instance.
   * @param {CanvasEngine} canvasEngine 
   */
  init(canvasEngine) {
    this.canvasEngine = canvasEngine;

    this.initEventListeners();
    this.subscribeEvents();

    // Load saved scene on startup
    setTimeout(() => this.loadScene(), 50);
  }

  serializeScene() {
    if (!this.canvasEngine) return null;
    
    const stage = this.canvasEngine.stage;
    const shapesData = shapeManager.getAllShapes().map((shape) => shape.serialize());

    return {
      version: '1.0.0',
      app: 'InkFlow',
      background: {
        type: this.canvasEngine.gridType,
      },
      viewport: {
        x: stage.x(),
        y: stage.y(),
        zoom: stage.scaleX(),
      },
      shapes: shapesData,
    };
  }

  saveScene() {
    try {
      const data = this.serializeScene();
      if (data) {
        localStorage.setItem(this.storageKey, JSON.stringify(data));
      }
    } catch (err) {
      console.error('Autosave error:', err);
    }
  }

  loadScene() {
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (!raw) return;
      
      const data = JSON.parse(raw);
      this.importSceneData(data);
    } catch (err) {
      console.error('Error loading saved session:', err);
    }
  }

  /**
   * Clears the board and imports the given scene data.
   * @param {Object} data 
   */
  importSceneData(data) {
    if (!data || data.app !== 'InkFlow') {
      alert('Invalid InkFlow document format.');
      return;
    }

    // 1. Clear current canvas
    shapeManager.clear();

    // 2. Restore background grid selection
    if (data.background && data.background.type) {
      this.canvasEngine.setGridType(data.background.type);
    }

    // 3. Restore viewport positioning and zoom
    if (data.viewport) {
      this.canvasEngine.stage.scale({ x: data.viewport.zoom, y: data.viewport.zoom });
      this.canvasEngine.stage.position({ x: data.viewport.x, y: data.viewport.y });
    }

    // 4. Restore shape instances
    if (data.shapes && Array.isArray(data.shapes)) {
      data.shapes.forEach((sData) => {
        const shapeInstance = shapeManager.recreateShape(sData);
        if (shapeInstance) {
          this.canvasEngine.shapeLayer.add(shapeInstance.konvaNode);
        }
      });
    }

    this.canvasEngine.batchDrawAll();
    
    // Notify application that viewport details changed to update Statusbar
    this.canvasEngine.emitViewportChanged();
  }

  exportJSON() {
    const data = this.serializeScene();
    if (!data) return;
    
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `inkflow-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 0);
  }

  importJSON(file) {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.value || event.target.result);
        this.importSceneData(data);
        historyManager.clear();
      } catch (err) {
        alert('Failed to parse JSON file.');
        console.error(err);
      }
    };
    reader.readAsText(file);
  }

  exportPNG() {
    if (!this.canvasEngine) return;
    
    // 1. Capture current visibility states
    const overlayLayer = this.canvasEngine.overlayLayer;
    const selectionLayer = this.canvasEngine.selectionLayer;
    const gridShape = this.canvasEngine.gridShape;

    const wasOverlayVisible = overlayLayer.visible();
    const wasSelectionVisible = selectionLayer.visible();
    const wasGridVisible = gridShape.visible();

    // 2. Hide visual guide overlays and grids for a clean export
    overlayLayer.visible(false);
    selectionLayer.visible(false);
    gridShape.visible(false);

    this.canvasEngine.batchDrawAll();

    // 3. Export stage canvas at 2x retina density
    const dataURL = this.canvasEngine.stage.toDataURL({
      pixelRatio: 2,
      mimeType: 'image/png',
    });

    // 4. Restore visibility states
    overlayLayer.visible(wasOverlayVisible);
    selectionLayer.visible(wasSelectionVisible);
    gridShape.visible(wasGridVisible);

    this.canvasEngine.batchDrawAll();

    // 5. Trigger download file dialog
    const a = document.createElement('a');
    a.href = dataURL;
    a.download = `inkflow-board-${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();

    setTimeout(() => {
      document.body.removeChild(a);
    }, 0);
  }

  initEventListeners() {
    // Shortcuts: Ctrl+S to Export JSON, Ctrl+Shift+E to Export PNG
    window.addEventListener('keydown', (e) => {
      if (document.activeElement && 
         (document.activeElement.tagName === 'TEXTAREA' || document.activeElement.tagName === 'INPUT')) {
        return;
      }

      const ctrlCmd = e.ctrlKey || e.metaKey;
      const key = e.key.toLowerCase();

      if (ctrlCmd && key === 's') {
        e.preventDefault();
        this.exportJSON();
      }

      if (ctrlCmd && e.shiftKey && key === 'e') {
        e.preventDefault();
        this.exportPNG();
      }
    });
  }

  subscribeEvents() {
    const triggerSave = () => this.autosave();

    eventBus.on('shapes-updated', triggerSave);
    eventBus.on('viewport-changed', triggerSave);
    eventBus.on('grid-changed', triggerSave);
  }
}

export const persistenceManager = new PersistenceManager();
