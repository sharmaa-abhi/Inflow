import { eventBus } from '../core/EventBus';

class ThemeManager {
  constructor() {
    this.canvasEngine = null;
    this.currentMode = 'dark'; // 'light' | 'dark' | 'system'
    this.isDark = true;
    this.systemMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    this._mediaListener = null;
  }

  init(canvasEngine) {
    this.canvasEngine = canvasEngine;

    // Load initial preference
    const pref = localStorage.getItem('inkflow_theme_pref') || 'dark';
    this.setMode(pref);

    // Listen to system theme changes
    this._mediaListener = (e) => {
      if (this.currentMode === 'system') {
        this._applyDarkState(e.matches);
      }
    };
    this.systemMediaQuery.addEventListener('change', this._mediaListener);
  }

  setMode(mode) {
    this.currentMode = mode;
    localStorage.setItem('inkflow_theme_pref', mode);

    let isDark = false;
    if (mode === 'system') {
      isDark = this.systemMediaQuery.matches;
    } else if (mode === 'dark') {
      isDark = true;
    } else {
      isDark = false;
    }

    this._applyDarkState(isDark);
    eventBus.emit('theme-mode-changed', mode);
  }

  _applyDarkState(isDark) {
    this.isDark = isDark;

    if (isDark) {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }

    if (this.canvasEngine) {
      if (typeof this.canvasEngine.batchDrawAll === 'function') {
        this.canvasEngine.batchDrawAll();
      } else {
        this.canvasEngine.backgroundLayer?.batchDraw();
        this.canvasEngine.shapeLayer?.batchDraw();
      }
    }

    eventBus.emit('theme-changed', isDark ? 'dark' : 'light');
  }

  toggle() {
    if (this.isDark) {
      this.setMode('light');
    } else {
      this.setMode('dark');
    }
  }

  setDarkTheme(isDark) {
    this.setMode(isDark ? 'dark' : 'light');
  }
}

export const themeManager = new ThemeManager();

