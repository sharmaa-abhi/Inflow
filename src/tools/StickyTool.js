import Konva from 'konva';
import { BaseTool } from './BaseTool';
import { StickyNoteShape } from '../shapes/StickyNoteShape';
import { shapeManager } from '../managers/ShapeManager';
import { historyManager } from '../managers/HistoryManager';
import { eventBus } from '../core/EventBus';

export class StickyTool extends BaseTool {
  constructor(canvasEngine) {
    super(canvasEngine);
    this.neighborButtons = [];

    // Listen to selection changes to show/hide quick-add neighbor buttons
    eventBus.on('selection-changed', (selectedShapes) => {
      this._clearNeighborButtons();
      if (selectedShapes.length === 1 && selectedShapes[0].type === 'stickyNote') {
        this._renderNeighborButtons(selectedShapes[0]);
      }
    });
  }

  activate() {
    super.activate();
    this.canvasEngine.stage.container().style.cursor = 'copy';
  }

  deactivate() {
    super.deactivate();
    this.canvasEngine.stage.container().style.cursor = 'default';
  }

  onPointerDown({ canvasPos, event }) {
    if (event.evt && event.evt.button !== 0) return;

    const note = new StickyNoteShape({
      x: canvasPos.x - 80,
      y: canvasPos.y - 80,
      width: 160,
      height: 160,
    });

    shapeManager.addShape(note);
    this.canvasEngine.shapeLayer.add(note.konvaNode);
    this.canvasEngine.shapeLayer.batchDraw();

    historyManager.registerChange({
      type: 'add',
      shapeId: note.id,
      shapeData: note.serialize(),
      undo: () => {
        shapeManager.removeShape(note.id);
        note.destroy();
        this.canvasEngine.shapeLayer.batchDraw();
      },
      redo: () => {
        const reCreated = shapeManager.recreateShape(note.serialize());
        this.canvasEngine.shapeLayer.add(reCreated.konvaNode);
        this.canvasEngine.shapeLayer.batchDraw();
      }
    });

    shapeManager.select([note.id]);
  }

  // ─── Quick-Add Neighbor Buttons (+ top, + right, + bottom, + left) ────────────────

  _clearNeighborButtons() {
    this.neighborButtons.forEach(b => b.destroy());
    this.neighborButtons = [];
    if (this.canvasEngine) {
      this.canvasEngine.overlayLayer.batchDraw();
    }
  }

  _renderNeighborButtons(note) {
    this._clearNeighborButtons();

    const geom = note.getGeometry();
    const GAP = 30; // distance from note edge

    const neighbors = [
      { dir: 'top',    x: geom.x + geom.width / 2, y: geom.y - GAP,           newX: geom.x, newY: geom.y - geom.height - GAP },
      { dir: 'bottom', x: geom.x + geom.width / 2, y: geom.y + geom.height + GAP, newX: geom.x, newY: geom.y + geom.height + GAP },
      { dir: 'left',   x: geom.x - GAP,            y: geom.y + geom.height / 2, newX: geom.x - geom.width - GAP, newY: geom.y },
      { dir: 'right',  x: geom.x + geom.width + GAP, y: geom.y + geom.height / 2, newX: geom.x + geom.width + GAP, newY: geom.y },
    ];

    neighbors.forEach(({ x, y, newX, newY }) => {
      const btnGroup = new Konva.Group({ x, y, listening: true });

      const circle = new Konva.Circle({
        radius: 12,
        fill: '#ffffff',
        stroke: '#3b82f6',
        strokeWidth: 2,
        shadowColor: 'rgba(0,0,0,0.15)',
        shadowBlur: 4,
      });

      const plusText = new Konva.Text({
        text: '+',
        fontSize: 16,
        fontStyle: 'bold',
        fill: '#3b82f6',
        x: -5,
        y: -9,
      });

      btnGroup.add(circle);
      btnGroup.add(plusText);

      btnGroup.on('mouseenter', () => {
        circle.fill('#3b82f6');
        plusText.fill('#ffffff');
        this.canvasEngine.overlayLayer.batchDraw();
      });

      btnGroup.on('mouseleave', () => {
        circle.fill('#ffffff');
        plusText.fill('#3b82f6');
        this.canvasEngine.overlayLayer.batchDraw();
      });

      btnGroup.on('click tap', (e) => {
        e.cancelBubble = true;
        const newNote = new StickyNoteShape({
          x: newX,
          y: newY,
          width: geom.width,
          height: geom.height,
          noteColor: note.noteColor,
        });

        shapeManager.addShape(newNote);
        this.canvasEngine.shapeLayer.add(newNote.konvaNode);
        this.canvasEngine.shapeLayer.batchDraw();

        historyManager.registerChange({
          type: 'add',
          shapeId: newNote.id,
          shapeData: newNote.serialize(),
          undo: () => {
            shapeManager.removeShape(newNote.id);
            newNote.destroy();
            this.canvasEngine.shapeLayer.batchDraw();
          },
          redo: () => {
            const reCreated = shapeManager.recreateShape(newNote.serialize());
            this.canvasEngine.shapeLayer.add(reCreated.konvaNode);
            this.canvasEngine.shapeLayer.batchDraw();
          }
        });

        shapeManager.select([newNote.id]);
      });

      this.canvasEngine.overlayLayer.add(btnGroup);
      this.neighborButtons.push(btnGroup);
    });

    this.canvasEngine.overlayLayer.batchDraw();
  }
}
