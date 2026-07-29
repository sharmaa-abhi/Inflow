# 🚀 InkFlow – Architectural Overview & Future Implementation Roadmap

This document provides a comprehensive overview of the **InkFlow** codebase, its current architectural design, and a structured strategic roadmap for future feature implementations.

---

## 📊 1. Current Project Status & Architecture

**InkFlow** is a modern, high-performance visual whiteboard application built with HTML5 Canvas, Konva.js, and Tailwind CSS v4.

### 🛠️ Tech Stack & Key Technologies
- **Core Engine**: Konva.js (`v10.3.0`) vector graphics rendering library over HTML5 Canvas.
- **Sketchy Renderer**: Rough.js (`v4.6.6`) for hand-drawn aesthetic mode via OffscreenCanvas.
- **Build Tooling**: Vite (`v8.1.1`), ES Modules, Tailwind CSS (`@tailwindcss/vite v4.3.2`).
- **Architecture Pattern**: Event-driven pub/sub event bus (`EventBus.js`) decoupling managers, tools, shapes, and UI views.
- **State Management**: Specialized modular managers (`ToolManager`, `ShapeManager`, `HistoryManager`, `StyleManager`, `SnapManager`, `PersistenceManager`, `ThemeManager`, `AnchorManager`, `ThreeDPreviewManager`).

### ✨ Built-in Capabilities (Completed)
1. **Vector Drawing Shapes**: Rectangles, Circles/Ellipses, Diamonds, Lines, Arrows, Pen paths (freehand vector drawing), and multiline Text with custom Virgil/handwriting fonts.
2. **Extended Shape Library**: Pill/Stadium, Parallelogram, Trapezoid, Database Cylinder, Cloud, Star, and Speech Callout Bubbles via toolbar popover.
3. **Image & Media Nodes**: Drag-and-drop / upload local images (PNG, JPEG, WebP, SVG) onto canvas with aspect-ratio locking and border controls.
4. **Sticky Notes**: Colored sticky note boxes with auto-wrapped text, shadow effects, and quick-add neighbor buttons for rapid brainstorming.
5. **SVG Vector Import**: Parse raw SVG XML files (`<path>`, `<rect>`, `<circle>`, `<polygon>`) into native editable Konva vector nodes.
6. **Smart Anchor Points**: Interactive connection anchors (top, right, bottom, left, center) on shape perimeters when drawing lines/arrows, with configurable snap and visibility radii.
7. **Orthogonal (Manhattan) Routing**: Multi-segment right-angled polyline paths that automatically route between anchor points. Connector bindings update when shapes move.
8. **Hand-Drawn "Rough.js" Sketchy Mode**: Toggle between crisp vector and hand-drawn rendering. Supports hachure, cross-hatch, dot, and solid fill textures.
9. **Transformations & Multi-Selection**: Bounding box transformer controls (rotation, scaling, translation), multi-shape marquee drag, copy, paste, duplicate, and z-index ordering via context menu and keyboard shortcuts.
10. **Smart Snapping**: Alignment guide mechanics snapping bounding boxes and centers of nearby elements with dashed alignment lines.
11. **Presentation Laser Pointer**: Glowing fading red trail with continuous cursor tracking.
12. **3D Preview Extrusion**: Live isometric 3D mesh preview renderer modal with interactive mouse-drag rotation (`ThreeDPreviewManager`).
13. **Dark / Light Glassmorphism UI**: High-contrast theme adapter automatically shifting grid colors, toolbar styling, context menus, property panels, and tooltips.
14. **Right-Click Context Menu**: Context-aware menu with z-ordering actions, clipboard operations, and delete — all with shortcut hints.
15. **Custom Tooltip System**: Styled hover tooltips replacing native `title` attributes, adapting to dark/light themes.
16. **Document Persistence & Exports**: Autosave to LocalStorage, JSON document import/export schema, and cropped high-DPI PNG generation.
17. **Mobile Responsive Experience**: Adaptive bottom sheets, responsive toolbars, and touch handle adapters (`mobile-ui.js`) with CSS-driven breakpoint at 768px.

---

## 🗺️ 2. Strategic Future Implementation Roadmap

```
                                  INKFLOW ROADMAP
 ┌──────────────────────┐  ┌──────────────────────┐  ┌──────────────────────┐
 │  Path Text Labels &  │  │ Real-Time Sync & CRDT│  │  SVG / Excalidraw /  │
 │  Connector Routing++ │  │  Multi-User Presence │  │  Mermaid Import-Export│
 └──────────┬───────────┘  └──────────┬───────────┘  └──────────┬───────────┘
            │                         │                         │
 ┌──────────┴───────────┐  ┌──────────┴───────────┐  ┌──────────┴───────────┐
 │ Frames & Presentation│  │  AI Smart Whiteboard │  │ Enterprise Spatial   │
 │     Artboard Modes   │  │ Generative Diagrams  │  │ Scaling & Performance│
 └──────────────────────┘  └──────────────────────┘  └──────────────────────┘
```

---

### ✅ Phase 1: COMPLETED — Canvas & Graphic Engine Enhancements

> These features have been fully implemented and are live in the current build.

#### ✅ Smart Anchor Points & Orthogonal Arrow Routing
- ~~Magnetic Anchor Snap~~: ✅ Interactive connection anchors (top, right, bottom, left, center) rendered on shape perimeters.
- ~~Orthogonal (Manhattan) Line Routing~~: ✅ Multi-segment right-angled polyline paths via `routing.js`.
- **Remaining**: Path text labels (double-click line/arrow to attach text labels to connector paths).

#### ✅ Hand-Drawn "Rough.js" Sketchy Aesthetic Mode
- ~~Rough.js Renderer~~: ✅ Toggle between crisp vector and hand-drawn rendering via `roughRenderer.js`.
- ~~Custom Fill Patterns~~: ✅ Hachure, cross-hatch, dot, and solid fill textures.

#### ✅ Advanced Media Uploads & Extended Shape Library
- ~~Image & Media Nodes~~: ✅ Drag-and-drop / upload (PNG, JPEG, WebP, SVG) with aspect-ratio locking.
- ~~Extended Diagram Shapes~~: ✅ Pill/Stadium, Parallelogram, Trapezoid, Cylinder, Cloud, Star, Speech Bubble.
- ~~Sticky Notes~~: ✅ Colored sticky note boxes with auto-wrapped text and quick-add neighbor buttons.
- ~~SVG Vector Import~~: ✅ Parse SVG XML files into native editable Konva nodes.

---

### Phase 2: Multiplayer Collaboration & Cloud Persistence

#### 1. 🌐 Real-Time Multiplayer Collaboration (CRDTs + WebSockets)
- **Yjs / Automerge Sync Integration**: Synchronize shape state mutations across clients using CRDTs over WebSockets, Liveblocks, or Supabase.
- **Live Multiplayer Cursors**: Display real-time remote mouse positions with name tags, custom avatar colors, and selection bounding highlights.
- **Collaborator Presence**: Active team user list and follow-user camera mode.

#### 2. ☁️ Cloud Storage & Workspace Management
- **Cloud Document Sync**: Cloud storage integration (PostgreSQL / Supabase / Firebase) paired with user authentication (OAuth).
- **Workspace Dashboard**: Cloud project folders, tag organization, and diagram search.
- **Shareable Links & Access Control**: Granular view-only, comment-only, and editor permissions.

#### 3. 📜 Version History & Snapshot Timeline
- **Named Revisions**: Create named revision checkpoints before making major structural changes.
- **Visual History Diff**: Interactive timeline slider to compare and restore previous document snapshots.

---

### Phase 3: Presentation, UX & AI Features

#### 4. 🎯 Frames / Artboards & Presentation Mode
- **Frame Container Tool**: Group shapes inside named Frames (e.g., Slide 1, Slide 2, Wireframe A) that move all contained elements together.
- **Interactive Presentation Mode**: Fullscreen presenter view with camera transitions between Frames using arrow key navigation.

#### 5. 🤖 AI-Powered Smart Whiteboard Assistance
- **Text-to-Diagram Generation**: Convert natural language prompts into flowcharts, mind maps, or sequence diagrams via LLM API integration.
- **Freehand Stroke Auto-Cleanup**: AI geometry recognition that converts rough hand strokes into clean circles, rectangles, or arrows.
- **LaTeX Math Equations**: KaTeX / MathJax rendering support for mathematical formulas inside text shapes.

#### 6. 🏷️ Path Text Labels & Advanced Connectors
- **Path Text Labels**: Double-click any line/arrow segment to insert text labels attached to vector paths.
- **Auto-Routing Around Shapes**: Orthogonal connector paths that avoid overlapping intermediate shapes.
- **Curved Connectors**: Optional bezier-curve routing for organic diagram styles.

---

### Phase 4: Export Formats & Performance Optimization

#### 7. 📤 Multi-Format Import / Export Pipeline
- **SVG Vector Export**: Export clean, scalable SVG files with embedded CSS styling and custom fonts.
- **Excalidraw & tldraw Interoperability**: Direct import and export of `.excalidraw` and `.tldraw` JSON document schemas.
- **Code Export**: Convert selected shapes into React / HTML SVG code or Mermaid.js markup.

#### 8. ⚡ Enterprise Spatial Scaling & Performance
- **R-Tree / Quadtree Spatial Indexing**: Implement spatial partitioning (`rbush`) for viewport frustum culling to seamlessly render 10,000+ shape nodes.
- **Web Workers**: Offload heavy image processing, PDF exports, and 3D mesh computations to Web Worker threads.

---

## 📅 3. Implementation Priority Matrix

| Priority Phase | Feature / Module | Focus Area | Status | Complexity |
| :--- | :--- | :--- | :--- | :--- |
| ~~Phase 1~~ | ~~Smart Anchors & Orthogonal Arrows~~ | ~~Diagramming / Flowcharting~~ | ✅ Done | Medium |
| ~~Phase 1~~ | ~~Hand-Drawn "Rough.js" Mode~~ | ~~Canvas Aesthetics~~ | ✅ Done | Medium-High |
| ~~Phase 1~~ | ~~Image Drop & Extended Shapes~~ | ~~Media & Asset Handling~~ | ✅ Done | Medium |
| ~~Phase 1~~ | ~~Sticky Notes & SVG Import~~ | ~~Productivity & Interop~~ | ✅ Done | Medium |
| **Phase 2** | Real-Time Collaboration (Yjs/CRDTs) | Multiplayer Infrastructure | 🔜 Next | High |
| **Phase 2** | Cloud Dashboard & User Auth | Backend Integration | 🔜 Next | High |
| **Phase 3** | Frame Containers & Presentation Mode | Slides & Artboards | Planned | Medium-High |
| **Phase 3** | AI Text-to-Diagram Generator | Generative AI Features | Planned | High |
| **Phase 3** | Path Text Labels & Advanced Connectors | Diagramming Polish | Planned | Medium |
| **Phase 4** | SVG Export & Excalidraw Schema Sync | Interoperability | Planned | Medium-High |
| **Phase 4** | R-Tree Spatial Indexing & Web Workers | Performance | Planned | High |

---

*Generated for InkFlow codebase — Last updated: July 2026.*
