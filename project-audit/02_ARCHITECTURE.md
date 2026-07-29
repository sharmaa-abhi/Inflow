# 02 — Architecture Review

## High-Level Architecture

InkFlow follows a **Manager-Singleton + Event-Bus** architecture pattern. All core subsystems are instantiated as module-level singletons, wired together at boot in `main.js`, and communicate via a central `EventBus` pub/sub system.

```
┌─────────────────────────────────────────────────────────────────────┐
│                          index.html (DOM)                          │
│   ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────────┐  │
│   │  Header   │  │  Footer  │  │  Sidebar │  │ Properties Panel │  │
│   │ (Toolbar) │  │ (Status) │  │ (Layers) │  │   (Floating)     │  │
│   └─────┬─────┘  └────┬─────┘  └────┬─────┘  └───────┬──────────┘  │
└─────────┼──────────────┼────────────┼─────────────────┼─────────────┘
          │              │            │                 │
          ▼              ▼            ▼                 ▼
┌──────────────────────────────────────────────────────────────────────┐
│                         main.js  (Bootstrap)                        │
│   Instantiates managers, wires DOM events, initializes mobile UI    │
└───────────┬──────────────────────────────────────────┬───────────────┘
            │                                          │
            ▼                                          ▼
┌───────────────────────┐                ┌──────────────────────────┐
│    EventBus (pub/sub) │◄──────────────►│   CanvasEngine (Konva)   │
│  Global event broker  │                │  Stage, Layers, Grid,    │
│                       │                │  Zoom, Pan, Coordinates  │
└───────────┬───────────┘                └──────────┬───────────────┘
            │                                       │
    ┌───────┴──────────────────────┐                │
    │                              │                │
    ▼                              ▼                ▼
┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────────┐
│  Shape   │  │  Tool    │  │  History  │  │    Snap/Anchor   │
│  Manager │  │  Manager │  │  Manager  │  │    Managers      │
└──────────┘  └──────────┘  └──────────┘  └──────────────────┘
    │              │
    ▼              ▼
┌──────────┐  ┌──────────┐
│  Style   │  │Persistence│
│  Manager │  │  Manager  │
└──────────┘  └──────────┘
```

## Layer Architecture (Konva)

| Layer | Purpose | Z-Order |
|---|---|---|
| `backgroundLayer` | Grid rendering (dot/square/plain) via `sceneFunc` | Bottom |
| `shapeLayer` | All user shapes (rects, circles, lines, text, images, etc.) | Middle |
| `overlayLayer` | Selection UI, snap guides, laser trail, anchor dots, neighbor buttons | Top |

## Module Inventory

### Core (`src/core/`)
| File | Responsibility |
|---|---|
| `CanvasEngine.js` | Konva stage init, grid rendering, zoom/pan, coordinate transforms |
| `EventBus.js` | Global pub/sub event dispatcher |

### Managers (`src/managers/`)
| File | Responsibility |
|---|---|
| `ShapeManager.js` | Shape CRUD, selection state, clipboard, shape recreation |
| `ToolManager.js` | Active tool switching, keyboard shortcuts, delete/copy/paste/reorder |
| `HistoryManager.js` | Undo/redo stack with closured action callbacks |
| `PersistenceManager.js` | Autosave to localStorage, JSON/Excalidraw import-export, PNG export |
| `StyleManager.js` | Active style state (stroke, fill, font, etc.), style application |
| `ThemeManager.js` | Dark/light mode toggle, localStorage persistence |
| `SnapManager.js` | Smart snapping guides during drag operations |
| `AnchorManager.js` | Connection anchor point detection and orthogonal connector routing |
| `PreviewManager3D.js` | 3D layer preview modal (CSS 3D transforms of shape thumbnails) |

### Tools (`src/tools/`)
| File | Responsibility |
|---|---|
| `BaseTool.js` | Abstract base class for pointer event delegation |
| `SelectTool.js` | Selection, marquee, drag, resize, rotate, transformer, label editing |
| `ShapeTool.js` | Drawing all geometric shapes and connectors |
| `PenTool.js` | Freehand drawing with path simplification (RDP/ERDP) |
| `TextTool.js` | Inline text editing via DOM textarea overlay |
| `ImageTool.js` | Image upload via file picker and drag-and-drop |
| `LaserTool.js` | Laser pointer trail with fade animation |
| `StickyTool.js` | Sticky note creation with neighbor quick-add buttons |

### Shapes (`src/shapes/`)
| File | Type Key |
|---|---|
| `BaseShape.js` | Abstract base — wraps Konva node + rough.js rendering |
| `RectShape.js` | `rectangle` |
| `CircleShape.js` | `circle` (ellipse) |
| `DiamondShape.js` | `diamond` |
| `LineShape.js` | `line` |
| `ArrowShape.js` | `arrow` |
| `PillShape.js` | `pill` (capsule) |
| `ParallelogramShape.js` | `parallelogram` |
| `TrapezoidShape.js` | `trapezoid` |
| `CylinderShape.js` | `cylinder` |
| `CloudShape.js` | `cloud` |
| `StarShape.js` | `star` |
| `SpeechBubbleShape.js` | `speechBubble` |
| `StickyNoteShape.js` | `stickyNote` |
| `PenShape.js` | `pen` |
| `TextShape.js` | `text` |
| `ImageShape.js` | `image` |

### UI (`src/ui/`)
| File | Responsibility |
|---|---|
| `Toolbar.js` | Top toolbar tool button activation/deactivation |
| `Sidebar.js` | Shape layers list panel |
| `PropertiesPanel.js` | Floating properties popup (style, geometry, arrange) |
| `MainMenu.js` | Hamburger menu dropdown (file actions, canvas settings, theme) |
| `Statusbar.js` | Footer zoom controls and coordinate display |
| `Tooltip.js` | Custom tooltip system (replaces native `title` tooltips) |
| `ContextMenu.js` | Right-click context menu (copy, paste, reorder, delete) |

### Utils (`src/utils/`)
| File | Responsibility |
|---|---|
| `math.js` | Angle snapping, path simplification (RDP, enhanced RDP) |
| `colors.js` | Color palette definitions, HEX/RGB/HSL conversion |
| `helpers.js` | ID generation, debounce utility |
| `routing.js` | Orthogonal (Manhattan) connector path computation |
| `roughRenderer.js` | Rough.js shape-to-canvas bridge |
| `svgParser.js` | Raw SVG XML → Konva Group converter |

## Architecture Issues

### Critical
1. **Manager Singletons are tightly coupled** — Managers import each other directly (`ShapeTool` imports `shapeManager`, `historyManager`, `anchorManager`, `styleManager`). No dependency injection, no testability.
2. **EventBus listeners are never cleaned up** — `StickyTool` constructor subscribes to `selection-changed` but never unsubscribes, causing potential duplicate listeners if the tool is ever re-instantiated.
3. **No separation between data model and rendering** — Shape state (`x`, `y`, `width`, `style`) is stored directly on shape class instances alongside Konva node references. There is no pure data model layer.

### Moderate
4. **Bootstrap order dependency** — `main.js` must wire managers in a specific undocumented order. Getting it wrong causes silent failures.
5. **DOM ID coupling** — UI controllers query DOM elements by hardcoded string IDs. No constants, no validation, no error messages if an element is missing.
6. **Mixed rendering paradigm** — Some shapes use Konva built-in nodes (Line, Arrow, Text, Ellipse), others use `Konva.Shape` with custom `sceneFunc`, and the rough renderer uses offscreen `<canvas>` elements converted to `Konva.Image`. Three different rendering paths with different update semantics.
