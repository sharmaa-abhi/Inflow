# 🌊 Inflow – The Master Architectural, Algorithmic & Product Specification

> **Complete Comprehensive Reference Document**  
> *Everything from Architecture, Algorithms, Features, Bug Resolutions, UI/UX System, and Strategic Roadmap in One Document.*

---

# 📑 Table of Contents
1. [Executive Summary & Tech Stack](#1-executive-summary--tech-stack)
2. [Folder Hierarchy & Architecture Design](#2-folder-hierarchy--architecture-design)
3. [Complete Feature Catalog](#3-complete-feature-catalog)
4. [Mathematical & Algorithmic Foundations](#4-mathematical--algorithmic-foundations)
5. [Algorithmic Time Complexity & Performance Engineering](#5-algorithmic-time-complexity--performance-engineering)
6. [Comprehensive Bug Audit & Resolution Index (All 17 Bugs)](#6-comprehensive-bug-audit--resolution-index)
7. [UI/UX & Mobile Responsive Design System](#7-uiux--mobile-responsive-design-system)
8. [Keyboard Shortcuts & Touch Gestures Reference](#8-keyboard-shortcuts--touch-gestures-reference)
9. [Strategic Product Roadmap (v2.1 → v3.2)](#9-strategic-product-roadmap)
10. [Developer Setup & Build Guide](#10-developer-setup--build-guide)

---

# 1. Executive Summary & Tech Stack

**Inflow** is a modern, high-performance visual whiteboard, diagramming, and collaborative sketching studio built with HTML5 Canvas, Konva.js, and Tailwind CSS v4. Inspired by the simplicity of Excalidraw and the power of tldraw, Inflow delivers a responsive, dual-aesthetic canvas allowing users to switch seamlessly between crisp precision vectors and hand-drawn organic sketch illustrations.

### 🛠️ Core Technology Stack
- **Vector Canvas Engine**: `Konva.js (v10.3.0)` — High-performance 2D Canvas scene graph library.
- **Organic Sketch Renderer**: `Rough.js (v4.6.6)` — Procedural hand-drawn line, ellipse, and pattern fill generator.
- **Build System**: `Vite (v8.1.1+)` — Lightning-fast ES Module bundler and dev server.
- **Styling Architecture**: `Tailwind CSS v4 (@tailwindcss/vite)` — Modern CSS utility tokens and glassmorphism styling.
- **Typography & Font Stack**:
  - `Geist` (Sans & Mono by Vercel CDN)
  - `Caveat` / `Virgil` (Handwritten organic font)
  - `Architects Daughter` (Architectural sketching font)
  - `Fira Code` / `Cascadia` (Monospace code & math)
  - `Inter` (Clean UI sans-serif)
- **Event Bus Pattern**: Centralized Pub/Sub Event Bus (`EventBus.js`) providing complete decoupling between canvas tools, shape nodes, state managers, and DOM views.

---

# 2. Folder Hierarchy & Architecture Design

```
c:\Excelidraw\
├── dist/                         # Production optimized build output
├── public/                       # Static public assets (favicon.svg, icons, sample images)
├── src/
│   ├── core/
│   │   ├── CanvasEngine.js       # 6-layer Konva stage, infinite viewport, zoom & pan engine
│   │   └── EventBus.js           # Decoupled publish/subscribe event dispatcher
│   ├── managers/
│   │   ├── AnchorManager.js      # Magnetic connection anchors & connector route updates
│   │   ├── HistoryManager.js     # Undo/Redo stack with size bounding & state notifications
│   │   ├── PersistenceManager.js # LocalStorage autosave, JSON/PNG/SVG/PDF export & demo loader
│   │   ├── ShapeManager.js       # Shape registry, z-index hierarchy, selection & serialization
│   │   ├── SnapManager.js        # Edge & center alignment snapping guides
│   │   ├── StyleManager.js       # Active stroke, fill, width, font & opacity state
│   │   ├── ThemeManager.js       # Dark / Light theme switching & persistent user preference
│   │   ├── ThreeDPreviewManager.js # Live isometric 3D layer extrusion preview modal
│   │   └── ToolManager.js        # Active tool state machine, keyboard shortcuts & nudging
│   ├── shapes/
│   │   ├── BaseShape.js          # Abstract base class for all canvas nodes (Konva + Rough bridge)
│   │   ├── RectShape.js          # Rectangle & rounded box
│   │   ├── CircleShape.js        # Ellipse & circle
│   │   ├── DiamondShape.js       # Decision diamond
│   │   ├── LineShape.js          # Straight line & connector polyline
│   │   ├── ArrowShape.js         # Directional arrow & labeled connector
│   │   ├── PenShape.js           # Freehand vector stroke path with adaptive smoothing
│   │   ├── TextShape.js          # Multiline rich text node with custom fonts
│   │   ├── ImageShape.js         # Raster image container with aspect locking & borders
│   │   ├── StickyNoteShape.js    # Colored sticky note with auto-wrapped text & shadows
│   │   ├── SvgShape.js           # Raw SVG XML vector parser & editable group container
│   │   ├── PillShape.js          # Stadium / Pill node
│   │   ├── ParallelogramShape.js # Flowchart I/O data node
│   │   ├── TrapezoidShape.js     # Flowchart manual operation node
│   │   ├── CylinderShape.js      # Database & storage cylinder
│   │   ├── CloudShape.js         # Cloud network & architecture node
│   │   ├── StarShape.js          # 5-pointed decorative star
│   │   └── SpeechBubbleShape.js  # Callout bubble with adjustable tail
│   ├── tools/
│   │   ├── BaseTool.js           # Tool abstract interface
│   │   ├── SelectTool.js         # Bounding box marquee, transformations & double-click editors
│   │   ├── ShapeTool.js          # Geometric shape drag-creation tool
│   │   ├── PenTool.js            # Freehand drawing tool with live point capture
│   │   ├── TextTool.js           # Inline canvas text editor with floating toolbar
│   │   ├── StickyTool.js         # Fast sticky note spawner
│   │   ├── EraserTool.js         # Point-to-segment eraser for vector paths
│   │   ├── LaserTool.js          # Fading laser pointer trail for presentations
│   │   ├── ImageTool.js          # Image placement & upload handler
│   │   └── HandTool.js           # Space-drag & middle-click canvas panning
│   ├── ui/
│   │   ├── ContextMenu.js        # Right-click contextual action menu
│   │   ├── KeyboardShortcutsModal.js # Categorized shortcut cheat-sheet dialog
│   │   ├── MainMenu.js           # Top-left dropdown menu (Excalidraw style)
│   │   ├── PropertiesPanel.js    # Floating contextual properties inspector
│   │   ├── Sidebar.js            # Left extended tool selector
│   │   ├── Statusbar.js          # Bottom-right zoom, coordinates & shape count HUD
│   │   ├── TextFormattingToolbar.js # Floating rich-text toolbar (Bold, Italic, Align, Fonts)
│   │   ├── Toolbar.js            # Top-center floating tool dock
│   │   └── Tooltip.js            # Styled dark/light hover tooltip system
│   ├── utils/
│   │   ├── colors.js             # Categorized color palettes, converters (Hex/RGB/HSL)
│   │   ├── demoSheetData.js      # Interactive tutorial & architecture playground canvas
│   │   ├── fontUtils.js          # Font preloader, family definitions & metric resolvers
│   │   ├── helpers.js            # Debounce, throttle, UID generators
│   │   ├── math.js               # RDP, ERDP, AABB, rotation matrices & distance formulas
│   │   ├── roughRenderer.js      # Offscreen rough.js bitmap rasterizer
│   │   ├── routing.js            # Manhattan orthogonal connector router
│   │   ├── svgParser.js          # SVG XML path converter
│   │   └── watercolorPaper.js    # Procedural canvas paper background shader
│   ├── mobile-components.css     # Mobile bottom sheets, touch handles & responsive styling
│   ├── mobile-ui.js              # Touch gesture adapter, sheet animations & swipe-to-dismiss
│   ├── style.css                 # Global design system tokens & glassmorphism
│   └── main.js                   # Application bootstrap & lifecycle orchestrator
├── index.html                    # Main HTML5 entry point with Geist font integration
├── package.json                  # Dependencies, build scripts & metadata
└── vite.config.js                # Vite build config with Tailwind CSS plugin
```

---

# 3. Complete Feature Catalog

### 🖌️ Canvas & Vector Engine
1. **Multi-Layer Architecture**: Dedicated 6-layer Konva rendering stack (`background`, `shapes`, `pen`, `text`, `selection`, `overlay`) guaranteeing zero z-index conflicts between tools, guides, and canvas nodes.
2. **18 Vector Shape Types**: Complete vector library spanning standard geometry (Rect, Circle, Diamond, Line, Arrow), extended flowchart shapes (Pill, Cloud, Cylinder, Star, Trapezoid, Parallelogram, Speech Bubble), and rich objects (Sticky Notes, Text, Image, SVG).
3. **Dual Aesthetics (Crisp Vector vs Rough.js Sketchy)**: Toggle instantly between pixel-perfect vector rendering and organic hand-drawn illustrations with customizable textures (hachure, cross-hatch, dots, solid).
4. **Smart Anchor Magnetism**: Automatic 5-point magnetic connection anchors on shape perimeters (Top, Right, Bottom, Left, Center).
5. **Orthogonal Manhattan Connector Routing**: Polyline connector paths that automatically calculate right-angle bends and update dynamically when shapes move.
6. **Smart Object Snapping & Alignment Guides**: Dynamic snapping to edges and centers of adjacent objects with dashed red guidelines.
7. **Bounding Box Transformations**: Scale, rotate, translate, flip, and multi-select marquee drag with custom Konva transformer styling.
8. **Live 3D Isometric Preview**: Extrudes 2D canvas layers into an interactive 3D stacked view with live mouse-drag rotation.
9. **Presentation Laser Pointer**: Glowing fading neon laser trail with continuous cursor tracking for real-time demonstrations.
10. **Procedural Watercolor Canvas**: Procedural noise paper texture rendering on canvas background.

### 📱 User Interface & Interactions
1. **Glassmorphism Design System**: Tailored dark and light themes with smooth backdrop blurs, crisp contrast, and theme persistence in `localStorage`.
2. **Floating Contextual Properties Panel**: Dynamically opens on shape selection to edit colors, fill styles, stroke width, opacity, geometry, and z-ordering.
3. **Floating Rich Text Formatting Toolbar**: Appears on text selection/editing for instant 1-click control over font family, font size, bold, italic, underline, strikethrough, and alignment.
4. **Mobile Responsive Suite**: Adaptive bottom sheets, touch handle multipliers, swipe-to-dismiss sheet gestures, and touch toolbar adapters.
5. **Right-Click Context Menu**: Instant access to cut, copy, paste, duplicate, delete, and 4-tier z-ordering (Bring to Front, Send to Back, Bring Forward, Send Backward).
6. **Custom Themed Tooltips**: Non-intrusive hover tooltips matching dark/light themes.

---

# 4. Mathematical & Algorithmic Foundations

### 4.1 Ramer-Douglas-Peucker (RDP) & Enhanced (ERDP) Curve Simplification
- **Files**: [`src/utils/math.js`](file:///c:/Excelidraw/src/utils/math.js)
- **Mathematical Principle**: Given a curve composed of $n$ line segments, RDP finds a similar curve with fewer points. The algorithm calculates the perpendicular distance from every intermediate point to the line connecting endpoints. Points exceeding threshold $\epsilon$ are preserved, while flat vertices are pruned.
- **Enhanced ERDP Extension**: Computes dynamic significance weights based on:
  1. **Local Curvature**: Angular deflection $\theta = \arccos\left(\frac{\mathbf{u} \cdot \mathbf{v}}{\|\mathbf{u}\| \|\mathbf{v}\|}\right)$.
  2. **Drawing Velocity**: Dynamic sampling where slow deliberate strokes retain precision and fast sweeps are aggressively simplified.
  3. **Point Density Clustering**: Distance-based thinning prior to recursive subdivision.

### 4.2 Orthogonal (Manhattan) Connector Routing Algorithm
- **File**: [`src/utils/routing.js`](file:///c:/Excelidraw/src/utils/routing.js)
- **Mathematical Principle**: Calculates right-angled polyline coordinates $[x_1, y_1, \dots, x_k, y_k]$ connecting anchor points. Evaluates exit normal vectors from source anchor, initial stub offset ($d = 20\text{px}$), mid-point inflection axis, and entry normal into target anchor, selecting optimal 3-segment Z-bends or 2-segment L-bends.

### 4.3 2D Affine Rotation & Axis-Aligned Bounding Box (AABB)
- **File**: [`src/utils/math.js`](file:///c:/Excelidraw/src/utils/math.js)
- **Mathematical Formulation**: Rotates each bounding vertex $(x, y)$ around shape origin $(x_0, y_0)$ by angle $\theta$:
  $$\begin{bmatrix} x' \\ y' \end{bmatrix} = \begin{bmatrix} \cos\theta & -\sin\theta \\ \sin\theta & \cos\theta \end{bmatrix} \begin{bmatrix} x - x_0 \\ y - y_0 \end{bmatrix} + \begin{bmatrix} x_0 \\ y_0 \end{bmatrix}$$
  The enclosing AABB is defined by $[\min(x'_i), \min(y'_i), \max(x'_i) - \min(x'_i), \max(y'_i) - \min(y'_i)]$.

---

# 5. Algorithmic Time Complexity & Performance Engineering

To maintain a **strict 60–120 FPS frame budget (under 8.3ms – 16.6ms per frame)** for complex diagrams with **10,000+ to 50,000+ elements**, Inflow optimizes operations across computational time and space complexities.

### 📊 Asymptotic Complexity Matrix

| Operational Pipeline | Current Complexity | Target Optimized Complexity | Optimization Technique |
| :--- | :--- | :--- | :--- |
| **Canvas Hit-Testing / Selection** | $O(N)$ linear stage search | **$O(\log N + K)$** | **2D R-Tree (`rbush`) / Bounding Volume Hierarchy** |
| **Marquee Box Intersection** | $O(N)$ brute-force AABB check | **$O(\log N + K)$** | **Spatial Range Search via 2D Quadtree** |
| **SnapManager Edge Alignment** | $O(N)$ full canvas scan | **$O(K)$** localized query | **Uniform Spatial Hash Grid (256px cells)** |
| **Anchor Point Proximity Snap** | $O(N \cdot A)$ loop (5 anchors/shape)| **$O(\log N)$** | **Radial k-d Tree / Nearest-Neighbor Grid** |
| **Freehand Path Simplification** | $O(P^2)$ worst-case RDP | **$O(P \log P)$** | **Adaptive Velocity RDP with Convex Splitting** |
| **Eraser Path Segment Collision** | $O(M \cdot P)$ distance checks | **$O(M \log P)$** | **Segment BVH Tree & AABB Pre-filtering** |
| **Obstacle-Avoiding Routing** | $O(V \cdot E)$ full graph search | **$O(K \log K)$** | **A* with Jump Point Search (JPS)** |
| **Undo / Redo History Stack** | $O(N)$ state snapshot cloning | **$O(1)$ memory & time** | **JSON Patch (RFC 6902) Structural Deltas** |
| **Canvas Frame Render Loop** | $O(N_{\text{total}})$ submitting all draw calls | **$O(K_{\text{visible}})$** | **Frustum Viewport Culling & Dirty Rect Repaints** |
| **Sketchy Rough.js Generation** | $O(P \cdot \text{Rough})$ recalculating/frame| **$O(1)$ blit** | **Offscreen Bitmap Memoization / Caching** |
| **Pointer Event Dispatching** | $O(E)$ unthrottled event handlers | **$O(1)$ per rAF tick** | **`requestAnimationFrame` Event Coalescing** |

*Notation: $N$ = total canvas elements, $K$ = visible elements in viewport, $P$ = path vertices, $A$ = anchors per shape, $M$ = eraser segments, $E$ = incoming raw pointer events.*

---

# 6. Comprehensive Bug Audit & Resolution Index

All 17 identified and audited bugs in the codebase have been diagnosed, resolved, and verified in the production build.

```
BUG AUDIT RESOLUTION STATUS
┌────────────────────────────────────────────────────────┐
│ 🔴 Critical Bugs  :  8 Found   │   8 Fixed (100%)      │
│ 🟡 Medium Bugs    :  6 Found   │   6 Fixed (100%)      │
│ 🟢 Low Bugs       :  3 Found   │   3 Fixed (100%)      │
├────────────────────────────────────────────────────────┤
│ TOTAL AUDITED     : 17 Bugs    │  17 Verified Fixed    │
└────────────────────────────────────────────────────────┘
```

### 🔴 Critical Bugs (8 / 8 Fixed)
1. **BUG-001 / FLAW-001 (Theme Toggle Crash)**:
   - *Problem*: `MainMenu.js` called `themeManager.toggle()`, which was undefined on `ThemeManager`.
   - *Fix*: Added standard `toggle()` method to `ThemeManager.js` and wired click event properly.
2. **BUG-002 / FLAW-003 (Mobile Delete Shape Clears Canvas)**:
   - *Problem*: Mobile properties sheet delete button called `#btn-clear.click()`, wiping the entire canvas.
   - *Fix*: Re-wired button in `main.js` to call `toolManager.deleteSelectedShapes()`.
3. **BUG-003 / FLAW-004 (Ghost Shapes on File Import)**:
   - *Problem*: `PersistenceManager.js` cleared `shapeManager.shapes` Map without calling `destroy()` on Konva nodes, leaving unselectable ghost shapes on canvas.
   - *Fix*: Explicitly iterates through all existing shapes calling `s.destroy()` and `shapeLayer.destroyChildren()` before instantiating imported shapes.
4. **BUG-004 / FLAW-005 (Sketchy Mode Shape Disappearance)**:
   - *Problem*: Extended shapes (cylinder, cloud, speech bubble, star, etc.) turned invisible in Sketchy mode.
   - *Fix*: Added path generators to `roughRenderer.js` and implemented graceful fallback in `BaseShape.renderRoughWith()`.
5. **BUG-005 / FLAW-006 (SVG Import Untracked Nodes)**:
   - *Problem*: SVG XML import appended raw Konva groups without registering them in `shapeManager`.
   - *Fix*: Implemented `SvgShape.js` extending `BaseShape` with full selection, serialization, and undo/redo support.
6. **BUG-006 / FLAW-007 (Connector Label Edit Undo)**:
   - *Problem*: Editing connector text bypassed `HistoryManager`.
   - *Fix*: Registered old and new label text mutations into `historyManager.registerChange({ undo, redo })`.
7. **BUG-007 / FLAW-008 (Mobile Touch Double-Tap)**:
   - *Problem*: Touch devices don't emit `event.evt.detail === 2`, preventing double-tap inline text editing.
   - *Fix*: Added timestamp tracking `_lastTapTime` in `SelectTool.js` detecting double-taps within $300\text{ms}$.
8. **BUG-014 / FLAW-002 (Properties Panel Delete Selection Button)**:
   - *Problem*: `PropertiesPanel.js` called nonexistent `toolManager.deleteSelected?.()`.
   - *Fix*: Corrected method call to `toolManager.deleteSelectedShapes()`.

### 🟡 Medium Bugs (6 / 6 Fixed)
9. **BUG-008 / FLAW-009 (Grid Renderer Layout Thrashing)**:
   - *Problem*: `document.body.classList.contains('dark')` was queried inside `sceneFunc` during every pan/zoom frame.
   - *Fix*: Cached `this.isDark` boolean on `CanvasEngine`, updated exclusively on `theme-changed` event.
10. **BUG-009 / FLAW-010 (Snapping Matrix Overhead)**:
    - *Problem*: Calling `getClientRect()` on all shapes caused matrix recomputation during drag.
    - *Fix*: Scoped bounding box queries relative to `shapeLayer` and added spatial grid roadmap design.
11. **BUG-010 (Slider Undo Flooding)**:
    - *Problem*: Dragging opacity and smoothing sliders pushed dozens of undo entries.
    - *Fix*: Debounced property changes to register history entries on final change (mouseup).
12. **BUG-011 (Unbounded History Memory Growth)**:
    - *Problem*: Long sessions accumulated hundreds of closures in undo stack.
    - *Fix*: Added hard cap `this.maxStackSize = 50` in `HistoryManager.js` with automatic oldest action eviction.
13. **BUG-015 / FLAW-012 (File Import State Corruption)**:
    - *Problem*: Corrupted JSON files cleared canvas before verifying validity.
    - *Fix*: Validated format headers prior to clearing canvas in `PersistenceManager.js`.
14. **BUG-016 (Mobile Theme Icon Desync)**:
    - *Problem*: Mobile sun/moon icons did not update when theme was toggled from desktop menu.
    - *Fix*: Subscribed mobile icons directly to `eventBus.on('theme-changed')` in `main.js`.

### 🟢 Low Bugs (3 / 3 Fixed)
15. **BUG-012 (Production Console.log Pollution)**: Removed debug logs from `Tooltip.js`.
16. **BUG-013 (Favicon Path)**: Corrected favicon path to `/favicon.svg` in `index.html`.
17. **BUG-017 (Z-Index Stepper Clamping)**: Clamped input values between `0` and `allShapes.length - 1` in `PropertiesPanel.js`.

---

# 7. UI/UX & Mobile Responsive Design System

### 🖥️ Desktop UI Layout
- **Top-Left Main Menu**: Accessible hamburger button opening an Excalidraw-style dropdown containing file imports/exports, canvas grid selector, snapping toggle, and theme controls.
- **Top-Center Floating Dock**: Glassmorphism tool dock hosting Select, Hand, Rect, Circle, Diamond, Line, Arrow, Pen, Text, Sticky Note, Laser, and Extended Shapes popover.
- **Floating Properties Panel**: Contextual panel sliding out when shapes are selected, providing custom stroke/fill palettes, stroke widths, dash patterns, opacity, typography, and 3D preview toggle.
- **Floating Text Formatting Toolbar**: Inline floating toolbar hovering above active text elements for instant styling.
- **Bottom-Right Statusbar**: Live zoom percentage with 1-click reset, pointer world coordinates $(X, Y)$, and active shape count.

### 📱 Mobile & Tablet Responsive Architecture (`BREAKPOINT = 768px`)
- **Adaptive Bottom Sheets**: Properties inspector transforms into a native-feeling swipe-to-dismiss bottom sheet (`#props-sheet`).
- **Touch Transform Multipliers**: Konva transformer corner handles dynamically scale up on touch screens for easy finger-grab manipulation.
- **Pen Quick-Settings**: Contextual header button appears automatically when Pen tool is selected to adjust stroke width and smoothing without obscuring canvas.
- **Responsive Viewport Scaling**: Touch gestures support two-finger pinch-to-zoom and two-finger pan navigation.

---

# 8. Keyboard Shortcuts & Touch Gestures Reference

| Shortcut | Tool / Action | Scope |
| :--- | :--- | :--- |
| `V` / `1` | **Select Tool** (Transformer & Multi-select) | Global |
| `H` / `Space + Drag` | **Hand Tool** (Canvas Panning) | Global |
| `R` / `2` | **Rectangle Tool** | Global |
| `C` / `4` | **Circle / Ellipse Tool** | Global |
| `D` | **Diamond Tool** | Global |
| `L` / `6` | **Line Tool** | Global |
| `A` / `7` | **Arrow Tool** | Global |
| `P` / `8` | **Pen Tool** (Freehand vector drawing) | Global |
| `T` | **Text Tool** (Rich inline text) | Global |
| `S` / `9` | **Sticky Note Tool** | Global |
| `K` | **Presentation Laser Pointer** | Global |
| `E` | **Eraser Tool** | Global |
| `Ctrl + Z` | **Undo** | Global |
| `Ctrl + Shift + Z` / `Ctrl + Y` | **Redo** | Global |
| `Ctrl + C` | **Copy Selected Shapes** | Selection |
| `Ctrl + X` | **Cut Selected Shapes** | Selection |
| `Ctrl + V` | **Paste Shapes** | Global |
| `Ctrl + D` | **Duplicate Selected Shapes** | Selection |
| `Delete` / `Backspace` | **Delete Selected Shapes** | Selection |
| `Arrow Keys` | **Nudge Shapes** (1px step) | Selection |
| `Shift + Arrow Keys` | **Fast Nudge** (10px step) | Selection |
| `Ctrl + [` | **Send Backward** (Z-index -1) | Selection |
| `Ctrl + ]` | **Bring Forward** (Z-index +1) | Selection |
| `Ctrl + Shift + [` | **Send to Back** (Lowest Z-index) | Selection |
| `Ctrl + Shift + ]` | **Bring to Front** (Highest Z-index) | Selection |
| `Ctrl + Wheel` / `Pinch` | **Smooth Exponential Zoom** | Canvas |
| `Shift + Wheel` | **Horizontal Pan** | Canvas |
| `Shift + Click` | **Multi-Selection Toggle** | Canvas |
| `Double Click / Double Tap`| **Edit Text or Connector Label** | Canvas |
| `Escape` | **Deselect All / Close Panels** | Global |

---

# 9. Strategic Product Roadmap

```
                                  INFLOW ROADMAP OVERVIEW
 ┌────────────────────────┐  ┌────────────────────────┐  ┌────────────────────────┐
 │   Track A: UI/UX &     │  │  Track B: Multiplayer  │  │  Track C: Presentation │
 │   Design Studio 2.0    │  │  & Cloud Workspaces    │  │   Frames & Connectors  │
 └───────────┬────────────┘  └───────────┬────────────┘  └───────────┬────────────┘
             │                           │                           │
 ┌───────────┴────────────┐  ┌───────────┴────────────┐  ┌───────────┴────────────┐
 │  Track D: AI Smart     │  │  Track E: Multi-Format │  │  Track F: Low-Latency  │
 │  Whiteboard Assistant  │  │  Ecosystem & Interop   │  │  Spatial Perf Engine   │
 └────────────────────────┘  └────────────────────────┘  └────────────────────────┘
```

### 🎨 Track A: UI/UX & Design Studio 2.0
- **Contextual Quick-Action Floating Bar (Mini-Toolbar)**: Selection-anchored HUD directly above selected shapes for 1-click stroke, fill, width, duplicate, and delete actions.
- **Layers, Objects & Pages Tree View**: Expandable drawer with visual z-index drag-and-drop reordering, lock/hide toggles, and multi-sheet whiteboard tabs.
- **Command Palette (`Cmd/Ctrl + K`)**: Universal spotlight fuzzy-search modal for tools, actions, exports, and shapes.
- **Radar Minimap Navigator**: Interactive bottom-right minimap with live thumbnail viewport preview.
- **Custom Color Palette Engine**: OKLCH / HSL color picker modal, native Eyedropper API tool, and gradient fill builder.
- **Infinite Canvas Grid Presets**: Dot Grid, Square Graph, Isometric Grid, Blueprint, Ruled/Lined, and Watercolor Paper modes.
- **Zen / Focus Mode**: Auto-collapsing or dimming UI chrome during active drawing.

### 🌐 Track B: Real-Time Multiplayer Collaboration & Cloud Workspace
- **Yjs / Automerge CRDT Sync**: Real-time multi-user drawing with zero conflict data loss ($O(\log N)$ reconciliation).
- **Live Multiplayer Cursors**: Remote cursors with collaborator name tags, avatars, and selection highlights.
- **Cloud Workspace Dashboard**: Cloud project folders (Supabase/Firebase), OAuth login, and shareable permission links.
- **Canvas Comment Pins**: Threaded comment pins on canvas with @mentions and status tracking.
- **Visual Snapshot History Diff**: Interactive timeline slider to compare and restore past snapshots.

### 🎯 Track C: Presentation, Frames & Advanced Connectors
- **Frame Containers / Artboards**: Group shapes inside named bounding Frames (`Slide 1`, `Mobile Mockup`, `Architecture`).
- **Interactive Presentation Mode**: Fullscreen presenter view with smooth animated camera transitions between Frames.
- **Connector Path Text Badges**: Double-click line/arrow connectors to attach floating editable text labels.
- **Curved Bézier Connectors**: Smooth spline curves with interactive tangent control handles.

### 🤖 Track D: AI Smart Whiteboard & Diagram Intelligence
- **Text-to-Diagram Generator**: Natural language prompting to automatically generate flowcharts, mind maps, and ER diagrams via LLM API.
- **Freehand Stroke Auto-Cleanup**: AI shape recognition converting rough hand-drawn strokes into clean geometric vectors in $O(P)$ time.
- **LaTeX Math Formula Rendering**: KaTeX / MathJax rendering support for mathematical equations.

### ⚡ Track E & F: Ecosystem Interoperability & High Performance
- **Multi-Page PDF & Clean SVG Export**: Vector-quality export with embedded CSS styling and custom fonts.
- **Excalidraw & tldraw Sync**: Bidirectional import and export of `.excalidraw` and `.tldraw` JSON schemas.
- **2D R-Tree Spatial Indexing (`rbush`)**: Frustum viewport culling rendering only visible shapes for 20,000+ elements at 60 FPS.
- **Web Worker Thread Pool**: Background offloading for PDF rasterization, image filters, and 3D mesh computations.

---

# 10. Developer Setup & Build Guide

### Prerequisites
- **Node.js**: `v18.0.0` or higher
- **npm**: `v9.0.0` or higher

### Quick Start

1. **Clone repository**:
   ```bash
   git clone https://github.com/sharmaa-abhi/Inflow.git
   cd Inflow
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start local development server**:
   ```bash
   npm run dev
   ```
   *Vite server will start locally at `http://localhost:5173/` with Hot Module Replacement (HMR).*

4. **Compile production build**:
   ```bash
   npm run build
   ```
   *Generates optimized client bundle in `dist/` with gzip size analysis.*

5. **Preview production bundle**:
   ```bash
   npm run preview
   ```

---

*Inflow Master Architectural Specification — Updated August 2026.*
