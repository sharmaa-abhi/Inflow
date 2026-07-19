/**
 * Abstract Base Tool class that defines standard lifecycle hooks for user interactions.
 */
export class BaseTool {
  /**
   * @param {CanvasEngine} canvasEngine - CanvasEngine instance
   */
  constructor(canvasEngine) {
    this.canvasEngine = canvasEngine;
    this.active = false;
  }

  /**
   * Called when this tool is set as active.
   */
  activate() {
    this.active = true;
  }

  /**
   * Called when this tool is deactivated.
   */
  deactivate() {
    this.active = false;
  }

  /**
   * Pointer down event hook.
   * @param {Object} data - { event, canvasPos, screenPos }
   */
  onPointerDown(data) {}

  /**
   * Pointer move event hook.
   * @param {Object} data - { event, canvasPos, screenPos }
   */
  onPointerMove(data) {}

  /**
   * Pointer up event hook.
   * @param {Object} data - { event, canvasPos, screenPos }
   */
  onPointerUp(data) {}

  /**
   * Keyboard keydown event hook.
   * @param {KeyboardEvent} event 
   */
  onKeyDown(event) {}

  /**
   * Keyboard keyup event hook.
   * @param {KeyboardEvent} event 
   */
  onKeyUp(event) {}
}
