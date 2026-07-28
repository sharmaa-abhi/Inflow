# 🚀 InkFlow – Architectural Overview & Future Implementation Roadmap

This document provides a comprehensive overview of the **InkFlow** codebase, its current architectural design, and a structured strategic roadmap for future feature implementations.

---

## 📊 1. Current Project Status & Architecture

**InkFlow** is a modern, high-performance visual whiteboard application built with HTML5 Canvas, Konva.js, and Tailwind CSS v4.

### 🛠️ Tech Stack & Key Technologies
- **Core Engine**: Konva.js (`v10.3.0`) vector graphics rendering library over HTML5 Canvas.
- **Build Tooling**: Vite (`v8.1.1`), ES Modules, Tailwind CSS (`@tailwindcss/vite v4.3.2`).
- **Architecture Pattern**: Event-driven pub/sub event bus (`EventBus.js`) decoupling managers, tools, shapes, and UI views.
- **State Management**: Specialized modular managers (`ToolManager`, `ShapeManager`, `HistoryManager`, `StyleManager`, `SnapManager`, `PersistenceManager`, `ThemeManager`, `ThreeDPreviewManager`).

### ✨ Built-in Capabilities
1. **Vector Drawing Shapes**: Rectangles, Circles/Ellipses, Diamonds, Lines, Arrows, Pen paths (freehand vector drawing), and multiline Text with custom Virgil/handwriting fonts.
2. **Transformations & Multi-Selection**: Bounding box transformer controls (rotation, scaling, translation), multi-shape marquee drag, copy, paste, duplicate, and z-index ordering.
3. **Smart Snapping**: Alignment guide mechanics snapping bounding boxes and centers of nearby elements with dashed alignment lines.
4. **Presentation Laser Pointer**: Glowing fading red trail with continuous cursor tracking.
5. **3D Preview Extrusion**: Live isometric 3D mesh preview renderer modal (`ThreeDPreviewManager`).
6. **Dark / Light Glassmorphism UI**: High-contrast theme adapter automatically shifting grid colors, toolbar styling, context menus, property panels, and tooltips.
7. **Document Persistence & Exports**: Autosave to LocalStorage, JSON document import/export schema, and cropped high-DPI PNG generation.
8. **Mobile Responsive Experience**: Adaptive bottom sheets, responsive toolbars, and touch handle adapters (`mobile-ui.js`).

---

## 🗺️ 2. Strategic Future Implementation Roadmap

```
                                  INKFLOW ROADMAP
 ┌──────────────────────┐  ┌──────────────────────┐  ┌──────────────────────┐
 │   Smart Connectors   │  │ Hand-Drawn Rough.js  │  │ Real-Time Sync & CRDT│
 │  & Orthogonal Routing│  │   Sketchy Aesthetics │  │  Multi-User Presence │
 └──────────┬───────────┘  └──────────┬───────────┘  └──────────┬───────────┘
            │                         │                         │
 ┌──────────┴───────────┐  ┌──────────┴───────────┐  ┌──────────┴───────────┐
 │ Frames & Presentation│  │  AI Smart Whiteboard │  │  SVG / Excalidraw /  │
 │     Artboard Modes   │  │ Generative Diagrams  │  │  Mermaid Import-Export│
 └──────────────────────┘  └──────────────────────┘  └──────────────────────┘
```

---

### Phase 1: High-Impact Canvas & Graphic Engine Enhancements

#### 1. 🔀 Smart Anchor Points & Orthogonal Arrow Routing
- **Magnetic Anchor Snap**: Interactive connection anchors (top, right, bottom, left, center) rendered on shape perimeters when drawing lines/arrows near objects.
- **Orthogonal (Manhattan) Line Routing**: Multi-segment right-angled polyline paths that automatically route around intermediate shapes without overlapping.
- **Path Text Labels**: Double-click any line/arrow segment to insert text labels attached to vector paths.

#### 2. 🎨 Hand-Drawn "Rough.js" Sketchy Aesthetic Mode
- **Rough.js Renderer**: Toggle between **Crisp Vector** mode and **Hand-Drawn / Sketchy** mode using `roughjs` stroke algorithms.
- **Custom Fill Patterns**: Support hachure, cross-hatch, dot, and hand-drawn fill textures.

#### 3. 🖼️ Advanced Media Uploads & Extended Shape Library
- **Image & Media Nodes**: Drag-and-drop / upload local images (PNG, JPEG, WebP, SVG) onto canvas with aspect ratio locking, cropping, and border filters.
- **Extended Diagram Shapes**: Process Pill/Stadium, Parallelogram, Trapezoid, Database Cylinder, Cloud, Star, and Speech Callout Bubbles.
- **Sticky Notes**: Colored sticky note boxes with auto-wrapped text, shadow effects, and quick-add neighbor buttons.
- **SVG Vector Converter**: Import raw SVG XML files and parse them into native editable Konva vector nodes.

---

### Phase 2: Multiplayer Collaboration & Cloud Persistence

#### 4. 🌐 Real-Time Multiplayer Collaboration (CRDTs + WebSockets)
- **Yjs / Automerge Sync Integration**: Synchronize shape state mutations across clients using CRDTs over WebSockets, Liveblocks, or Supabase.
- **Live Multiplayer Cursors**: Display real-time remote mouse positions with name tags, custom avatar colors, and selection bounding highlights.
- **Collaborator Presence**: Active team user list and follow-user camera mode.

#### 5. ☁️ Cloud Storage & Workspace Management
- **Cloud Document Sync**: Cloud storage integration (PostgreSQL / Supabase / Firebase) paired with user authentication (OAuth).
- **Workspace Dashboard**: Cloud project folders, tag organization, and diagram search.
- **Shareable Links & Access Control**: Granular view-only, comment-only, and editor permissions.

#### 6. 📜 Version History & Snapshot Timeline
- **Named Revisions**: Create named revision checkpoints before making major structural changes.
- **Visual History Diff**: Interactive timeline slider to compare and restore previous document snapshots.

---

### Phase 3: Presentation, UX & AI Features

#### 7. 🎯 Frames / Artboards & Presentation Mode
- **Frame Container Tool**: Group shapes inside named Frames (e.g., Slide 1, Slide 2, Wireframe A) that move all contained elements together.
- **Interactive Presentation Mode**: Fullscreen presenter view with camera transitions between Frames using arrow key navigation.

#### 8. 🤖 AI-Powered Smart Whiteboard Assistance
- **Text-to-Diagram Generation**: Convert natural language prompts into flowcharts, mind maps, or sequence diagrams via LLM API integration.
- **Freehand Stroke Auto-Cleanup**: AI geometry recognition that converts rough hand strokes into clean circles, rectangles, or arrows.
- **LaTeX Math Equations**: KaTeX / MathJax rendering support for mathematical formulas inside text shapes.

---

### Phase 4: Export Formats & Performance Optimization

#### 9. 📤 Multi-Format Import / Export Pipeline
- **SVG Vector Export**: Export clean, scalable SVG files with embedded CSS styling and custom fonts.
- **Excalidraw & tldraw Interoperability**: Direct import and export of `.excalidraw` and `.tldraw` JSON document schemas.
- **Code Export**: Convert selected shapes into React / HTML SVG code or Mermaid.js markup.

#### 10. ⚡ Enterprise Spatial Scaling & Performance
- **R-Tree / Quadtree Spatial Indexing**: Implement spatial partitioning (`rbush`) for viewport frustum culling to seamlessly render 10,000+ shape nodes.
- **Web Workers**: Offload heavy image processing, PDF exports, and 3D mesh computations to Web Worker threads.

---

# 📅 3. Implementation Priority Matrix

| Priority Phase | Feature / Module | Focus Area | Complexity |
| :--- | :--- | :--- | :--- |
| **Phase 1** | Smart Anchors & Orthogonal Arrows | Diagramming / Flowcharting | Medium |
| **Phase 1** | Image Drop & Extended Shapes | Media & Asset Handling | Medium |
| **Phase 2** | Hand-Drawn "Rough.js" Mode | Canvas Aesthetics | Medium-High |
| **Phase 2** | Frame Containers & Presentation Mode | Slides & Artboards | Medium-High |
| **Phase 3** | Yjs Real-Time Collaboration | Multiplayer Infrastructure | High |
| **Phase 3** | Cloud Dashboard & User Auth | Backend Integration | High |
| **Phase 4** | AI Text-to-Diagram Generator | Generative AI Features | High |
| **Phase 4** | SVG Export & Excalidraw Schema Sync | Interoperability | Medium-High |

---

*Generated for InkFlow codebase.*
