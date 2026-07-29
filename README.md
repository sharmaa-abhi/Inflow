# InkFlow – Professional Diagram & Whiteboard Application

InkFlow is a modern, minimal, browser-based diagramming and whiteboard application inspired by Excalidraw and tldraw. Built with high-performance vector rendering via Konva.js and modern styling using Tailwind CSS v4, it provides a fluid and aesthetic drawing environment for creating diagrams, freehand illustrations, and presentations.

👉 **Live Demo:** https://inflow-sigma.vercel.app/


---

## ✨ Features

### 🎨 Advanced Vector Drawing
* Create **Rectangles**, **Ellipses (Circles)**, **Diamonds**, **Straight Lines**, **Arrows**, and **Freehand Pen** trails.
* **Extended Shape Library**: Pill / Stadium, Parallelogram, Trapezoid, Database Cylinder, Cloud, Star, and Speech Callout Bubbles.
* **Sticky Notes**: Colored sticky note boxes with auto-wrapped text, shadow effects, and quick-add neighbor buttons for rapid brainstorming.

### 🖼️ Image & Media Support
* **Drag-and-Drop / Upload**: Drop local images (PNG, JPEG, WebP, SVG) directly onto the canvas with aspect-ratio locking and border controls.
* **SVG Vector Import**: Parse raw SVG XML files and import paths, rects, circles, and polygons as native editable Konva vector nodes.

### ✏️ Hand-Drawn "Rough.js" Sketchy Mode
* Toggle between **Crisp Vector** and **Hand-Drawn / Sketchy** rendering powered by `rough.js`.
* Supports **hachure**, **cross-hatch**, **dot**, and **solid** fill patterns across all shape types.
* Activate with the `H` keyboard shortcut or the toolbar button.

### 🔀 Smart Anchor Points & Orthogonal Arrow Routing
* **Magnetic Anchors**: Interactive connection anchor dots (top, right, bottom, left, center) appear on shape perimeters when drawing lines/arrows near objects.
* **Orthogonal (Manhattan) Routing**: Multi-segment right-angled polyline paths that automatically route between anchor points.
* **Connector Binding**: Arrows and lines snap to anchors and stay connected when shapes are moved or resized.

### 🔍 Interactive Transformations
* Resize, rotate, and drag shapes individually or in groups using custom bounding-box Transformer controls.
* **Z-Index Ordering**: Right-click context menu or keyboard shortcuts to bring to front, send to back, move forward, or move backward.

### 📏 Smart Snapping & Guides
* Automatically snap shapes to centers and edges of nearby elements with temporary pink alignment guide lines.

### ✍️ Multiline Text Editor
* Click-to-type or double-click to edit existing text. Supports custom fonts (Sans-Serif, Serif, and Handwriting/Virgil style), font sizes, and text alignments.

### 🌈 Real-Time Properties Panel
* Live customizations for selected shapes including stroke color palette, custom hex pickers, fill color support, stroke widths (thin/medium/thick), stroke styles (solid/dashed/dotted), and opacity ranges.

### 🔦 Presentation Laser Pointer
* Glowing red laser trail that follows your cursor and fades away automatically within 1000ms — perfect for sharing screens.

### 🧊 3D Preview Extrusion
* Live isometric 3D mesh preview modal rendering canvas shapes as extruded 3D objects with interactive mouse-drag rotation controls.

### 🌙 Canvas Dark Mode
* Toggle gorgeous slate-900 glassmorphism UI from the upper-right corner. Canvas grids, dots, select boxes, context menus, property panels, and tooltips adapt their contrast automatically.

### 💾 Document Persistence
* **Autosave**: Automatically debounces and auto-saves diagram states to LocalStorage.
* **JSON Import / Export**: Import and export diagrams as versioned JSON schemas.
* **PNG Export**: Export canvas as a high-density, cropped PNG file matching only the bounding region of drawn shapes.

### ↩️ Command History
* Complete Undo (`Ctrl+Z`) and Redo (`Ctrl+Shift+Z`) commands.

### 📋 Clipboard Controls
* Universal keyboard shortcuts for copy (`Ctrl+C`), paste (`Ctrl+V`), duplicate (`Ctrl+D`), and delete (`Delete` / `Backspace`).

### 🖱️ Right-Click Context Menu
* Context-aware menu with z-ordering actions (Bring to Front, Send to Back, Bring Forward, Send Backward), clipboard operations (Copy, Paste, Duplicate), and Delete — all with shortcut hints.

### 🛡️ Custom Tooltips
* Styled hover tooltip system replacing native browser `title` attributes, adapting to dark/light themes automatically.

### 📱 Mobile Responsive Experience
* Adaptive bottom sheets, responsive toolbars, and touch handle adapters for mobile and tablet devices. CSS-driven breakpoint at 768px automatically switches between desktop and mobile UI.

---

## 🛠️ Architecture & Module Structure

InkFlow is structured into decoupled, event-driven modules that communicate via a central `EventBus`:

```
src/
├── core/
│   ├── CanvasEngine.js          # Manages Konva stage, panning, zooming, and grid drawing
│   └── EventBus.js              # Lightweight pub/sub dispatcher for decoupling managers
├── managers/
│   ├── AnchorManager.js         # Smart connection anchors and connector re-routing
│   ├── ToolManager.js           # Active tool switching, keyboard shortcuts, z-ordering
│   ├── ShapeManager.js          # Shapes state, selection groups, clipboard, rough mode relay
│   ├── HistoryManager.js        # Stack-based Undo/Redo command registry
│   ├── StyleManager.js          # Current default styles, rough mode toggle, propagation
│   ├── SnapManager.js           # Snapping mechanics and alignment computations
│   ├── ThemeManager.js          # Dark/light toggles and theme configurations
│   ├── PersistenceManager.js    # Autosave, JSON imports/exports, and cropped PNGs
│   └── ThreeDPreviewManager.js  # Isometric 3D mesh preview renderer modal
├── shapes/                      # Adapters mapping data models to Konva.js nodes
│   ├── BaseShape.js             # Abstract shape with geometries, styling, and rough rendering
│   ├── RectShape.js             # Rectangle shape node
│   ├── CircleShape.js           # Ellipse shape node
│   ├── DiamondShape.js          # Custom closed polygon Line shape
│   ├── LineShape.js             # Straight line shape segment
│   ├── ArrowShape.js            # Konva.Arrow shape segment
│   ├── PenShape.js              # Freehand line path shape
│   ├── TextShape.js             # Word-wrapped Konva.Text shape
│   ├── ImageShape.js            # Bitmap image node with aspect-ratio locking
│   ├── StickyNoteShape.js       # Colored sticky note with auto-wrapped text
│   ├── PillShape.js             # Pill / Stadium rounded rectangle
│   ├── ParallelogramShape.js    # Parallelogram polygon
│   ├── TrapezoidShape.js        # Trapezoid polygon
│   ├── CylinderShape.js         # Database cylinder shape
│   ├── CloudShape.js            # Cloud shape (bezier curves)
│   ├── StarShape.js             # Multi-point star polygon
│   └── SpeechBubbleShape.js     # Speech callout bubble shape
├── tools/                       # Interactive tool action strategies
│   ├── BaseTool.js              # Abstract tool hooks
│   ├── SelectTool.js            # Marquee select, transforms, multi-dragging
│   ├── ShapeTool.js             # Click-and-drag shape creator (all shape types)
│   ├── PenTool.js               # Brush stroke line path creator
│   ├── TextTool.js              # Input overlay textarea injector
│   ├── LaserTool.js             # Glowing pointer trail tracker
│   ├── ImageTool.js             # File upload & drag-and-drop image placer
│   └── StickyTool.js            # Sticky note creator with neighbor quick-add
├── ui/                          # Floating UI panels and overlays
│   ├── Toolbar.js               # Left/Top tools button drawer with extended shapes popover
│   ├── PropertiesPanel.js       # Style editing controllers
│   ├── Sidebar.js               # File and history buttons
│   ├── Statusbar.js             # Position coordinates and zoom indicators
│   ├── ContextMenu.js           # Right-click context menu with z-ordering & clipboard
│   └── Tooltip.js               # Custom styled tooltip system
├── utils/                       # Shared utilities
│   ├── colors.js                # Color palette definitions and utilities
│   ├── helpers.js               # ID generation, debounce, and misc helpers
│   ├── math.js                  # Geometry and math computations
│   ├── roughRenderer.js         # Rough.js OffscreenCanvas renderer for sketchy mode
│   ├── routing.js               # Orthogonal (Manhattan) path routing utility
│   └── svgParser.js             # SVG XML parser to native Konva nodes
├── mobile-ui.js                 # Mobile responsive UI: bottom sheets, touch adapters
├── mobile-components.css        # Mobile-specific component styles
├── style.css                    # Base Tailwind CSS and Dark Mode class variables
└── main.js                      # Entry bootloader instantiating engines and overlays
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
| `H` | Toggle Hand-Drawn Sketchy Mode |
| `Delete` / `Backspace` | Delete Selected Shapes |
| `Ctrl + Z` | Undo Last Command |
| `Ctrl + Shift + Z` | Redo Last Command |
| `Ctrl + C` | Copy Selected Shapes |
| `Ctrl + V` | Paste Copied Shapes |
| `Ctrl + D` | Duplicate Selected Shapes |
| `Ctrl + S` | Export Diagram JSON File |
| `Ctrl + Shift + E` | Export Canvas PNG Image |
| `Ctrl + O` | Import Diagram JSON File |
| `]` | Bring to Front |
| `Ctrl + ]` | Bring Forward |
| `[` | Send to Back |
| `Ctrl + [` | Send Backward |
| `Arrow Keys` | Nudge Selected Shapes by 1px |
| `Shift + Arrow Keys` | Nudge Selected Shapes by 10px |
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

### 7. Smart Anchors & Orthogonal Routing (Milestone 9)
* **AnchorManager**: Interactive connection anchors (top, right, bottom, left, center) rendered on shape perimeters when drawing lines/arrows near objects, with configurable snap and visibility radii.
* **Manhattan Routing**: Multi-segment orthogonal polyline path computation between anchor points via `routing.js`.
* **Connector Binding**: Arrows stay connected when bound shapes move or resize.

### 8. Hand-Drawn Rough.js Mode (Milestone 10)
* **Rough.js Integration**: Toggle between crisp vector and hand-drawn sketchy rendering via `roughRenderer.js` using OffscreenCanvas.
* **Fill Patterns**: Support for hachure, cross-hatch, dot, and solid fill textures across all shape types.
* **Global Toggle**: `H` key or toolbar button toggles rough mode; persists across new shapes and scene loads.

### 9. Extended Shapes, Images & Sticky Notes (Milestone 11)
* **Extended Shape Library**: Added Pill/Stadium, Parallelogram, Trapezoid, Cylinder, Cloud, Star, and Speech Bubble shapes with an expanded toolbar popover.
* **Image Tool**: Drag-and-drop and file upload support for PNG, JPEG, WebP, and SVG images with aspect-ratio locking.
* **Sticky Notes**: Colored sticky note shapes with auto-wrapped text, shadow effects, and quick-add neighbor buttons for rapid brainstorming.
* **SVG Import Parser**: Parse raw SVG XML files (`<path>`, `<rect>`, `<circle>`, `<polygon>`) into native editable Konva vector nodes.

### 10. Context Menu, Tooltips & Mobile UI (Milestone 12)
* **Right-Click Context Menu**: Context-aware menu with z-ordering (Bring to Front/Forward, Send to Back/Backward), clipboard operations, and delete — all with keyboard shortcut hints.
* **Custom Tooltip System**: Styled tooltips replacing native `title` attributes, automatically adapting to dark/light themes.
* **3D Preview Extrusion**: Live isometric 3D mesh preview modal with interactive mouse-drag rotation.
* **Mobile Responsive UI**: Adaptive bottom sheets, responsive toolbars, and touch handle adapters with CSS-driven breakpoint at 768px.
