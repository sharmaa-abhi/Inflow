import { eventBus } from '../core/EventBus';
import { shapeManager } from './ShapeManager';

class ThreeDPreviewManager {
  constructor() {
    this.overlay = null;
    this.viewport = null;
    this.canvasEngine = null;
    this.isActive = false;
    
    // Rotation state
    this.rotX = 60;
    this.rotY = 0;
    this.rotZ = -45;
    
    this.isDragging = false;
    this.lastMouseX = 0;
    this.lastMouseY = 0;
  }

  init(canvasEngine) {
    this.canvasEngine = canvasEngine;
    this.overlay = document.getElementById('three-d-overlay');
    this.viewport = document.getElementById('three-d-viewport');

    if (!this.overlay || !this.viewport) return;

    // Bind close triggers
    const closeTrigger = document.getElementById('three-d-close-trigger');
    if (closeTrigger) {
      closeTrigger.addEventListener('click', () => this.deactivate());
    }
    const btnExit = document.getElementById('btn-exit-3d');
    if (btnExit) {
      btnExit.addEventListener('click', () => this.deactivate());
    }

    // Drag-to-rotate events on the overlay/viewport
    const sceneContainer = document.getElementById('three-d-scene-container');
    if (sceneContainer) {
      sceneContainer.addEventListener('mousedown', (e) => this.handleDragStart(e));
      window.addEventListener('mousemove', (e) => this.handleDragMove(e));
      window.addEventListener('mouseup', () => this.handleDragEnd());
      
      // Touch support
      sceneContainer.addEventListener('touchstart', (e) => this.handleDragStart(e.touches[0]));
      window.addEventListener('touchmove', (e) => this.handleDragMove(e.touches[0]));
      window.addEventListener('touchend', () => this.handleDragEnd());
    }

    // Sync when shapes change or z-index changes
    eventBus.on('shapes-updated', () => {
      if (this.isActive) {
        this.render3DScene();
      }
    });

    eventBus.on('selection-changed', () => {
      if (this.isActive) {
        this.render3DScene();
      }
    });
  }

  activate() {
    if (this.isActive) return;
    this.isActive = true;

    this.overlay.classList.remove('hidden');
    // Force reflow
    this.overlay.offsetHeight;
    this.overlay.classList.add('opacity-100');

    // Reset default rotation angles
    this.rotX = 60;
    this.rotY = 0;
    this.rotZ = -45;

    this.render3DScene();
  }

  deactivate() {
    if (!this.isActive) return;
    this.isActive = false;

    // Reset button states
    const btnToggle3D = document.getElementById('btn-toggle-3d');
    if (btnToggle3D) {
      btnToggle3D.classList.remove('btn-active');
    }
    if (this.overlay) {
      this.overlay.classList.remove('manual-active');
    }

    this.overlay.classList.remove('opacity-100');
    // Wait for CSS transition
    setTimeout(() => {
      if (!this.isActive) {
        this.overlay.classList.add('hidden');
        this.viewport.innerHTML = '';
      }
    }, 300);
  }

  toggle() {
    if (this.isActive) {
      this.deactivate();
    } else {
      this.activate();
    }
  }

  handleDragStart(e) {
    // Only drag rotate if clicking viewport or background, not buttons
    if (e.target.closest('button')) return;
    this.isDragging = true;
    this.lastMouseX = e.clientX;
    this.lastMouseY = e.clientY;
    this.viewport.style.cursor = 'grabbing';
  }

  handleDragMove(e) {
    if (!this.isDragging) return;
    
    const deltaX = e.clientX - this.lastMouseX;
    const deltaY = e.clientY - this.lastMouseY;
    
    this.lastMouseX = e.clientX;
    this.lastMouseY = e.clientY;

    // Rotate around Z axis based on horizontal movement, and X axis based on vertical
    this.rotZ += deltaX * 0.5;
    this.rotX = Math.max(10, Math.min(85, this.rotX - deltaY * 0.5)); // Clamp pitch so view doesn't flip

    this.updateViewportTransform();
  }

  handleDragEnd() {
    this.isDragging = false;
    if (this.viewport) {
      this.viewport.style.cursor = 'grab';
    }
  }

  updateViewportTransform() {
    if (!this.viewport) return;
    
    // Fit viewport content inside window
    const scale = this.currentScale || 1;
    this.viewport.style.transform = `scale(${scale}) rotateX(${this.rotX}deg) rotateY(${this.rotY}deg) rotateZ(${this.rotZ}deg)`;
  }

  render3DScene() {
    if (!this.viewport || !this.canvasEngine) return;

    this.viewport.innerHTML = '';

    const allShapes = shapeManager.getAllShapes();
    const selected = shapeManager.getSelectedShapes();
    const selectedId = selected.length === 1 ? selected[0].id : null;

    if (allShapes.length === 0) {
      this.viewport.innerHTML = `<div class="absolute inset-0 flex items-center justify-center text-slate-400 font-semibold dark:text-slate-500">Draw some shapes on the canvas first!</div>`;
      return;
    }

    // 1. Calculate boundaries of all shapes to center and scale
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    
    allShapes.forEach(shape => {
      const r = shape.konvaNode.getClientRect();
      minX = Math.min(minX, r.x);
      minY = Math.min(minY, r.y);
      maxX = Math.max(maxX, r.x + r.width);
      maxY = Math.max(maxY, r.y + r.height);
    });

    // Add padding around content
    const padding = 40;
    minX -= padding;
    minY -= padding;
    maxX += padding;
    maxY += padding;

    const contentWidth = maxX - minX;
    const contentHeight = maxY - minY;

    // Set viewport dimensions
    this.viewport.style.width = `${contentWidth}px`;
    this.viewport.style.height = `${contentHeight}px`;

    // Calculate scale factor to fit container
    const fitWidth = window.innerWidth * 0.6;
    const fitHeight = window.innerHeight * 0.6;
    this.currentScale = Math.min(1.2, fitWidth / contentWidth, fitHeight / contentHeight);
    
    this.updateViewportTransform();

    // 2. Render each shape as a 3D plate
    allShapes.forEach((shape, index) => {
      const clientRect = shape.konvaNode.getClientRect();
      const w = Math.max(2, clientRect.width);
      const h = Math.max(2, clientRect.height);
      const x = clientRect.x - minX;
      const y = clientRect.y - minY;

      const plate = document.createElement('div');
      plate.className = 'three-d-plate';
      if (shape.id === selectedId) {
        plate.classList.add('active-plate');
      }

      // Export image content of shape
      try {
        const dataURL = shape.konvaNode.toDataURL({
          pixelRatio: window.devicePixelRatio || 1
        });
        plate.style.backgroundImage = `url(${dataURL})`;
      } catch (err) {
        console.error('Error generating 3D data URL for shape:', err);
      }

      // Position plate
      plate.style.left = `${x}px`;
      plate.style.top = `${y}px`;
      plate.style.width = `${w}px`;
      plate.style.height = `${h}px`;
      
      // Z depth transform
      const zDepth = index * 60; // 60px height difference per layer index
      plate.style.transform = `translateZ(${zDepth}px)`;

      // Add guide lines from the corners of the active/selected plate downward to show alignment projection
      if (shape.id === selectedId) {
        const corners = [
          { l: 0, t: 0 },
          { l: w, t: 0 },
          { l: 0, t: h },
          { l: w, t: h }
        ];
        corners.forEach(c => {
          const connector = document.createElement('div');
          connector.className = 'three-d-connector';
          connector.style.left = `${c.l}px`;
          connector.style.top = `${c.t}px`;
          connector.style.height = `${zDepth}px`; // Guide line runs down to the bottom z=0 plane
          connector.style.transform = `rotateX(-90deg)`; // Rotate lines vertically
          plate.appendChild(connector);
        });
      }

      // Add Z-index label tag next to the plate
      const label = document.createElement('div');
      label.className = 'three-d-label';
      label.textContent = `Layer ${index}`;
      plate.appendChild(label);

      this.viewport.appendChild(plate);
    });
  }
}

export const threeDPreviewManager = new ThreeDPreviewManager();
