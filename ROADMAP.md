# 🚀 Inflow – Architectural Overview & Comprehensive Product Roadmap

This document provides an in-depth overview of the **Inflow** visual whiteboard application, its current architectural design, completed capabilities, and a structured, prioritized roadmap for future feature and UI/UX implementations.

---

## 📊 1. Current Project Status & Architecture

**Inflow** is a modern, high-performance visual whiteboard and diagramming application built with HTML5 Canvas, Konva.js, and Tailwind CSS v4.

### 🛠️ Tech Stack & Key Technologies
- **Core Engine**: Konva.js (`v10.3.0`) vector graphics rendering library over HTML5 Canvas.
- **Sketchy Renderer**: Rough.js (`v4.6.6`) for hand-drawn aesthetic mode via OffscreenCanvas rasterization.
- **Build Tooling**: Vite (`v8.1.1`), ES Modules, Tailwind CSS (`@tailwindcss/vite v4.3.2`).
- **Typography**: Geist (Sans & Mono), Caveat (Handwritten/Virgil), Architects Daughter, Fira Code (Cascadia), Inter.
- **Architecture Pattern**: Event-driven pub/sub event bus (`EventBus.js`) decoupling managers, tools, shapes, and UI views.
- **State Management**: Specialized modular managers (`ToolManager`, `ShapeManager`, `HistoryManager`, `StyleManager`, `SnapManager`, `PersistenceManager`, `ThemeManager`, `AnchorManager`, `ThreeDPreviewManager`).

### ✨ Built-in Capabilities (Live in Current Build)

#### 🎨 Shape & Vector Engine
1. **Core Shapes**: Rectangles, Circles/Ellipses, Diamonds, Lines, Arrows, Freehand Pen paths, and Multiline Rich Text.
2. **Extended Shape Library**: Pill/Stadium, Parallelogram, Trapezoid, Database Cylinder, Cloud, Star, and Speech Callout Bubbles via top toolbar popover.
3. **Sticky Notes**: Color-tinted sticky notes with auto-wrapped text, realistic shadow elevations, and one-click quick-add neighbor buttons.
4. **Media & Image Nodes**: Drag-and-drop / file upload for images (PNG, JPEG, WebP, SVG) with aspect-ratio locking and border controls.
5. **SVG Vector Import**: Parse raw SVG XML elements (`<path>`, `<rect>`, `<circle>`, `<polygon>`) into native editable Konva vector nodes.
6. **Smart Anchors & Orthogonal Routing**: Dynamic perimeter anchor points with magnetic snap; multi-segment Manhattan right-angle routing paths (`routing.js`).
7. **Rough.js Sketchy Mode**: Instant toggle between crisp precision vectors and hand-drawn sketch styles with hachure, cross-hatch, dot, and solid fill textures.
8. **Transformations & Multi-Selection**: Bounding box transformer controls (scale, rotate, translate), multi-shape marquee selection, copy/paste/duplicate, and z-index ordering.
9. **Smart Alignment Snapping**: Dynamic snapping guides aligned to edges and centers of neighboring elements with dashed visual guide lines.
10. **Presentation Laser Pointer**: Glowing fading red/neon laser trail with continuous cursor tracking.
11. **3D Preview Extrusion**: Live isometric 3D mesh preview renderer modal with interactive mouse-drag rotation (`ThreeDPreviewManager`).
12. **Watercolor Paper Canvas Texture**: Procedural canvas background effect simulating textured artist paper.

#### 🖥️ UI / UX & Responsive Experience
1. **Glassmorphism Theme System**: High-contrast dark and light themes dynamically adapting toolbars, canvas grids, menus, property inspectors, and tooltips.
2. **Floating Contextual Properties Panel**: Multi-tab property inspector with real-time color swatches, stroke styles, fill options, opacity sliders, and typography controls.
3. **Text Formatting Toolbar**: Floating inline rich-text toolbar supporting bold, italic, underline, strike-through, alignment, font family switching, font sizing, and list formatting.
4. **Mobile & Tablet Responsive Suite**: Adaptive bottom sheets, collapsible floating docks, touch-optimized transform handles, and touch gesture handling (`mobile-ui.js`, `mobile-components.css`) with 768px breakpoint adaptation.
5. **Right-Click Context Menu**: Context-sensitive menu with z-ordering actions, clipboard operations, alignment tools, and keyboard shortcut hints.
6. **Custom Themed Tooltips**: Non-intrusive hover tooltips replacing native browser tooltips with instant theme alignment.
7. **Keyboard Shortcuts Modal**: Comprehensive shortcut reference dialog searchable by category.
8. **Document Persistence**: Real-time autosave to LocalStorage, JSON document import/export, and cropped high-DPI PNG export.

---

## 🗺️ 2. Comprehensive Strategic Product Roadmap

```
                                      INFLOW PRODUCT ROADMAP
 ┌────────────────────────┐  ┌────────────────────────┐  ┌────────────────────────┐
 │   UI / UX & Design     │  │ Real-Time Sync & CRDT  │  │  Frames, Artboards &   │
 │   System Revolution    │  │ Multiplayer Workspace  │  │   Presentation Deck    │
 └───────────┬────────────┘  └───────────┬────────────┘  └───────────┬────────────┘
             │                           │                           │
 ┌───────────┴────────────┐  ┌───────────┴────────────┐  ┌───────────┴────────────┐
 │  AI Smart Whiteboard   │  │  Interoperability &    │  │  Enterprise Spatial    │
 │  Generative Diagrams   │  │  Ecosystem Formats     │  │  Scaling & Performance │
 └────────────────────────┘  └────────────────────────┘  └────────────────────────┘
```

---

### 🎨 Track A: UI/UX & Frontend Design System Upgrades

> **Primary Goal**: Elevate Inflow into a world-class, breathtaking visual studio with frictionless interactions, rich aesthetics, and tactile micro-interactions.

#### 1. 🪄 Contextual Quick-Action Floating Bar (Mini-Toolbar)
- **Selection-Anchored HUD**: A lightweight floating mini-bar that hovers directly above selected shapes, offering instant 1-click access to common actions (stroke color, fill color, stroke width, duplicate, delete, lock, bring-to-front).
- **Connector Quick-Sprout**: Hovering an anchor point shows quick-sprout arrows to instantly generate connected shapes with one click.
- **On-Canvas Dimension Badges**: Live floating width, height, and angle badges during shape resizing and rotation.

#### 2. 🗂️ Layers, Objects & Pages Sidebar (Hierarchical Tree View)
- **Visual Layer Tree**: An expandable left-side drawer displaying all canvas nodes in hierarchical order.
- **Drag-and-Drop Reordering**: Drag layers up or down to adjust z-index ordering visually.
- **Node Controls**: Quick lock/unlock, visibility toggle (hide/show), rename layer label, and group/ungroup directly from the tree view.
- **Multi-Page Whiteboard Tabs**: Tab bar supporting multiple pages/canvas sheets within a single document file.

#### 3. ⌨️ Command Palette (`Cmd/Ctrl + K`) & Quick Launcher
- **Universal Spotlight Search**: Fast fuzzy-search modal to trigger any tool, shape insertion, action, export format, or canvas setting via keyboard.
- **Recent Actions & Quick Navigation**: History of recently used tools and jump-to-shape search by text content.

#### 4. 🗺️ Radar Minimap Navigator & Viewport HUD
- **Live Minimap Thumbnail**: Interactive bottom-right minimap showing an overview of the entire infinite canvas.
- **Click & Drag Pan**: Drag the red viewport rectangle inside the minimap to smoothly pan across distant parts of huge diagrams.
- **Zoom Level Indicator & Reset**: Quick zoom percentage badge with presets (`Fit to Screen`, `100%`, `Zoom to Selection`).

#### 5. 🎨 Advanced Color Palette Engine & Custom Swatches
- **OKLCH / HSL Color Picker**: Precise color picker modal with Hex, RGB, HSL, and OKLCH inputs alongside an alpha transparency slider.
- **Eyedropper Tool**: Native Canvas Eyedropper API to sample colors from any on-screen shape or imported image.
- **Gradient Fill Builder**: Linear and radial gradient fill support with customizable angle and color stops.
- **User Palette Storage**: Save custom brand color swatches to LocalStorage with import/export palette support.

#### 6. 📐 Infinite Canvas Grid Presets
- **Grid Modes Switcher**: Instant switching between:
  - **Dot Grid** (configurable dot pitch and opacity)
  - **Square Grid** (graph paper aesthetic)
  - **Isometric Grid** (for 3D architectural and game sketching)
  - **Ruled / Lined Paper** (for notes and wireframes)
  - **Blueprint Mode** (deep navy blue with white grid lines)
  - **Watercolor Paper Texture** (organic paper grain)

#### 7. 🧘 Zen / Focus Mode & Immersive Drawing
- **Auto-Collapsing UI**: Option to automatically fade or collapse toolbar chrome when actively drawing or panning.
- **Distraction-Free Fullscreen**: Keyboard shortcut (`F11` / `Ctrl+.`) to hide all UI elements for pure sketching.

#### 8. 📱 Mobile & Tablet Touch Experience 2.0
- **Apple Pencil & Stylus Dynamics**: Pressure sensitivity for variable stroke width and tilt-angle shading in Pen mode.
- **Thumb Radial Dial**: Ergonomic radial floating tool wheel for rapid one-thumb tool switching on tablet screens.
- **Palm Rejection Engine**: Smart touch filter separating active stylus input from hand rests and two-finger pan/zoom gestures.

#### 9. ♿ Accessibility (a11y) & Internationalization (i18n)
- **Full Keyboard Navigation**: Focus rings, logical Tab order across toolbar, properties panel, and canvas objects.
- **Screen Reader Announcements**: ARIA live regions for canvas mutations, selections, and tool switches.
- **Multi-Language Localization (i18n)**: Language selector (English, Spanish, Hindi, Japanese, German, French) with RTL support.

---

### 🌐 Track B: Real-Time Multiplayer Collaboration & Cloud Workspace

#### 1. 👥 Real-Time Multiplayer Collaboration (CRDTs + WebSockets)
- **Yjs / Automerge Sync Engine**: Conflict-free replicated data types ensuring real-time multi-user drawing with zero data loss.
- **Live Multiplayer Cursors**: Remote cursors showing collaborator name tags, custom avatar colors, and live selection bounding boxes.
- **Follow-User Camera Mode**: Click a teammate's avatar to lock viewport camera to their live screen view.

#### 2. ☁️ Cloud Workspace & Authentication
- **Cloud Project Storage**: Backend integration (Supabase / Firebase / PostgreSQL) paired with OAuth login (Google, GitHub, Email).
- **Workspace Dashboard**: Cloud project folders, visual document thumbnails, search, and tags.
- **Shareable Links & Granular Permissions**: Secure share links with `View Only`, `Comment Only`, or `Full Edit` permissions.

#### 3. 💬 Canvas Commenting & Annotations
- **Sticky Comment Pins**: Drop threaded comment pins anywhere on the canvas with @mentions and notification badges.
- **Resolve / Reopen Threads**: Status tracking for team review feedback.

#### 4. 📜 Version History & Snapshot Timeline
- **Named Revisions**: Create named revision checkpoints before major edits.
- **Visual History Diff**: Interactive timeline slider to compare and restore past snapshots with highlighted changes.

---

### 🎯 Track C: Presentation, Frames & Diagramming Power

#### 1. 🖼️ Frames / Artboards & Slide Deck Presentation Mode
- **Frame Containers**: Group shapes inside named bounding Frames (e.g., `Slide 1`, `Mobile Mockup`, `Architecture`) that automatically move and clip contained elements.
- **Interactive Presentation Mode**: Fullscreen presenter mode with smooth animated camera transitions between Frames using arrow keys.
- **Slide Aspect Ratio Presets**: 16:9 widescreen, 4:3 standard, A4 portrait/landscape, and mobile screen presets.

#### 2. 🏷️ Path Text Labels & Advanced Connectors
- **Path Text Badges**: Double-click any line/arrow connector to attach editable text labels that follow the path curvature and angle.
- **Smart Obstacle Avoidance**: Orthogonal routing algorithm that automatically routes connectors around intermediate shapes.
- **Curved Bézier Connectors**: Smooth organic spline curves with interactive tangent handles.
- **Custom Arrowhead Endings**: Filled triangle, open arrow, diamond (UML aggregation), circle, and perpendicular bar.

#### 3. 🧩 Reusable Component Library & Icon Stash
- **Built-in Icon Packs**: Searchable vector icon library (Lucide Icons, AWS Architecture icons, GCP icons, Flowchart symbols).
- **Custom Reusable Components**: Save selected shape groups as reusable canvas components with drag-and-drop reuse.

---

### 🤖 Track D: AI Smart Whiteboard & Diagram Intelligence

#### 1. 🪄 Text-to-Diagram Generation (LLM Integration)
- **Natural Language Prompting**: Generate complete flowcharts, mind maps, ER diagrams, and sequence diagrams directly from text prompts.
- **Markdown / Mermaid to Canvas**: Paste Mermaid.js code or markdown outlines to automatically lay out editable vector nodes.

#### 2. ✏️ Freehand Stroke Auto-Cleanup (AI Sketch Recognition)
- **Shape Assist**: Automatically recognize messy hand-drawn circles, rectangles, triangles, and arrows and convert them into crisp vectors or polished rough shapes.

#### 3. 📐 LaTeX & Math Equation Rendering
- **Mathematical Formulas**: KaTeX / MathJax rendering support for mathematical equations, matrices, and symbols directly on canvas text blocks.

#### 4. 💡 AI Diagram Explainer & Summarizer
- **Visual Intelligence**: Select any diagram area to have AI analyze, summarize, explain architecture flaws, or generate documentation.

---

### ⚡ Track E: Interoperability, Ecosystem & Performance Scaling

#### 1. 📤 Multi-Format Import / Export Pipeline
- **Vector SVG Export**: Export clean, semantic SVG files with embedded CSS styling and custom fonts.
- **Multi-Page PDF Export**: Vector-quality PDF export supporting multi-page artboards and presentation slides.
- **Excalidraw & tldraw Sync**: Bidirectional import and export of `.excalidraw` and `.tldraw` JSON document schemas.
- **Code Generation Export**: Convert selected UI wireframe sketches into clean React Tailwind JSX or HTML/CSS code.

#### 2. 🚀 Enterprise Spatial Scaling & High Performance
- **R-Tree / Quadtree Spatial Indexing**: Frustum viewport culling (`rbush`) rendering only visible shapes to smoothly handle 20,000+ elements at 60 FPS.
- **Web Worker Offloading**: Offload heavy image filters, PDF compilation, and 3D mesh math to background Web Workers.
- **Offscreen Canvas & WebGL Acceleration**: GPU-accelerated rendering passes for large-scale infinite canvases.

---

## 📅 3. Implementation Priority & Status Matrix

| ID | Feature / Module | Track / Domain | Status | Priority | Complexity | Target Release |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **F01** | Core Shapes (Rect, Circle, Diamond, Line, Arrow, Pen, Text) | Canvas Engine | ✅ Completed | P0 | Medium | v1.0 |
| **F02** | Extended Shapes (Pill, Cloud, Star, Cylinder, Callout, Trapezoid) | Canvas Engine | ✅ Completed | P0 | Medium | v1.5 |
| **F03** | Sticky Notes with Quick-Add Neighbors | Canvas Engine | ✅ Completed | P0 | Medium | v1.5 |
| **F04** | Image Upload & SVG Vector Import | Media Engine | ✅ Completed | P0 | Medium | v1.5 |
| **F05** | Rough.js Hand-Drawn Sketch Mode & Fill Styles | Aesthetics | ✅ Completed | P0 | Medium-High | v1.8 |
| **F06** | Smart Anchors & Orthogonal Manhattan Routing | Flowcharting | ✅ Completed | P0 | Medium-High | v1.8 |
| **F07** | Smart Snapping & Alignment Guides | Canvas Engine | ✅ Completed | P0 | Medium | v1.8 |
| **F08** | Dark / Light Glassmorphism UI & Theme Adapter | UI / UX | ✅ Completed | P0 | Medium | v2.0 |
| **F09** | Mobile Responsive Suite & Touch Adapters | UI / UX | ✅ Completed | P0 | High | v2.0 |
| **F10** | 3D Preview Extrusion Modal | 3D Graphics | ✅ Completed | P1 | Medium | v2.0 |
| **F11** | Text Formatting Toolbar (Rich Styles) | UI / UX | ✅ Completed | P0 | Medium | v2.0 |
| **U01** | **Contextual Quick-Action Floating Bar (Mini-Toolbar)** | UI / UX | 🚧 Next Up | P0 | Medium | v2.1 |
| **U02** | **Layers, Objects & Pages Tree View Drawer** | UI / UX | 🚧 Next Up | P0 | Medium-High | v2.1 |
| **U03** | **Command Palette (`Cmd/Ctrl + K`) Quick Launcher** | UI / UX | 📋 Planned | P1 | Medium | v2.2 |
| **U04** | **Radar Minimap Navigator & Viewport HUD** | UI / UX | 📋 Planned | P1 | Medium | v2.2 |
| **U05** | **Custom Color Palette Engine (OKLCH/Eyedropper/Gradients)**| UI / UX | 📋 Planned | P1 | Medium | v2.2 |
| **U06** | **Canvas Grid Modes (Dots, Isometric, Blueprint, Lined)** | UI / UX | 📋 Planned | P1 | Low-Medium | v2.3 |
| **U07** | **Zen / Focus Mode (Distraction-Free Drawing)** | UI / UX | 📋 Planned | P2 | Low | v2.3 |
| **U08** | **Stylus Pressure & Palm Rejection (Touch 2.0)** | Mobile / Tablet | 📋 Planned | P1 | High | v2.3 |
| **U09** | **Accessibility (a11y) & Multi-Language (i18n)** | Accessibility | 📋 Planned | P2 | Medium | v2.4 |
| **C01** | **Connector Path Text Labels & Curved Bézier Lines** | Diagramming | 🚧 Next Up | P0 | Medium | v2.1 |
| **C02** | **Frames / Artboards & Slide Deck Presentation Mode** | Presentation | 📋 Planned | P0 | High | v2.2 |
| **C03** | **Reusable Component Library & Icon Stash** | Productivity | 📋 Planned | P1 | Medium | v2.3 |
| **M01** | **Real-Time Multiplayer Collaboration (Yjs/CRDTs)** | Collaboration | 📋 Planned | P0 | High | v3.0 |
| **M02** | **Cloud Workspace Dashboard & User Auth (Supabase)** | Cloud Services | 📋 Planned | P0 | High | v3.0 |
| **M03** | **Canvas Commenting & Version Diff History** | Team Review | 📋 Planned | P1 | Medium-High | v3.1 |
| **A01** | **Text-to-Diagram & Mermaid.js Generator (AI)** | Generative AI | 📋 Planned | P1 | High | v3.2 |
| **A02** | **Freehand Stroke Auto-Cleanup (AI Shape Assist)** | Generative AI | 📋 Planned | P2 | High | v3.2 |
| **A03** | **LaTeX / MathJax Math Formula Rendering** | Math & Academic | 📋 Planned | P2 | Medium | v3.2 |
| **E01** | **Multi-Page PDF & Clean Vector SVG Export** | Interoperability | 📋 Planned | P0 | Medium-High | v2.4 |
| **E02** | **Excalidraw & tldraw Bidirectional Schema Sync** | Interoperability | 📋 Planned | P1 | Medium | v2.4 |
| **E03** | **R-Tree Spatial Indexing (`rbush`) & Web Workers** | Performance | 📋 Planned | P1 | High | v3.0 |

---

## 🏗️ 4. Architectural Evolution Blueprint

```
CURRENT ARCHITECTURE (v2.0)
┌────────────────────────────────────────────────────────┐
│ UI Layer (Toolbar, Properties, Context Menu, Mobile UI)│
├────────────────────────────────────────────────────────┤
│ EventBus (Pub/Sub Event Dispatcher)                    │
├───────────────────┬────────────────────────────────────┤
│ Managers Layer    │ Tool System                        │
│ - ToolManager     │ - SelectTool, ShapeTool, PenTool   │
│ - ShapeManager    │ - TextTool, StickyTool, EraserTool │
│ - SnapManager     │ - ImageTool, LaserTool, HandTool   │
│ - ThemeManager    │                                    │
│ - HistoryManager  │ Shapes Engine (18+ Shape Classes)  │
│ - AnchorManager   │ - BaseShape -> Konva Node Binding  │
├───────────────────┴────────────────────────────────────┤
│ Rendering Engines: Konva.js (Canvas) + Rough.js (Sketch)│
└────────────────────────────────────────────────────────┘

FUTURE ARCHITECTURE (v3.0+)
┌────────────────────────────────────────────────────────┐
│ UI & Design System 2.0 (Mini-HUD, Layers Tree, Cmd+K)  │
├────────────────────────────────────────────────────────┤
│ Sync Layer (Yjs CRDT Provider / WebSockets / Supabase) │
├────────────────────────────────────────────────────────┤
│ Spatial Indexing Engine (R-Tree / Viewport Culler)     │
├───────────────────┬────────────────────────────────────┤
│ Managers Layer    │ AI & Extensions Engine             │
│ - FrameManager    │ - Text-to-Diagram / LLM Connector  │
│ - LayerManager    │ - Sketch Recognition Engine        │
│ - CloudAuthManager│ - Mermaid / Excalidraw Converters  │
├───────────────────┴────────────────────────────────────┤
│ Web Worker Pool (PDF, Heavy Math, 3D Mesh Computations)│
└────────────────────────────────────────────────────────┘
```

---

*Inflow Product Roadmap — Updated August 2026.*
