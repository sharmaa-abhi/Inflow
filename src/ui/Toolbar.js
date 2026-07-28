import { eventBus } from '../core/EventBus';
import { toolManager } from '../managers/ToolManager';

export class Toolbar {
  constructor() {
    // Map of button ID suffixes to tool keys
    this.buttons = {
      'tool-select': 'select',
      'tool-rectangle': 'rectangle',
      'tool-circle': 'circle',
      'tool-diamond': 'diamond',
      'tool-line': 'line',
      'tool-arrow': 'arrow',
      'tool-pen': 'pen',
      'tool-text': 'text',
      'tool-laser': 'laser',
      'tool-sticky': 'sticky',
      'tool-image': 'image',
    };

    this.domElements = {};
    this.init();
  }

  init() {
    // Cache DOM buttons and bind click events
    Object.entries(this.buttons).forEach(([id, type]) => {
      const el = document.getElementById(id);
      if (el) {
        this.domElements[type] = el;
        el.addEventListener('click', () => {
          toolManager.setTool(type);
        });
      }
    });

    // Extended Shapes Popover Menu Wiring
    const extShapesBtn = document.getElementById('btn-extended-shapes');
    const extShapesMenu = document.getElementById('extended-shapes-menu');

    if (extShapesBtn && extShapesMenu) {
      extShapesBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        extShapesMenu.classList.toggle('hidden');
        extShapesMenu.classList.toggle('flex');
      });

      document.addEventListener('click', (e) => {
        if (!extShapesMenu.contains(e.target) && e.target !== extShapesBtn) {
          extShapesMenu.classList.add('hidden');
          extShapesMenu.classList.remove('flex');
        }
      });

      const extItems = extShapesMenu.querySelectorAll('.ext-shape-item');
      extItems.forEach(item => {
        item.addEventListener('click', () => {
          const shapeType = item.getAttribute('data-shape');
          if (shapeType) {
            toolManager.setTool(shapeType);
          }
          extShapesMenu.classList.add('hidden');
          extShapesMenu.classList.remove('flex');
        });
      });
    }

    // Listen to changes in the active tool to toggle visual highlights
    eventBus.on('tool-changed', (activeType) => {
      this.updateActiveButton(activeType);
    });

    // Set initial tool highlighting
    this.updateActiveButton(toolManager.activeToolType || 'select');
  }

  updateActiveButton(activeType) {
    Object.entries(this.domElements).forEach(([type, el]) => {
      if (type === activeType) {
        el.classList.add('btn-active');
        // Add borders/styles for Tailwind
        el.classList.add('bg-indigo-50', 'text-indigo-600', 'ring-2', 'ring-indigo-600/20');
        el.classList.remove('text-slate-700', 'hover:bg-slate-100');
      } else {
        el.classList.remove('btn-active');
        el.classList.remove('bg-indigo-50', 'text-indigo-600', 'ring-2', 'ring-indigo-600/20');
        el.classList.add('text-slate-700', 'hover:bg-slate-100');
      }
    });
  }
}

