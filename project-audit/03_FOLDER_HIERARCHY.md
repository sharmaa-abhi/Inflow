# 03 — Folder Hierarchy

```
c:\Excelidraw\
├── .gitignore                          # Git ignore rules
├── index.html                          # Single-page application entry (961 lines)
├── package.json                        # NPM config (version 0.0.0)
├── package-lock.json                   # Lock file
├── vite.config.js                      # Vite + Tailwind plugin
│
├── public/
│   ├── favicon.svg                     # App favicon (SVG)
│   └── inkflow-og.png                  # Open Graph social image
│
├── src/
│   ├── main.js                         # Application bootstrap (449 lines)
│   ├── style.css                       # Primary stylesheet (~3000+ lines)
│   ├── mobile-ui.css                   # Mobile-specific styles
│   ├── mobile-ui.js                    # Mobile bottom sheet + more menu logic
│   │
│   ├── core/
│   │   ├── CanvasEngine.js             # Konva stage, grid, zoom/pan (210 lines)
│   │   └── EventBus.js                 # Pub/sub event dispatcher (38 lines)
│   │
│   ├── managers/
│   │   ├── AnchorManager.js            # Connector anchor detection (250 lines)
│   │   ├── HistoryManager.js           # Undo/redo stack (80 lines)
│   │   ├── PersistenceManager.js       # Save/load/export (420 lines)
│   │   ├── PreviewManager3D.js         # 3D layer preview (180 lines)
│   │   ├── ShapeManager.js             # Shape CRUD + selection (200 lines)
│   │   ├── SnapManager.js              # Smart snapping (150 lines)
│   │   ├── StyleManager.js             # Active style state (120 lines)
│   │   ├── ThemeManager.js             # Dark/light mode (65 lines)
│   │   └── ToolManager.js              # Tool switching + shortcuts (300 lines)
│   │
│   ├── shapes/
│   │   ├── BaseShape.js                # Abstract base class (260 lines)
│   │   ├── RectShape.js                # Rectangle
│   │   ├── CircleShape.js              # Ellipse
│   │   ├── DiamondShape.js             # Diamond/rhombus
│   │   ├── LineShape.js                # Line connector
│   │   ├── ArrowShape.js               # Arrow connector
│   │   ├── PillShape.js                # Capsule/pill
│   │   ├── ParallelogramShape.js       # Parallelogram
│   │   ├── TrapezoidShape.js           # Trapezoid
│   │   ├── CylinderShape.js            # Database cylinder
│   │   ├── CloudShape.js               # Cloud node
│   │   ├── StarShape.js                # 5-point star
│   │   ├── SpeechBubbleShape.js        # Speech callout
│   │   ├── StickyNoteShape.js          # Sticky note
│   │   ├── PenShape.js                 # Freehand path
│   │   ├── TextShape.js                # Text label
│   │   └── ImageShape.js               # Raster image
│   │
│   ├── tools/
│   │   ├── BaseTool.js                 # Abstract base class
│   │   ├── SelectTool.js               # Selection + transform (500 lines)
│   │   ├── ShapeTool.js                # Shape drawing (312 lines)
│   │   ├── PenTool.js                  # Freehand drawing (131 lines)
│   │   ├── TextTool.js                 # Text editing (239 lines)
│   │   ├── ImageTool.js                # Image upload (98 lines)
│   │   ├── LaserTool.js                # Laser pointer (169 lines)
│   │   └── StickyTool.js               # Sticky notes (164 lines)
│   │
│   ├── ui/
│   │   ├── MainMenu.js                 # Hamburger menu (248 lines)
│   │   ├── PropertiesPanel.js          # Properties popup (650 lines)
│   │   ├── Sidebar.js                  # Shape layers list (150 lines)
│   │   ├── Statusbar.js                # Footer zoom/coords (62 lines)
│   │   ├── Toolbar.js                  # Top toolbar (100 lines)
│   │   ├── Tooltip.js                  # Custom tooltips (117 lines)
│   │   └── ContextMenu.js              # Right-click menu (203 lines)
│   │
│   └── utils/
│       ├── colors.js                   # Color palettes + conversion
│       ├── helpers.js                  # ID gen + debounce (27 lines)
│       ├── math.js                     # Geometry + path simplification
│       ├── roughRenderer.js            # Rough.js rendering bridge
│       ├── routing.js                  # Orthogonal connector routing (110 lines)
│       └── svgParser.js                # SVG XML → Konva parser
│
└── project-audit/                      # (This audit output)
```

## Hierarchy Issues

| Issue | Severity | Description |
|---|---|---|
| Monolithic HTML | Medium | `index.html` is 961 lines containing all UI markup. Should be componentized. |
| Monolithic CSS | Medium | `style.css` is 3000+ lines. No CSS modules, no per-component files. |
| No `tests/` directory | High | Zero test infrastructure. |
| No `docs/` directory | Low | No developer documentation beyond a single `.md` in `src/`. |
| No `.env` / config | Low | No environment configuration files for different deployment targets. |
| Missing `LICENSE` file | Medium | No license declared — legally ambiguous for open-source release. |
| Missing `README.md` at root | Medium | No root README for onboarding developers. |
