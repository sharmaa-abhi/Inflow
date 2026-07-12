# InkFlow – Professional Diagram & Whiteboard Application

InkFlow is a modern, minimal, browser-based diagramming and whiteboard application inspired by Excalidraw and tldraw. Built with high-performance vector rendering via Konva.js and modern styling using Tailwind CSS v4, it provides a fluid and aesthetic drawing environment for creating diagrams, freehand illustrations, and presentations.

👉 **Live Local Host**: [http://localhost:5174/](http://localhost:5174/)

---

## ✨ Features

* **🎨 Advanced Vector Drawing**: Create Rectangles, Ellipses (Circles), Diamonds, Straight Lines, Arrows, and Freehand Pen trails.
* **🔍 Interactive Transformations**: Resize, rotate, and drag shapes individually or in groups using custom bounding box Transformer controls.
* **📏 Smart Snapping & Guides**: Automatically snap shapes to centers and edges of nearby elements with temporary pink alignment guide lines.
* **✍️ Multiline Text Editor**: Click-to-type or double-click to edit existing text. Supports custom fonts (Sans-Serif, Serif, and Handwriting/Virgil style), font-sizes, and text alignments.
* **🌈 Real-Time Properties Panel**: Live customizations for selected shapes including stroke color palette, custom hex pickers, fill color support, stroke widths (thin/medium/thick), stroke styles (solid/dashed/dotted), and opacity ranges.
* **🔦 Presentation Laser Pointer**: Glowing red laser trail that follows your cursor and fades away automatically within 1000ms—perfect for sharing screens.
* **🌙 Canvas Dark Mode**: Easily toggle a gorgeous slate-900 glassmorphism UI from the upper-right corner. Canvas grids, dots, and select boxes adapt their contrast automatically.
* **💾 Document Persistence**:
  * Automatically debounces and auto-saves diagram states to LocalStorage.
  * Import and export diagrams as versioned JSON schemas.
  * Export canvas as a high-density, cropped PNG file matching only the bounding region of drawn shapes.
* **↩️ Command History**: Complete Undo (`Ctrl+Z`) and Redo (`Ctrl+Shift+Z`) commands.
* **📋 Clipboard Controls**: Universal keyboard shortcuts for copy (`Ctrl+C`), paste (`Ctrl+V`), duplicate (`Ctrl+D`), and delete (`Delete`/`Backspace`).

---

## 🛠️ Architecture & Module Structure

InkFlow is structured into decoupled, event-driven modules that communicate via a central `EventBus`:

```
src/
├── core/
│   ├── CanvasEngine.js      # Manages Konva stage, panning, zooming, and grid drawing
│   └── EventBus.js          # Lightweight pub/sub dispatcher for decoupling managers
├── managers/
│   ├── ToolManager.js       # Handles active tools and keyboard keybind shortcuts
│   ├── ShapeManager.js      # Coordinates shapes state, selection groups, and clipboard
│   ├── HistoryManager.js    # Stack-based Undo/Redo command registry
│   ├── StyleManager.js      # Holds current default styles and propagates modifications
│   ├── SnapManager.js       # Snapping mechanics and alignment computations
│   ├── ThemeManager.js      # Manages dark/light toggles and theme configurations
│   └── PersistenceManager.js# Handles autosave, JSON imports/exports, and cropped PNGs
├── shapes/                  # Adapters mapping data models to Konva.js nodes
│   ├── BaseShape.js         # Abstract shape containing basic geometries and styling
│   ├── RectShape.js         # Rectangle shape node
│   ├── CircleShape.js       # Ellipse shape node
│   ├── DiamondShape.js      # Custom closed polygon Line shape
│   ├── LineShape.js         # Straight line shape segment
│   ├── ArrowShape.js        # Konva.Arrow shape segment
│   ├── PenShape.js          # Freehand line path shape
│   └── TextShape.js         # Word-wrapped Konva.Text shape
├── tools/                   # Interactive tool action strategies
│   ├── BaseTool.js          # Abstract tool hooks
│   ├── SelectTool.js        # Handles marquee select, transforms, and multi-dragging
│   ├── ShapeTool.js         # Click-and-drag shape creator
│   ├── PenTool.js           # Brush stroke line path creator
│   ├── TextTool.js          # Input overlay textarea injector
│   └── LaserTool.js         # glowing pointer trail tracker
├── ui/                      # Floating UI panels and overlays
│   ├── Toolbar.js           # Left/Top tools button drawer
│   ├── PropertiesPanel.js   # Style editing controllers
│   ├── Sidebar.js           # File and history buttons
│   └── Statusbar.js         # Position coordinates and zoom indicators
├── style.css                # Base Tailwind CSS and Dark Mode class variables
└── main.js                  # Entry bootloader instantiating engines and overlays
```

---

## 🚀 Getting Started

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) installed.

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/sharmaa-abhi/Inflow.git
   cd Inflow
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Launch local development server:
   ```bash
   npm run dev
   ```

4. Build production bundle:
   ```bash
   npm run build
   ```

---

## 🎹 Keyboard Shortcuts

| Shortcut | Action |
| --- | --- |
| `V` | Select / Drag Tool |
| `R` | Rectangle Drawing Tool |
| `C` | Circle Drawing Tool |
| `D` | Diamond Drawing Tool |
| `L` | Line Drawing Tool |
| `A` | Arrow Drawing Tool |
| `P` | Pen Drawing Tool |
| `T` | Text Drawing Tool |
| `K` | Laser Presentation Tool |
| `Delete` / `Backspace` | Delete Selected Shapes |
| `Ctrl + Z` | Undo Last Command |
| `Ctrl + Shift + Z` | Redo Last Command |
| `Ctrl + C` | Copy Selected Shapes |
| `Ctrl + V` | Paste Copied Shapes |
| `Ctrl + D` | Duplicate Selected Shapes |
| `Ctrl + S` | Export Diagram JSON File |
| `Ctrl + Shift + E` | Export Canvas PNG Image |
| `Ctrl + O` | Import Diagram JSON File |
| `Space + Drag` | Pan Viewport |
| `Mouse Wheel` | Zoom Canvas |
| `Shift (while drawing)` | Lock aspect ratio (Square/Circle) or snap to 45° |

---

## 🔄 Project Evolution & Updates (Initial to Final)

Here is a chronological summary of the updates made to transform the initial repository skeleton into the final, fully-featured whiteboard application:

### 1. Initial State
* Basic Konva stage bootloader skeleton.
* Empty tool files and placeholder canvas styling.
* No shape manipulation, selection bounds, history commands, or export options.

### 2. Core Drawing & Shapes (Milestones 2 & 3)
* **Custom Shape Adapters**: Created Konva.js wrappers for Diamond, Line, Arrow, Pen (freehand paths), and Text (character filling font overrides).
* **Click-and-Drag Creation**: Implemented shape drawing with optional aspect-ratio lock (`Shift`).
* **Text Input Overlay**: Mounted dynamic scaled HTML textareas matching zoom levels for editing text.

### 3. Selection, Transforms & Smart Snapping (Milestones 4 & 5)
* **Transformer Bounds**: Integrated rotation, resizing, and dragging using custom transformer borders.
* **Marquee Multi-Select**: Implemented draggable selection box to group and drag multiple shapes.
* **Smart Snap Alignments**: Built SnapManager rendering dashed vertical/horizontal guidelines to snap elements matching bounding edges/centers of nearby elements.
* **Presentation Laser**: Created glowing laser pointer trails fading after `1000ms`, with pointer dot always visible at cursor during drag gestures.

### 4. History, Clipboard & Persistence (Milestone 6)
* **Autosave Backups**: Configured local storage syncing for canvas states.
* **JSON File Exchange**: Enabled exporting/importing diagram states as structured JSON files.
* **Cropped Image Render**: Built high-resolution PNG generation matching canvas bounding box contours of active shapes.
* **Undo/Redo Actions**: Added stack-based Undo/Redo tracking.
* **Clipboard keybinds**: Added Ctrl+C/V/D/Delete actions.

### 5. Canvas Dark Mode (Milestone 7)
* **Floating Theme Control**: Added a theme toggle in the upper-right corner.
* **Slate-900 Theme Style**: Styled menus and properties inputs in dark glassmorphism.
* **Auto-Contrast Grid**: Adjusted background dot and line colors automatically in dark mode.

### 6. Productivity Controls (Milestone 8)
* **Clear Canvas Action**: Added a trash icon that clears the canvas, fully recoverable via Undo (`Ctrl+Z`).
* **Precise Arrow Nudging**: Enabled moving selection groups by 1px (or 10px with Shift) using keyboard arrows, committing single-group history changes debounced by inactivity.

