import Konva from 'konva';
import { BaseTool } from './BaseTool';

export class LaserTool extends BaseTool {
  /**
   * @param {CanvasEngine} canvasEngine 
   * @param {ShapeManager} shapeManager 
   * @param {StyleManager} styleManager 
   */
  constructor(canvasEngine, shapeManager, styleManager) {
    super(canvasEngine);
    this.shapeManager = shapeManager;
    this.styleManager = styleManager;

    this.trailPoints = []; // List of { x, y, time }
    this.lifespan = 1000; // Trail point lifespan in milliseconds
    this.isDrawing = false;
    this.animationId = null;

    this.initLaserShape();
  }

  initLaserShape() {
    const tool = this;

    // Custom Konva shape to render the glowing fading trail
    this.laserShape = new Konva.Shape({
      x: 0,
      y: 0,
      listening: false,
      visible: false,
      sceneFunc(context, shape) {
        if (tool.trailPoints.length < 2) return;

        const now = Date.now();
        const scale = tool.canvasEngine.stage.scaleX();

        context.save();
        
        // Draw the glowing trail line segments
        context.lineCap = 'round';
        context.lineJoin = 'round';
        
        // Draw segments with decreasing width/opacity from head (newest) to tail (oldest)
        for (let i = 1; i < tool.trailPoints.length; i++) {
          const p1 = tool.trailPoints[i - 1];
          const p2 = tool.trailPoints[i];

          const age = now - p2.time;
          if (age > tool.lifespan) continue;

          // Compute opacity based on point age
          const ratio = 1 - age / tool.lifespan; // 1 (new) to 0 (faded)
          
          context.beginPath();
          context.moveTo(p1.x, p1.y);
          context.lineTo(p2.x, p2.y);
          
          context.strokeStyle = `rgba(239, 68, 68, ${ratio})`; // Red-500 fading
          context.lineWidth = (6 * ratio) / scale; // Scale thickness with zoom and age ratio
          
          context.stroke();
        }

        // Draw the glowing pointer dot at the head (newest point)
        if (tool.trailPoints.length > 0) {
          const head = tool.trailPoints[tool.trailPoints.length - 1];
          const headAge = now - head.time;
          
          if (tool.isDrawing || headAge <= tool.lifespan) {
            const ratio = tool.isDrawing ? 1 : (1 - headAge / tool.lifespan);
            context.beginPath();
            context.arc(head.x, head.y, 6 / scale, 0, Math.PI * 2);
            
            // Outer Glow
            context.shadowColor = 'rgba(239, 68, 68, 0.8)';
            context.shadowBlur = 12;
            context.fillStyle = `rgba(239, 68, 68, ${ratio})`;
            context.fill();
          }
        }

        context.restore();
      },
      // Override culling bounding box to ensure the shape is always rendered
      getSelfRect() {
        return {
          x: -100000,
          y: -100000,
          width: 200000,
          height: 200000
        };
      }
    });

    this.canvasEngine.overlayLayer.add(this.laserShape);
  }

  activate() {
    super.activate();
    this.laserShape.visible(true);
    this.trailPoints = [];
  }

  deactivate() {
    super.deactivate();
    this.isDrawing = false;
    this.laserShape.visible(false);
    this.trailPoints = [];
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    this.canvasEngine.overlayLayer.batchDraw();
  }

  onPointerDown(data) {
    const { canvasPos } = data;
    this.isDrawing = true;
    this.trailPoints = [{ x: canvasPos.x, y: canvasPos.y, time: Date.now() }];
    
    this.laserShape.visible(true);
    this.canvasEngine.overlayLayer.batchDraw();

    if (!this.animationId) {
      this.startFadeLoop();
    }
  }

  onPointerMove(data) {
    if (!this.isDrawing) return;
    const { canvasPos } = data;

    // Append current position to trail points
    this.trailPoints.push({
      x: canvasPos.x,
      y: canvasPos.y,
      time: Date.now()
    });
  }

  onPointerUp(data) {
    this.isDrawing = false;
  }

  startFadeLoop() {
    const update = () => {
      const now = Date.now();

      // Clean up points older than the lifespan limit
      this.trailPoints = this.trailPoints.filter(p => now - p.time <= this.lifespan);

      // Request redraw
      this.canvasEngine.overlayLayer.batchDraw();

      // Continue animation if we have points left, or if user is still drawing
      if (this.trailPoints.length > 0 || this.isDrawing) {
        this.animationId = requestAnimationFrame(update);
      } else {
        this.animationId = null;
        this.laserShape.visible(false);
        this.canvasEngine.overlayLayer.batchDraw();
      }
    };

    this.animationId = requestAnimationFrame(update);
  }
}
