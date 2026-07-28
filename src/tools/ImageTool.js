import { BaseTool } from './BaseTool';
import { ImageShape } from '../shapes/ImageShape';
import { shapeManager } from '../managers/ShapeManager';
import { historyManager } from '../managers/HistoryManager';

export class ImageTool extends BaseTool {
  constructor(canvasEngine) {
    super(canvasEngine);
    this.fileInput = null;
    this.setupFileInput();
    this.setupDragAndDrop();
  }

  setupFileInput() {
    this.fileInput = document.createElement('input');
    this.fileInput.type = 'file';
    this.fileInput.accept = 'image/png, image/jpeg, image/webp, image/svg+xml';
    this.fileInput.style.display = 'none';
    document.body.appendChild(this.fileInput);

    this.fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        this.processFile(file, { x: 200, y: 150 });
        this.fileInput.value = '';
      }
    });
  }

  setupDragAndDrop() {
    const container = this.canvasEngine.stage.container();
    if (!container) return;

    container.addEventListener('dragover', (e) => {
      e.preventDefault();
    });

    container.addEventListener('drop', (e) => {
      e.preventDefault();
      const files = e.dataTransfer.files;
      if (files && files.length > 0) {
        const file = files[0];
        if (file.type.startsWith('image/')) {
          const pointer = this.canvasEngine.stage.getPointerPosition();
          const canvasPos = this.canvasEngine.getCanvasCoords(pointer || { x: 200, y: 200 });
          this.processFile(file, canvasPos);
        }
      }
    });
  }

  promptFilePicker() {
    if (this.fileInput) {
      this.fileInput.click();
    }
  }

  processFile(file, pos) {
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target.result;
      const imgShape = new ImageShape({
        x: pos.x,
        y: pos.y,
        src: dataUrl,
      });

      shapeManager.addShape(imgShape);
      this.canvasEngine.shapeLayer.add(imgShape.konvaNode);
      this.canvasEngine.shapeLayer.batchDraw();

      historyManager.registerChange({
        type: 'add',
        shapeId: imgShape.id,
        shapeData: imgShape.serialize(),
        undo: () => {
          shapeManager.removeShape(imgShape.id);
          imgShape.destroy();
          this.canvasEngine.shapeLayer.batchDraw();
        },
        redo: () => {
          const reCreated = shapeManager.recreateShape(imgShape.serialize());
          this.canvasEngine.shapeLayer.add(reCreated.konvaNode);
          this.canvasEngine.shapeLayer.batchDraw();
        }
      });

      shapeManager.select([imgShape.id]);
    };
    reader.readAsDataURL(file);
  }

  activate() {
    super.activate();
    this.promptFilePicker();
  }
}
