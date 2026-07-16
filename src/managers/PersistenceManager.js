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
      if (!raw) {
        // No saved state! Load the default architecture diagram
        this.loadDefaultArchitecture();
        return;
      }
      
      const data = JSON.parse(raw);
      this.importSceneData(data);
    } catch (err) {
      console.error('Error loading saved session:', err);
    }
  }

  /**
   * Fetches and loads the default InkFlow architecture diagram.
   */
  loadDefaultArchitecture() {
    fetch('/InkFlow-Architecture.excalidraw')
      .then(response => {
        if (!response.ok) throw new Error('Failed to fetch default architecture diagram');
        return response.json();
      })
      .then(data => {
        this.importSceneData(data);
        historyManager.clear();
      })
      .catch(err => {
        console.error('Error loading default architecture diagram:', err);
      });
  }

  /**
   * Translates Excalidraw JSON structure into InkFlow shapes representation.
   * @param {Object} excalidrawObj 
   * @returns {Object} InkFlow scene data
   */
  convertExcalidrawToInkFlow(excalidrawObj) {
    const shapes = [];

    (excalidrawObj.elements || []).forEach(el => {
      if (!el.type) return;

      const angle = el.angle || 0;
      const rotation = angle * (180 / Math.PI); // Convert radians to degrees

      const strokeStyle = el.strokeStyle || 'solid';
      const strokeWidth = el.strokeWidth || 2;
      const strokeColor = el.strokeColor || '#1e293b';
      const fillColor = el.backgroundColor === 'transparent' ? 'transparent' : (el.backgroundColor || 'transparent');
      const opacity = el.opacity !== undefined ? el.opacity / 100 : 1;

      const style = {
        stroke: strokeColor,
        fill: fillColor,
        strokeWidth: strokeWidth,
        strokeStyle: strokeStyle,
        opacity: opacity
      };

      let shapeData = null;

      if (el.type === 'rectangle') {
        shapeData = {
          id: el.id || `rect-${Date.now()}-${Math.random()}`,
          type: 'rectangle',
          x: el.x,
          y: el.y,
          width: el.width,
          height: el.height,
          rotation: rotation,
          style: style
        };
        shapes.push(shapeData);
      } else if (el.type === 'ellipse') {
        shapeData = {
          id: el.id || `ellipse-${Date.now()}-${Math.random()}`,
          type: 'circle',
          x: el.x + el.width / 2,
          y: el.y + el.height / 2,
          width: el.width,
          height: el.height,
          rotation: rotation,
          style: style
        };
        shapes.push(shapeData);
      } else if (el.type === 'diamond') {
        shapeData = {
          id: el.id || `diamond-${Date.now()}-${Math.random()}`,
          type: 'diamond',
          x: el.x,
          y: el.y,
          width: el.width,
          height: el.height,
          rotation: rotation,
          style: style
        };
        shapes.push(shapeData);
      } else if (el.type === 'line' || el.type === 'arrow') {
        const type = el.type === 'arrow' ? 'arrow' : 'line';
        let width = el.width || 0;
        let height = el.height || 0;
        
        if (el.points && el.points.length >= 2) {
          width = el.points[1][0] - el.points[0][0];
          height = el.points[1][1] - el.points[0][1];
        }

        shapeData = {
          id: el.id || `line-${Date.now()}-${Math.random()}`,
          type: type,
          x: el.x,
          y: el.y,
          width: width,
          height: height,
          rotation: rotation,
          style: style
        };
        shapes.push(shapeData);
      } else if (el.type === 'text') {
        let fontFamily = 'Inter, sans-serif';
        if (el.fontFamily === 3) {
          fontFamily = "'Architects Daughter', cursive";
        } else if (el.fontFamily === 2) {
          fontFamily = 'Georgia, serif';
        } else if (typeof el.fontFamily === 'string') {
          fontFamily = el.fontFamily;
        }

        const textStyle = {
          ...style,
          fontSize: el.fontSize || 20,
          fontFamily: fontFamily,
          textAlign: el.textAlign || 'left'
        };

        shapeData = {
          id: el.id || `text-${Date.now()}-${Math.random()}`,
          type: 'text',
          x: el.x,
          y: el.y,
          width: el.width,
          height: el.height,
          rotation: rotation,
          text: el.text || '',
          style: textStyle
        };
        shapes.push(shapeData);
      }

      // If the shape has text inside it (for container shapes in Excalidraw)
      if (el.type !== 'text' && el.text && el.text.trim()) {
        let fontFamily = 'Inter, sans-serif';
        if (el.fontFamily === 3) {
          fontFamily = "'Architects Daughter', cursive";
        } else if (el.fontFamily === 2) {
          fontFamily = 'Georgia, serif';
        }

        const lines = el.text.split('\n');
        const fontSize = el.fontSize || 14;
        const textHeight = lines.length * fontSize * 1.25;
        const textY = el.y + (el.height - textHeight) / 2;

        const containerTextStyle = {
          stroke: strokeColor,
          fill: 'transparent',
          strokeWidth: 1,
          strokeStyle: 'solid',
          opacity: opacity,
          fontSize: fontSize,
          fontFamily: fontFamily,
          textAlign: el.textAlign || 'center'
        };

        shapes.push({
          id: `${el.id || Date.now()}-text`,
          type: 'text',
          x: el.x + 5,
          y: textY,
          width: el.width - 10,
          height: textHeight,
          rotation: rotation,
          text: el.text,
          style: containerTextStyle
        });
      }
    });

    return {
      version: '1.0.0',
      app: 'InkFlow',
      background: {
        type: 'dot-grid'
      },
      viewport: {
        x: 0,
        y: 0,
        zoom: 1
      },
      shapes: shapes
    };
  }

  /**
   * Clears the board and imports the given scene data.
   * @param {Object} data 
   */
  importSceneData(data) {
    if (!data) return;

    // Detect Excalidraw formats and convert them
    if (data.type === 'excalidraw' || (data.elements && Array.isArray(data.elements))) {
      data = this.convertExcalidrawToInkFlow(data);
    }

    if (!data || data.app !== 'InkFlow') {
      alert('Invalid InkFlow or Excalidraw document format.');
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
