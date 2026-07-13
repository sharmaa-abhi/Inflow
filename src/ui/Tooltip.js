import { eventBus } from '../core/EventBus';

export class Tooltip {
  constructor() {
    this.tooltipEl = null;
    this.activeElement = null;
    console.log('Tooltip system constructor called');
    this.init();
  }

  init() {
    // Create tooltip container element
    this.tooltipEl = document.createElement('div');
    this.tooltipEl.className = 'custom-tooltip';
    document.body.appendChild(this.tooltipEl);
    console.log('Tooltip container appended to body');

    // Global listener for hover (delegated for dynamically created elements too!)
    document.addEventListener('mouseover', (e) => {
      if (!e.target || typeof e.target.closest !== 'function') return;
      
      const target = e.target.closest('[title]');
      if (!target) return;

      const text = target.getAttribute('title');
      if (!text) return;

      // Ignore inputs/textareas where native titles/selection behavior shouldn't be interfered with
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      this.showTooltip(target, text);
    });

    document.addEventListener('mouseout', (e) => {
      if (this.activeElement && (!e.relatedTarget || !this.activeElement.contains(e.relatedTarget))) {
        this.hideTooltip();
      }
    });

    // Hide tooltips on interactions
    document.addEventListener('mousedown', () => this.hideTooltip());
    window.addEventListener('wheel', () => this.hideTooltip(), { passive: true });
    
    // Hide when viewport changes (pan/zoom)
    eventBus.on('viewport-changed', () => this.hideTooltip());
  }

  showTooltip(element, text) {
    // If hovering same element, do nothing
    if (this.activeElement === element) return;
    
    // If another is active, hide it first
    if (this.activeElement) {
      this.hideTooltip();
    }

    this.activeElement = element;

    // Temporarily swap title out to avoid standard browser tooltips
    element.setAttribute('data-original-title', text);
    element.removeAttribute('title');

    this.tooltipEl.textContent = text;
    this.tooltipEl.classList.add('show');

    // Position it correctly relative to element
    this.positionTooltip(element);
  }

  hideTooltip() {
    if (!this.activeElement) return;

    // Restore title attribute
    const originalTitle = this.activeElement.getAttribute('data-original-title');
    if (originalTitle) {
      this.activeElement.setAttribute('title', originalTitle);
      this.activeElement.removeAttribute('data-original-title');
    }

    this.activeElement = null;
    this.tooltipEl.classList.remove('show');
  }

  positionTooltip(element) {
    const rect = element.getBoundingClientRect();
    
    // Force browser reflow to get actual size of tooltip
    this.tooltipEl.style.display = 'block'; 
    const tooltipRect = this.tooltipEl.getBoundingClientRect();

    // Position above centered, offset by 8px
    let top = rect.top - tooltipRect.height - 8;
    let left = rect.left + (rect.width - tooltipRect.width) / 2;

    // Flip to bottom if goes above viewport top
    if (top < 8) {
      top = rect.bottom + 8;
    }

    // Horizontal bounds containment
    if (left < 8) {
      left = 8;
    } else if (left + tooltipRect.width > window.innerWidth - 8) {
      left = window.innerWidth - tooltipRect.width - 8;
    }

    this.tooltipEl.style.top = `${top}px`;
    this.tooltipEl.style.left = `${left}px`;
  }
}
