# 🚀 Inflow – Architectural Overview, Algorithmic Time Complexity & Product Roadmap

This document provides an in-depth architectural specification of the **Inflow** whiteboard application, its computational foundations, completed capabilities, an extensive **Algorithmic Time Complexity Reduction Engine**, and a structured, prioritized future roadmap.

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

## ⚡ 2. Algorithmic Time Complexity & Performance Engineering

To ensure Inflow maintains a **solid 60–120 FPS frame budget (under 8.3ms – 16.6ms per frame)** even when rendering documents with **10,000+ to 50,000+ vector shapes**, we analyze the computational time and space complexity of every operation and establish asymptotic optimization pathways.

### 📈 Time Complexity Optimization Matrix

| Operational Pipeline | Current Asymptotic Complexity | Target Optimized Complexity | Optimization Technique & Data Structure |
| :--- | :--- | :--- | :--- |
| **Canvas Hit-Testing / Pick** | $O(N)$ linear stage search | $O(\log N + K)$ | **2D R-Tree (`rbush`) / Bounding Volume Hierarchy** |
| **Selection Marquee Intersection** | $O(N)$ brute-force AABB loop | $O(\log N + K)$ | **Spatial 2D Range Search via Quadtree** |
| **SnapManager Edge Alignment** | $O(N)$ checking all canvas nodes | $O(K)$ localized query | **Uniform Spatial Hash Grid / Interval Trees** |
| **Anchor Point Snap Proximity** | $O(N \cdot A)$ loop (5 anchors/shape)| $O(\log N)$ | **Radial k-d Tree / Nearest Neighbor Spatial Hash** |
| **Freehand Path Simplification** | $O(P^2)$ worst-case RDP | $O(P \log P)$ or $O(P)$ | **Adaptive Velocity RDP with Convex Hull Splitting** |
| **Eraser Segment Collision** | $O(M \cdot P)$ distance checks | $O(M \log P)$ | **Polyline Segment BVH Tree & AABB Pre-filtering** |
| **Obstacle-Avoiding Routing** | $O(V \cdot E)$ full graph search | $O(K \log K)$ | **Grid A* with Jump Point Search (JPS)** |
| **Undo / Redo Snapshot History** | $O(N)$ deep cloning entire stage | $O(1)$ mutation record | **Structural JSON Patch (RFC 6902) Delta Trees** |
| **Canvas Frame Render Loop** | $O(N_{\text{total}})$ submitting all draw calls | $O(K_{\text{visible}})$ | **Frustum Viewport Culling & Dirty Rect Repaints** |
| **Sketchy Rough.js Generation** | $O(P \cdot \text{Rough})$ recalculating/frame| $O(1)$ blit | **Offscreen Bitmap Texture Caching / Memoization** |
| **Pointer Event Coalescing** | $O(E)$ unthrottled event handlers | $O(1)$ per rAF tick | **`requestAnimationFrame` Event Batching & Throttling** |

*Notation: $N$ = total canvas elements, $K$ = elements in active viewport or query bounds, $P$ = vertices/points in path, $A$ = anchor points per shape, $M$ = cursor sweep segments, $V/E$ = vertices and edges in routing graph, $E$ = incoming raw pointer events.*

---

### 🔬 Deep Dive into Low-Complexity Architectural Pipelines

#### 1. Spatial Partitioning & Frustum Culling ($O(N) \rightarrow O(\log N + K)$)
- **Problem**: When a canvas contains 10,000 shapes, testing pointer clicks or iterating over all shapes every frame wastes CPU cycles checking off-screen elements.
- **Optimization**:
  - Maintain a dynamic **2D R-Tree index** (`rbush`) indexing the Axis-Aligned Bounding Box (AABB) of every shape.
  - Insertions/Deletions run in $O(\log N)$.
  - Bounding box intersection queries run in $O(\log N + K)$, where $K$ is the small subset of visible elements.
  - **Frustum Culling**: The canvas render pass queries the current viewport matrix $V = [x_{min}, y_{min}, x_{max}, y_{max}]$ and strictly renders only intersecting shapes, reducing draw calls from $N_{\text{total}} = 10,000$ to $K_{\text{visible}} \approx 50$.

#### 2. Localized Spatial Hash Grid for Snapping ($O(N) \rightarrow O(K)$)
- **Problem**: During shape dragging, `SnapManager` currently iterates through all other shapes on the canvas to compute 6 alignment guides (Left, Center, Right, Top, Middle, Bottom).
- **Optimization**:
  - Shapes are bucketed into a **2D Spatial Hash Grid** with cell size $C = 256\text{px}$.
  - During dragging, `SnapManager` queries only the 9 adjacent grid cells surrounding the moving shape's bounding box ($O(1)$ bucket lookup + $O(K)$ localized shapes).
  - Keeps drag-snapping locked at 120 FPS even on massive industrial flowcharts.

#### 3. Bounding Volume Hierarchy (BVH) for Eraser Collisions ($O(M \cdot P) \rightarrow O(M \log P)$)
- **Problem**: Freehand pen drawings can contain hundreds of points ($P$). Testing an eraser brush with $M$ movements against thousands of strokes creates $O(M \cdot \sum P_i)$ orthogonal segment distance checks.
- **Optimization**:
  - Each `PenShape` caches a 1D segment BVH / interval tree over its vertex line segments.
  - The eraser first checks stroke-level AABB overlap ($O(1)$).
  - Only if the stroke AABB intersects the eraser circle does it traverse the segment BVH in $O(\log P)$ to pinpoint sliced segments.

#### 4. Delta History Engine with Structural Sharing ($O(N) \rightarrow O(1)$ Space & Time)
- **Problem**: Saving the entire canvas state array to `HistoryManager` on every user stroke consumes $O(N)$ memory per undo step, leading to Garbage Collection (GC) pauses and memory bloat.
- **Optimization**:
  - Transition from state snapshots to **JSON Delta Patches (RFC 6902 / Immer-style proxies)**.
  - Each undo/redo entry stores only the inverted differential operations: `{ op: "replace", path: ["shapes", id, "x"], prev: 120, next: 140 }`.
  - Mutation capture time is $O(1)$ and memory per undo step is reduced by **98.5%**.

#### 5. Offscreen Canvas Texture Memoization ($O(\text{Rough}) \rightarrow O(1)$ Blit)
- **Problem**: Rough.js recalculates pseudo-random bezier curves, hachure stroke lines, and bowing offsets on every render tick.
- **Optimization**:
  - Static rough shapes are rasterized once onto an isolated, sized `OffscreenCanvas` bitmap.
  - Consecutive canvas repaints render the cached bitmap using native hardware-accelerated `ctx.drawImage` in $O(1)$ time.
  - The offscreen cache is marked dirty and regenerated only when shape geometry, color, or fill parameters mutate.

#### 6. High-Frequency Pointer Event Coalescing ($O(E) \rightarrow O(1)$ per Frame)
- **Problem**: High-polling gaming mice (1000Hz) and stylus tablets trigger hundreds of `pointermove` events per second, causing UI thread starvation.
- **Optimization**:
  - Pointer events are captured into a lightweight single-point buffer without triggering canvas mutations.
  - A single `requestAnimationFrame` loop drains the latest buffered pointer coordinates at the monitor's native refresh rate (60Hz / 120Hz / 144Hz).

---

## 🗺️ 3. Comprehensive Strategic Product Roadmap

```
                                      INFLOW PRODUCT ROADMAP
 ┌────────────────────────┐  ┌────────────────────────┐  ┌────────────────────────┐
 │   UI / UX & Design     │  │ Real-Time Sync & CRDT  │  │  Frames, Artboards &   │
 │   System Revolution    │  │ Multiplayer Workspace  │  │   Presentation Deck    │
 └───────────┬────────────┘  └───────────┬────────────┘  └───────────┬────────────┘
             │                           │                           │
 ┌───────────┴────────────┐  ┌───────────┴────────────┐  ┌───────────┴────────────┐
 │  AI Smart Whiteboard   │  │  Interoperability &    │  │  Low-Time-Complexity   │
 │  Generative Diagrams   │  │  Ecosystem Formats     │  │  Performance Engine    │
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
- **Yjs / Automerge Sync Engine**: Conflict-free replicated data types ensuring real-time multi-user drawing with zero data loss ($O(\log N)$ state reconciliation).
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
- **Smart Obstacle Avoidance**: Orthogonal routing algorithm that automatically routes connectors around intermediate shapes using $O(K \log K)$ A* Jump Point Search.
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
- **Shape Assist**: Automatically recognize messy hand-drawn circles, rectangles, triangles, and arrows and convert them into crisp vectors or polished rough shapes in $O(P)$ time.

#### 3. 📐 LaTeX & Math Equation Rendering
- **Mathematical Formulas**: KaTeX / MathJax rendering support for mathematical equations, matrices, and symbols directly on canvas text blocks.

#### 4. 💡 AI Diagram Explainer & Summarizer
- **Visual Intelligence**: Select any diagram area to have AI analyze, summarize, explain architecture flaws, or generate documentation.

---

### ⚡ Track E: Interoperability, Ecosystem & High-Performance Scaling

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

## 📅 4. Implementation Priority & Complexity Matrix

| ID | Feature / Module | Track / Domain | Complexity (Time / Space) | Status | Priority | Target Release |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **F01** | Core Shapes (Rect, Circle, Diamond, Line, Arrow, Pen, Text) | Canvas Engine | $O(1)$ per node | ✅ Completed | P0 | v1.0 |
| **F02** | Extended Shapes (Pill, Cloud, Star, Cylinder, Callout, Trapezoid) | Canvas Engine | $O(1)$ per node | ✅ Completed | P0 | v1.5 |
| **F03** | Sticky Notes with Quick-Add Neighbors | Canvas Engine | $O(1)$ layout | ✅ Completed | P0 | v1.5 |
| **F04** | Image Upload & SVG Vector Import | Media Engine | $O(S)$ XML parse | ✅ Completed | P0 | v1.5 |
| **F05** | Rough.js Hand-Drawn Sketch Mode & Fill Styles | Aesthetics | $O(P)$ geometry | ✅ Completed | P0 | v1.8 |
| **F06** | Smart Anchors & Orthogonal Manhattan Routing | Flowcharting | $O(1)$ 5-point route | ✅ Completed | P0 | v1.8 |
| **F07** | Smart Snapping & Alignment Guides | Canvas Engine | $O(N)$ linear check | ✅ Completed | P0 | v1.8 |
| **F08** | Dark / Light Glassmorphism UI & Theme Adapter | UI / UX | $O(1)$ CSS swap | ✅ Completed | P0 | v2.0 |
| **F09** | Mobile Responsive Suite & Touch Adapters | UI / UX | $O(1)$ responsive UI| ✅ Completed | P0 | v2.0 |
| **F10** | 3D Preview Extrusion Modal | 3D Graphics | $O(N)$ 3D mesh stack| ✅ Completed | P1 | v2.0 |
| **F11** | Text Formatting Toolbar (Rich Styles) | UI / UX | $O(1)$ DOM sync | ✅ Completed | P0 | v2.0 |
| **P01** | **2D R-Tree Spatial Indexing (`rbush`) & Frustum Culling** | Performance | **$O(N) \to O(\log N + K)$** | 🚧 Next Up | P0 | v2.1 |
| **P02** | **Spatial Hash Grid for SnapManager ($O(N) \to O(K)$)** | Performance | **$O(N) \to O(K)$** | 🚧 Next Up | P0 | v2.1 |
| **P03** | **JSON Patch Delta History Engine (RFC 6902)** | Performance / Mem | **$O(N) \to O(1)$ Mem** | 🚧 Next Up | P0 | v2.1 |
| **P04** | **Offscreen Bitmap Memoization for Rough.js / Textures** | Performance | **$O(P) \to O(1)$ Blit** | 🚧 Next Up | P0 | v2.1 |
| **P05** | **Eraser Segment BVH & AABB Pre-filtering** | Performance | **$O(M \cdot P) \to O(M \log P)$** | 📋 Planned | P1 | v2.2 |
| **P06** | **Web Worker Thread Pool (PDF, Math, SVG Parse)** | Performance | **$0\text{ms}$ UI Block** | 📋 Planned | P1 | v2.2 |
| **P07** | **A* Jump Point Search Obstacle-Avoiding Connector Routing**| Performance / Algo| **$O(V \cdot E) \to O(K \log K)$** | 📋 Planned | P1 | v2.3 |
| **U01** | **Contextual Quick-Action Floating Bar (Mini-Toolbar)** | UI / UX | $O(1)$ HUD lookup | 🚧 Next Up | P0 | v2.1 |
| **U02** | **Layers, Objects & Pages Tree View Drawer** | UI / UX | $O(N)$ virtualized | 🚧 Next Up | P0 | v2.1 |
| **U03** | **Command Palette (`Cmd/Ctrl + K`) Quick Launcher** | UI / UX | $O(\log S)$ Trie / Fuzzy | 📋 Planned | P1 | v2.2 |
| **U04** | **Radar Minimap Navigator & Viewport HUD** | UI / UX | $O(K)$ downscaled draw | 📋 Planned | P1 | v2.2 |
| **U05** | **Custom Color Palette Engine (OKLCH/Eyedropper/Gradients)**| UI / UX | $O(1)$ color math | 📋 Planned | P1 | v2.2 |
| **U06** | **Canvas Grid Modes (Dots, Isometric, Blueprint, Lined)** | UI / UX | $O(1)$ pattern shader | 📋 Planned | P1 | v2.3 |
| **U07** | **Zen / Focus Mode (Distraction-Free Drawing)** | UI / UX | $O(1)$ CSS animation | 📋 Planned | P2 | v2.3 |
| **U08** | **Stylus Pressure & Palm Rejection (Touch 2.0)** | Mobile / Tablet | $O(1)$ gesture filter | 📋 Planned | P1 | v2.3 |
| **U09** | **Accessibility (a11y) & Multi-Language (i18n)** | Accessibility | $O(1)$ string lookup | 📋 Planned | P2 | v2.4 |
| **C01** | **Connector Path Text Labels & Curved Bézier Lines** | Diagramming | $O(1)$ spline math | 🚧 Next Up | P0 | v2.1 |
| **C02** | **Frames / Artboards & Slide Deck Presentation Mode** | Presentation | $O(\log N)$ frame cull| 📋 Planned | P0 | v2.2 |
| **C03** | **Reusable Component Library & Icon Stash** | Productivity | $O(1)$ clone subtree | 📋 Planned | P1 | v2.3 |
| **M01** | **Real-Time Multiplayer Collaboration (Yjs/CRDTs)** | Collaboration | $O(\log N)$ CRDT sync | 📋 Planned | P0 | v3.0 |
| **M02** | **Cloud Workspace Dashboard & User Auth (Supabase)** | Cloud Services | $O(1)$ fetch API | 📋 Planned | P0 | v3.0 |
| **M03** | **Canvas Commenting & Version Diff History** | Team Review | $O(D)$ diff calc | 📋 Planned | P1 | v3.1 |
| **A01** | **Text-to-Diagram & Mermaid.js Generator (AI)** | Generative AI | $O(V + E)$ layout | 📋 Planned | P1 | v3.2 |
| **A02** | **Freehand Stroke Auto-Cleanup (AI Shape Assist)** | Generative AI | $O(P)$ geometric fit | 📋 Planned | P2 | v3.2 |
| **A03** | **LaTeX / MathJax Math Formula Rendering** | Math & Academic | $O(1)$ KaTeX render | 📋 Planned | P2 | v3.2 |
| **E01** | **Multi-Page PDF & Clean Vector SVG Export** | Interoperability | $O(N)$ vector serialize| 📋 Planned | P0 | v2.4 |
| **E02** | **Excalidraw & tldraw Bidirectional Schema Sync** | Interoperability | $O(N)$ JSON transform | 📋 Planned | P1 | v2.4 |

---

## 🏗️ 5. Architectural Evolution Blueprint

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

FUTURE ARCHITECTURE (v3.0+ High-Performance & Distributed)
┌────────────────────────────────────────────────────────┐
│ UI & Design System 2.0 (Mini-HUD, Layers Tree, Cmd+K)  │
├────────────────────────────────────────────────────────┤
│ Sync Layer (Yjs CRDT Provider / WebSockets / Supabase) │
├────────────────────────────────────────────────────────┤
│ Spatial Indexing Engine (2D R-Tree / Frustum Culler)   │
├───────────────────┬────────────────────────────────────┤
│ Managers Layer    │ AI & Extensions Engine             │
│ - FrameManager    │ - Text-to-Diagram / LLM Connector  │
│ - LayerManager    │ - Sketch Recognition Engine        │
│ - CloudAuthManager│ - Mermaid / Excalidraw Converters  │
├───────────────────┴────────────────────────────────────┤
│ Offscreen Memoization & Web Worker Pool (0ms UI Block) │
└────────────────────────────────────────────────────────┘
```

---

*Inflow Product Roadmap — Updated August 2026.*
