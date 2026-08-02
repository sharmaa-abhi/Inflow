import { eventBus } from '../core/EventBus';
import { toolManager } from '../managers/ToolManager';

export class Toolbar {
  constructor() {
    // Map of button ID suffixes to tool keys
    this.buttons = {
      'tool-lock': 'select',
      'tool-hand': 'hand',
      'tool-select': 'select',
      'tool-rectangle': 'rectangle',
      'tool-circle': 'circle',
      'tool-diamond': 'diamond',
      'tool-line': 'line',
      'tool-arrow': 'arrow',
      'tool-pen': 'pen',
      'tool-text': 'text',
      'tool-eraser': 'eraser',
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

    // Wire up top-right sidebar button
    const btnSidebarTop = document.getElementById('btn-sidebar-top');
    if (btnSidebarTop) {
      btnSidebarTop.addEventListener('click', () => {
        const sidebar = document.getElementById('sidebar-panel');
        if (sidebar) {
          sidebar.classList.toggle('hidden');
        }
      });
    }

    // Wire up top-right share button
    const btnShareTop = document.getElementById('btn-share-top');
    if (btnShareTop) {
      btnShareTop.addEventListener('click', () => {
        const toast = document.getElementById('toast');
        if (toast) {
          toast.textContent = 'Diagram share link copied to clipboard!';
          toast.classList.add('mobile-toast-show');
          setTimeout(() => toast.classList.remove('mobile-toast-show'), 2500);
        }
      });
    }

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
        el.classList.add('active-tool', 'btn-active');
      } else {
        el.classList.remove('active-tool', 'btn-active');
      }
    });
  }
}

