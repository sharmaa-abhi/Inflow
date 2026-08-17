import { eventBus } from '../core/EventBus';
import { debounce } from '../utils/helpers';
import { shapeManager } from './ShapeManager';
import { styleManager } from './StyleManager';
import { historyManager } from './HistoryManager';
import { PenShape } from '../shapes/PenShape';
import { TextShape } from '../shapes/TextShape';
import { ImageShape } from '../shapes/ImageShape';

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
   * Loads the Physics Textbook illustration & diagram onto the canvas.
   */
  loadPhysicsDiagram() {
    shapeManager.clear();

    const stage = this.canvasEngine.stage;
    const centerX = (stage.width() / 2 - stage.x()) / stage.scaleX();
    const centerY = (stage.height() / 2 - stage.y()) / stage.scaleY();

    const bookShape = new ImageShape({
      id: `physics-book-${Date.now()}`,
      src: '/physics_book.png',
      x: centerX - 320,
      y: centerY - 210,
      width: 340,
      height: 420,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: '#4f46e5'
    });

    const titleShape = new TextShape({
      id: `physics-title-${Date.now()}`,
      x: centerX + 50,
      y: centerY - 180,
      text: 'CONCEPTS OF PHYSICS',
      fontSize: 30,
      fontFamily: 'Inter',
      stroke: '#6366f1'
    });

    const formulaShape = new TextShape({
      id: `physics-formula-${Date.now()}`,
      x: centerX + 50,
      y: centerY - 120,
      text: 'E = m c²',
      fontSize: 38,
      fontFamily: 'Architects Daughter',
      stroke: '#f59e0b'
    });

    const notesShape = new TextShape({
      id: `physics-notes-${Date.now()}`,
      x: centerX + 50,
      y: centerY - 50,
      text: 'Quantum Mechanics & Modern Physics\n\n• Wave-Particle Duality (λ = h/p)\n• Schrödinger Equation: iℏ(∂Ψ/∂t) = ĤΨ\n• Mass-Energy Equivalence\n• Gravitational Lensing & Spacetime Curvature',
      fontSize: 16,
      fontFamily: 'Inter',
      stroke: '#334155'
    });

    this.canvasEngine.shapeLayer.add(bookShape.konvaNode);
    this.canvasEngine.shapeLayer.add(titleShape.konvaNode);
    this.canvasEngine.shapeLayer.add(formulaShape.konvaNode);
    this.canvasEngine.shapeLayer.add(notesShape.konvaNode);

    shapeManager.addShape(bookShape);
    shapeManager.addShape(titleShape);
    shapeManager.addShape(formulaShape);
    shapeManager.addShape(notesShape);

    this.canvasEngine.shapeLayer.draw();
    historyManager.clear();
    this.saveScene();
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
      const strokeColor = el.strokeColor || '#1e3a5f';
      const fillColor = el.backgroundColor === 'transparent' ? 'transparent' : (el.backgroundColor || 'transparent');
      const opacity = el.opacity !== undefined ? el.opacity / 100 : 1;

      const style = {
        stroke: strokeColor,
        fill: fillColor,
        strokeWidth: strokeWidth,
        strokeStyle: strokeStyle,
        opacity: opacity
      };

      const baseProperties = {
        seed: el.seed,
        version: el.version,
        versionNonce: el.versionNonce,
        isDeleted: el.isDeleted,
        groupIds: el.groupIds,
        boundElements: el.boundElements,
        link: el.link,
        locked: el.locked,
        fillStyle: el.fillStyle,
        roughness: el.roughness,
        opacity: el.opacity,
        angle: el.angle,
        strokeColor: el.strokeColor,
        backgroundColor: el.backgroundColor,
        strokeWidth: el.strokeWidth,
        strokeStyle: el.strokeStyle,
      };

      let shapeData = null;

      if (el.type === 'rectangle') {
        shapeData = {
          ...baseProperties,
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
          ...baseProperties,
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
          ...baseProperties,
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
          ...baseProperties,
          id: el.id || `line-${Date.now()}-${Math.random()}`,
          type: type,
          x: el.x,
          y: el.y,
          width: width,
          height: height,
          rotation: rotation,
          style: style,
          points: el.points,
          startBinding: el.startBinding,
          endBinding: el.endBinding,
          startArrowhead: el.startArrowhead,
          endArrowhead: el.endArrowhead
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
          ...baseProperties,
          id: el.id || `text-${Date.now()}-${Math.random()}`,
          type: 'text',
          x: el.x,
          y: el.y,
          width: el.width,
          height: el.height,
          rotation: rotation,
          text: el.text || '',
          style: textStyle,
          fontSize: el.fontSize,
          fontFamily: el.fontFamily,
          textAlign: el.textAlign,
          verticalAlign: el.verticalAlign,
          lineHeight: el.lineHeight,
          containerId: el.containerId
        };
        shapes.push(shapeData);
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

    // 1. Clear current canvas — destroy Konva nodes to prevent ghost nodes and memory leaks
    const existingShapes = shapeManager.getAllShapes();
    existingShapes.forEach(s => {
      if (typeof s.destroy === 'function') s.destroy();
    });
    this.canvasEngine.shapeLayer.destroyChildren();
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
        const data = JSON.parse(event.target.result);
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

    // 3. Compute bounding box of all shapes for cropped export
    const allShapes = shapeManager.getAllShapes();
    let exportOpts = { pixelRatio: 2, mimeType: 'image/png' };

    if (allShapes.length > 0) {
      const bbox = this.canvasEngine.getShapesBoundingBox(allShapes);
      if (bbox && bbox.width > 0 && bbox.height > 0) {
        const padding = 40;
        const stage = this.canvasEngine.stage;
        const scale = stage.scaleX();
        // Convert canvas-space bbox to stage pixel-space for toDataURL
        exportOpts.x = bbox.x * scale + stage.x() - padding;
        exportOpts.y = bbox.y * scale + stage.y() - padding;
        exportOpts.width = bbox.width * scale + padding * 2;
        exportOpts.height = bbox.height * scale + padding * 2;
      }
    }

    const dataURL = this.canvasEngine.stage.toDataURL(exportOpts);

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

  exportSVG() {
    if (!this.canvasEngine) return;
    const shapes = shapeManager.getAllShapes();
    
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    if (shapes.length === 0) {
      minX = 0; minY = 0; maxX = 800; maxY = 600;
    } else {
      shapes.forEach(s => {
        const geom = s.getGeometry();
        minX = Math.min(minX, geom.x);
        minY = Math.min(minY, geom.y);
        maxX = Math.max(maxX, geom.x + (geom.width || 100));
        maxY = Math.max(maxY, geom.y + (geom.height || 100));
      });
      minX -= 40; minY -= 40; maxX += 40; maxY += 40;
    }

    const width = Math.max(400, maxX - minX);
    const height = Math.max(300, maxY - minY);

    let svgElements = '';
    shapes.forEach(s => {
      if (typeof s.toSVGElement === 'function') {
        svgElements += '  ' + s.toSVGElement() + '\n';
      } else {
        const g = s.getGeometry();
        const fill = s.fillColor || 'transparent';
        const stroke = s.color || s.strokeColor || '#1e293b';
        svgElements += `  <rect x="${g.x}" y="${g.y}" width="${g.width || 50}" height="${g.height || 50}" fill="${fill}" stroke="${stroke}" stroke-width="${s.strokeWidth || 2}" />\n`;
      }
    });

    const fontStyleImports = `@import url('https://fonts.googleapis.com/css2?family=Architects+Daughter&family=Caveat:wght@400;700&family=Fira+Code:wght@400;600&family=Inter:wght@400;600;700&display=swap');`;

    const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="${minX} ${minY} ${width} ${height}" width="${width}" height="${height}">
  <style>
    ${fontStyleImports}
    text { font-family: Inter, sans-serif; }
  </style>
  <rect x="${minX}" y="${minY}" width="${width}" height="${height}" fill="#ffffff" />
${svgElements}</svg>`;

    const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `inkflow-vector-${Date.now()}.svg`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 0);
  }

  exportPDF() {
    if (!this.canvasEngine) return;
    const shapes = shapeManager.getAllShapes();
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    if (shapes.length === 0) {
      minX = 0; minY = 0; maxX = 800; maxY = 600;
    } else {
      shapes.forEach(s => {
        const geom = s.getGeometry();
        minX = Math.min(minX, geom.x);
        minY = Math.min(minY, geom.y);
        maxX = Math.max(maxX, geom.x + (geom.width || 100));
        maxY = Math.max(maxY, geom.y + (geom.height || 100));
      });
      minX -= 40; minY -= 40; maxX += 40; maxY += 40;
    }

    const width = Math.max(400, maxX - minX);
    const height = Math.max(300, maxY - minY);

    let svgElements = '';
    shapes.forEach(s => {
      if (typeof s.toSVGElement === 'function') {
        svgElements += '  ' + s.toSVGElement() + '\n';
      } else {
        const g = s.getGeometry();
        const fill = s.fillColor || 'transparent';
        const stroke = s.color || s.strokeColor || '#1e293b';
        svgElements += `  <rect x="${g.x}" y="${g.y}" width="${g.width || 50}" height="${g.height || 50}" fill="${fill}" stroke="${stroke}" stroke-width="${s.strokeWidth || 2}" />\n`;
      }
    });

    const printWin = window.open('', '_blank');
    if (!printWin) {
      alert('Please allow popups to export PDF.');
      return;
    }

    printWin.document.write(`<!DOCTYPE html>
<html>
<head>
  <title>InkFlow Searchable Document PDF</title>
  <link href="https://fonts.googleapis.com/css2?family=Architects+Daughter&family=Caveat:wght@400;700&family=Fira+Code:wght@400;600&family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
  <style>
    @page { size: auto; margin: 0; }
    body { margin: 0; padding: 20px; display: flex; justify-content: center; background: #fff; }
    svg { width: 100%; max-width: ${width}px; height: auto; }
  </style>
</head>
<body>
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="${minX} ${minY} ${width} ${height}">
    <rect x="${minX}" y="${minY}" width="${width}" height="${height}" fill="#ffffff" />
    ${svgElements}
  </svg>
  <script>
    window.onload = () => {
      setTimeout(() => {
        window.print();
        window.close();
      }, 300);
    };
  </script>
</body>
</html>`);
    printWin.document.close();
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
