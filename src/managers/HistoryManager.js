import { eventBus } from '../core/EventBus';

class HistoryManager {
  constructor() {
    this.undoStack = [];
    this.redoStack = [];
    this.maxStackSize = 50; // Keep memory in check
  }

  registerChange(action) {
    if (!action || typeof action.undo !== 'function' || typeof action.redo !== 'function') {
      console.error('Invalid action registered to HistoryManager:', action);
      return;
    }

    this.undoStack.push(action);
    if (this.undoStack.length > this.maxStackSize) {
      this.undoStack.shift(); // remove oldest
    }

    this.redoStack = []; // Clear redo stack on new action
    this.notifyState();
  }

  undo() {
    if (this.undoStack.length === 0) return;

    const action = this.undoStack.pop();
    try {
      action.undo();
      this.redoStack.push(action);
    } catch (e) {
      console.error('Error executing undo command:', e);
    }
    this.notifyState();
  }

  redo() {
    if (this.redoStack.length === 0) return;

    const action = this.redoStack.pop();
    try {
      action.redo();
      this.undoStack.push(action);
    } catch (e) {
      console.error('Error executing redo command:', e);
    }
    this.notifyState();
  }

  clear() {
    this.undoStack = [];
    this.redoStack = [];
    this.notifyState();
  }

  notifyState() {
    eventBus.emit('history-changed', {
      canUndo: this.undoStack.length > 0,
      canRedo: this.redoStack.length > 0,
    });
  }
}

export const historyManager = new HistoryManager();

