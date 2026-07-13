import './style.css';
import { CanvasEngine } from './core/CanvasEngine';
import { toolManager } from './managers/ToolManager';
import { persistenceManager } from './managers/PersistenceManager';
import { themeManager } from './managers/ThemeManager';
import { Toolbar } from './ui/Toolbar';
import { PropertiesPanel } from './ui/PropertiesPanel';
import { Sidebar } from './ui/Sidebar';
import { Statusbar } from './ui/Statusbar';
import { ContextMenu } from './ui/ContextMenu';
import { Tooltip } from './ui/Tooltip';
import { threeDPreviewManager } from './managers/ThreeDPreviewManager';

// Bootstrap InkFlow Application
document.addEventListener('DOMContentLoaded', () => {
  try {
    // 1. Initialize Canvas Rendering Engine
    const canvasEngine = new CanvasEngine('canvas-container');

    // Initialize Theme Manager (must be before loading grid state so correct grid contrast draws!)
    themeManager.init(canvasEngine);

    // 2. Initialize Tool Orchestration
    toolManager.init(canvasEngine);

    // Save a reference to toolManager on the stage for cross-tool interactions (like double-click editing)
    canvasEngine.stage.setAttr('toolManager', toolManager);

    // 3. Initialize Document Autosave & File Loaders
    persistenceManager.init(canvasEngine);
    threeDPreviewManager.init(canvasEngine);

    // 4. Initialize UI Panel Overlay Controllers
    new Toolbar();
    new PropertiesPanel();
    new Sidebar(canvasEngine);
    new Statusbar(canvasEngine);
    new ContextMenu(canvasEngine);
    new Tooltip();

    console.log('InkFlow successfully initialized!');
  } catch (error) {
    console.error('Error bootstrapping InkFlow application:', error);
  }
});
