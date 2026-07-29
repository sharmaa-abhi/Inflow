# 01 — Feature Discovery & Mapping

## Comprehensive Application Feature Matrix

| Feature Category | Feature Name | Primary File / Subsystem | Status | Description |
|---|---|---|---|---|
| **Core Canvas** | Infinite Pan & Zoom | `CanvasEngine.js` | ✅ Functional | Stage dragging, wheel zooming (10% to 500%), coordinate transform math |
| **Core Canvas** | Dynamic Grid Rendering | `CanvasEngine.js` | ⚠️ Buggy | Plain, Dot Grid, Square Grid options rendered via canvas `sceneFunc`. (Layout thrashing bug present) |
| **Shape CRUD** | Primitive Geometric Shapes | `ShapeTool.js`, `ShapeManager.js` | ✅ Functional | Rectangles, Circles, Diamonds, Pills, Parallelogram, Trapezoid, Cylinder, Cloud, Star, Speech Bubbles |
| **Shape CRUD** | Shift Aspect-Ratio Locking | `ShapeTool.js` | ✅ Functional | Pressing Shift while drawing locks 1:1 ratio (squares, circles, stars) |
| **Shape CRUD** | Freehand Pen & Smoothing | `PenTool.js`, `math.js` | ✅ Functional | Freehand vector paths with RDP & ERDP real-time smoothing and tension adjustment |
| **Shape CRUD** | Text Creation & Editing | `TextTool.js`, `TextShape.js` | ⚠️ Buggy | Inline overlay textarea. (Mobile double-tap broken) |
| **Shape CRUD** | Image Upload & Drag-Drop | `ImageTool.js`, `ImageShape.js` | ⚠️ Partial | Import via file picker or canvas drop. (No size limit, risks localStorage overflow) |
| **Shape CRUD** | Sticky Notes & Quick-Add | `StickyTool.js`, `StickyNoteShape.js` | ✅ Functional | Colorable sticky notes + hover '+' quick-add neighbor buttons in 4 directions |
| **Shape CRUD** | Laser Pointer Trail | `LaserTool.js` | ✅ Functional | Animated glowing red laser trail fading after 1000ms via `requestAnimationFrame` |
| **Selection Engine** | Marquee & Multi-Select | `SelectTool.js` | ✅ Functional | Rubberband drag selection box, Shift-click toggle selection |
| **Selection Engine** | Transformation & Nudging | `SelectTool.js`, `ToolManager.js` | ✅ Functional | Konva Transformer resize/rotate, Arrow keys nudge (Shift for 10px step) |
| **Selection Engine** | Copy, Paste & Duplicate | `ToolManager.js` | ✅ Functional | Clipboard buffer, +20px offset pasting, Ctrl+C / Ctrl+V / Ctrl+D |
| **Selection Engine** | Z-Index Reordering | `ShapeManager.js`, `ToolManager.js` | ✅ Functional | Bring to Front, Bring Forward, Send Backward, Send to Back, Direct Z-Index set |
| **Styling System** | Color Palette & Conversion | `StyleManager.js`, `colors.js` | ✅ Functional | Categorized palettes (Quick, Slate, Material, Pastel, Neon, Dark) with HEX/RGB/HSL conversion |
| **Styling System** | Stroke & Fill Customization | `PropertiesPanel.js` | ✅ Functional | Stroke width (Thin, Medium, Thick), stroke style (Solid, Dashed, Dotted), fill patterns |
| **Styling System** | Rough / Sketchy Mode | `roughRenderer.js`, `BaseShape.js` | 🔴 Broken | Hand-drawn rough.js mode. (11 of 16 shape types vanish or morph into rectangles) |
| **Connectors** | Anchor Points & Routing | `AnchorManager.js`, `routing.js` | ✅ Functional | 5 anchor points per shape, orthogonal (Manhattan) path calculation, auto re-routing |
| **Connectors** | Connector Labeling | `SelectTool.js` | ⚠️ Buggy | Inline label editor on line double-click. (Modifications bypass undo/redo history) |
| **Data Persistence** | Autosave & LocalStorage | `PersistenceManager.js` | ⚠️ Fragile | Debounced autosave to `inkflow_scene_state`. (No quota handling, fails silently on full storage) |
| **Data Persistence** | JSON Export & Import | `PersistenceManager.js` | ✅ Functional | Export scene JSON, import InkFlow JSON with state recreation |
| **Data Persistence** | Excalidraw File Compatibility | `PersistenceManager.js` | ✅ Functional | Converts Excalidraw `.excalidraw` schema into InkFlow shapes |
| **Data Persistence** | RAW SVG Vector XML Import | `svgParser.js`, `MainMenu.js` | 🔴 Broken | SVG XML parsing. (Imports untracked Konva nodes; unselectable, un-deletable, unsaved) |
| **Data Export** | PNG Image Export | `PersistenceManager.js` | ✅ Functional | Clean 2x retina PNG snapshot export with overlays & grid automatically hidden |
| **UI Components** | Main Hamburger Flyout | `MainMenu.js` | 🔴 Buggy | Brand header, canvas settings, file actions, theme toggle. (Theme toggle crashes menu!) |
| **UI Components** | Floating Properties Panel | `PropertiesPanel.js` | 🔴 Buggy | Contextual properties popup. (Delete button calls invalid method `deleteSelected()`, fails!) |
| **UI Components** | Bottom Statusbar & Footer | `Statusbar.js` | ✅ Functional | Coordinate readout, zoom readout (+/-/%/reset), undo/redo status buttons |
| **UI Components** | Custom Tooltip System | `Tooltip.js` | ⚠️ Flawed | Delegated hover tooltips. (Removes native `title` attribute, ships console logs) |
| **UI Components** | Context Menu | `ContextMenu.js` | ✅ Functional | Right-click canvas popup menu for copy/paste/layering |
| **UI Components** | 3D Layer Preview | `PreviewManager3D.js` | ✅ Functional | Interactive CSS 3D exploded layer visualization modal |
| **Mobile Integration**| Mobile Bottom Navigation | `mobile-ui.js`, `main.js` | ⚠️ Partial | Fixed mobile bottom tab bar, bottom properties sheet. (Delete button clears entire canvas!) |

---

## Unimplemented / Abandoned Features

1. **Authentication & User Management**: Non-existent. Pure client-side application.
2. **Real-time Collaboration / WebSockets**: Non-existent. Single-user browser state only.
3. **Cloud Storage / API Backend**: Non-existent.
4. **Export to SVG**: Menu and PersistenceManager do not support exporting to vector SVG.
5. **Shape Grouping**: `groupIds` is serialized in Excalidraw converters but no grouping/ungrouping UI or tool exists in InkFlow.
