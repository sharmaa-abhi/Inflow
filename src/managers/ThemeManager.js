import { eventBus } from '../core/EventBus';

class ThemeManager {
  constructor() {
    this.canvasEngine = null;
    this.isDark = false;
  }

  init(canvasEngine) {
    this.canvasEngine = canvasEngine;

    // Cache DOM elements
    this.btnToggle = document.getElementById('btn-theme-toggle');
    this.iconSun = document.getElementById('theme-icon-sun');
    this.iconMoon = document.getElementById('theme-icon-moon');

    if (!this.btnToggle) return;

    // Load initial preference
    const pref = localStorage.getItem('inkflow_theme_pref');
    const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (pref === 'dark' || (!pref && systemDark)) {
      this.setDarkTheme(true);
    } else {
      this.setDarkTheme(false);
    }

    // Bind click listener
    this.btnToggle.addEventListener('click', () => {
      this.setDarkTheme(!this.isDark);
    });
  }

  setDarkTheme(isDark) {
    this.isDark = isDark;
    
    if (isDark) {
      document.body.classList.add('dark');
      if (this.iconSun) this.iconSun.classList.add('hidden');
      if (this.iconMoon) this.iconMoon.classList.remove('hidden');
      localStorage.setItem('inkflow_theme_pref', 'dark');
    } else {
      document.body.classList.remove('dark');
      if (this.iconSun) this.iconSun.classList.remove('hidden');
      if (this.iconMoon) this.iconMoon.classList.add('hidden');
      localStorage.setItem('inkflow_theme_pref', 'light');
    }

    // Force redraw background grid to reflect theme changes
    if (this.canvasEngine) {
      this.canvasEngine.backgroundLayer.batchDraw();
    }

    eventBus.emit('theme-changed', isDark ? 'dark' : 'light');
  }
}

export const themeManager = new ThemeManager();
