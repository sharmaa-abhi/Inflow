import { shapeManager } from '../managers/ShapeManager';
import { toolManager } from '../managers/ToolManager';
import { eventBus } from '../core/EventBus';

export class ContextMenu {
  /**
   * @param {CanvasEngine} canvasEngine - CanvasEngine instance
   */
  constructor(canvasEngine) {
    this.canvasEngine = canvasEngine;
    this.menuEl = null;
    this.init();
  }

  init() {
    const container = this.canvasEngine.stage.container();

    // Context menu trigger
    container.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      
      // Check if we right-clicked a shape
      const pos = this.canvasEngine.stage.getPointerPosition();
      const clickedNode = this.canvasEngine.stage.getIntersection(pos);
      
      let shapeId = null;
      if (clickedNode) {
        shapeId = clickedNode.id();
        let parent = clickedNode;
        // Traverse up to find the root shape ID
        while (parent && !shapeId) {
          parent = parent.getParent();
          if (parent) shapeId = parent.id();
        }
      }

      if (shapeId) {
        const clickedShape = shapeManager.getShapeById(shapeId);
        if (clickedShape) {
          const selected = shapeManager.getSelectedShapes();
          if (!selected.includes(clickedShape)) {
            // Shift is not usually down during right clicks, so select only this shape
            shapeManager.select([shapeId]);
            
            // Also notify SelectTool to update its transformer visual outline
            const selectTool = toolManager.tools.get('select');
            if (selectTool) {
              selectTool.selectShapes([clickedShape], false);
            }
          }
        }
      } else {
        // Right-clicked empty canvas space
        shapeManager.deselectAll();
        const selectTool = toolManager.tools.get('select');
        if (selectTool) {
          selectTool.clearSelection();
        }
      }

      this.showMenu(e.clientX, e.clientY);
    });

    // Close menu on left click anywhere
    document.addEventListener('click', (e) => {
      // Don't close immediately if clicking inside the menu itself (though item click will trigger hide)
      if (this.menuEl && this.menuEl.contains(e.target)) return;
      this.hideMenu();
    });

    // Close menu on stage scroll/pan/zoom
    eventBus.on('viewport-changed', () => {
      this.hideMenu();
    });
  }

  showMenu(x, y) {
    this.hideMenu();

    const selectedShapes = shapeManager.getSelectedShapes();
    const hasSelection = selectedShapes.length > 0;
    const hasClipboard = shapeManager.clipboard && shapeManager.clipboard.length > 0;

    // Create menu wrapper element
    const menu = document.createElement('div');
    this.menuEl = menu;
    menu.className = 'context-menu';
    menu.style.left = `${x}px`;
    menu.style.top = `${y}px`;

    // Define menu items
    const items = [
      {
        label: 'Bring to Front',
        shortcut: ']',
        enabled: hasSelection,
        action: () => toolManager.reorderSelected('front')
      },
      {
        label: 'Bring Forward',
        shortcut: 'Ctrl+]',
        enabled: hasSelection,
        action: () => toolManager.reorderSelected('forward')
      },
      {
        label: 'Send Backward',
        shortcut: 'Ctrl+[',
        enabled: hasSelection,
        action: () => toolManager.reorderSelected('backward')
      },
      {
        label: 'Send to Back',
        shortcut: '[',
        enabled: hasSelection,
        action: () => toolManager.reorderSelected('back')
      },
      { type: 'separator' },
      {
        label: 'Copy',
        shortcut: 'Ctrl+C',
        enabled: hasSelection,
        action: () => toolManager.copySelected()
      },
      {
        label: 'Paste',
        shortcut: 'Ctrl+V',
        enabled: hasClipboard,
        action: () => toolManager.pasteCopied()
      },
      {
        label: 'Duplicate',
        shortcut: 'Ctrl+D',
        enabled: hasSelection,
        action: () => toolManager.duplicateSelected()
      },
      { type: 'separator' },
      {
        label: 'Delete',
        shortcut: 'Delete',
        enabled: hasSelection,
        danger: true,
        action: () => toolManager.deleteSelectedShapes()
      }
    ];

    // Build DOM elements for menu
    items.forEach(item => {
      if (item.type === 'separator') {
        const sep = document.createElement('div');
        sep.className = 'context-menu-separator';
        menu.appendChild(sep);
      } else {
        const btn = document.createElement('button');
        btn.className = `context-menu-item w-full text-left transition-all ${item.danger ? 'danger' : ''}`;
        
        if (!item.enabled) {
          btn.disabled = true;
          btn.style.opacity = '0.4';
          btn.style.cursor = 'not-allowed';
        }

        const labelSpan = document.createElement('span');
        labelSpan.textContent = item.label;
        btn.appendChild(labelSpan);

        if (item.shortcut) {
          const shortcutSpan = document.createElement('span');
          shortcutSpan.className = 'shortcut';
          shortcutSpan.textContent = item.shortcut;
          btn.appendChild(shortcutSpan);
        }

        if (item.enabled) {
          btn.addEventListener('click', () => {
            item.action();
            this.hideMenu();
          });
        }

        menu.appendChild(btn);
      }
    });

    document.body.appendChild(menu);

    // Adjust position so context menu doesn't bleed outside the browser window boundaries
    const rect = menu.getBoundingClientRect();
    if (rect.right > window.innerWidth) {
      menu.style.left = `${x - rect.width}px`;
    }
    if (rect.bottom > window.innerHeight) {
      menu.style.top = `${y - rect.height}px`;
    }
  }

  hideMenu() {
    if (this.menuEl) {
      this.menuEl.remove();
      this.menuEl = null;
    }
  }
}
