# 02 — User Journeys & Cross-Feature Integration

## User Journey 1: Create & Style Architecture Diagram

### Step-by-Step Flow Audit
1. **User Goal**: Draw a flowchart with rectangles, database cylinder, connectors, and text labels.
2. **Step 1: Select Rectangle Tool** -> User presses `R` or clicks Rectangle in top toolbar. `ToolManager.setTool('rectangle')` activates `ShapeTool`. Crosshair cursor appears. ✅
3. **Step 2: Drag on Canvas** -> `pointerdown` -> `pointermove` -> `pointerup`. `RectShape` instantiated, added to `shapeManager`, added to `shapeLayer`, registered in `historyManager`. ✅
4. **Step 3: Auto-select & Open Properties** -> On `pointerup`, `shapeManager.select([shape.id])` emits `selection-changed`. `PropertiesPanel` receives event, animates `panel-open`, syncs geometry/colors. ✅
5. **Step 4: Draw Database Cylinder** -> User opens Extended Shapes dropdown, selects `cylinder`, drags on canvas. `CylinderShape` created. ✅
6. **Step 5: Connect with Arrow** -> User selects Arrow tool (`A`). Hovering shape shows blue anchor dots (`AnchorManager`). User drags from Rectangle right anchor to Cylinder left anchor. `computeOrthogonalPath` routes Manhattan line. `endBinding` and `startBinding` saved on shape. ✅
7. **Step 6: Move Rectangle** -> User switches to Select tool (`V`), drags Rectangle. `AnchorManager.updateBoundConnectors()` fires on drag move. Arrow connector recalculates path in real-time. ✅
8. **Integration Rating**: **95/100** — Excellent synchronization between tools, canvas, shape manager, and anchor routing.

---

## User Journey 2: Freehand Pen Drawing & Path Smoothing

### Step-by-Step Flow Audit
1. **User Goal**: Sketch a freehand diagram using pen tool and adjust smoothness.
2. **Step 1: Select Pen Tool** -> User presses `P`. `PenTool` activates.
3. **Step 2: Draw Curve** -> User drags. `PenTool` records canvas points array `[x0,y0, x1,y1, ...]`. Every >2px move triggers real-time path simplification via `simplifyPathERDP()` and updates `PenShape`. ✅
4. **Step 3: Finish Stroke** -> `pointerup`. `PenTool` checks if points.length < 6. If valid, registers addition in `historyManager` and emits `shapes-updated`. ✅
5. **Step 4: Adjust Smoothing** -> User selects Pen shape, opens Properties Panel (Smoothing section appears). User moves Smoothness Intensity slider. `input` event calls `styleManager.updateStyles({ smoothingTension: val / 100 })`. `PenShape` recalculates curve using new tension. ✅
6. **Integration Rating**: **90/100** — Smooth interaction. (Minor flaw: slider `input` event floods undo history stack).

---

## User Journey 3: Dark Mode & Theme State Synchronization

### Step-by-Step Flow Audit
1. **User Goal**: Switch application to Dark Mode and verify canvas elements adjust.
2. **Step 1: Click Desktop Dark Mode Button** -> User clicks `#btn-theme-toggle` in top toolbar. `ThemeManager.setDarkTheme(true)` executes. `body.classList.add('dark')`. `eventBus.emit('theme-changed', 'dark')`. ✅
3. **Step 2: Canvas Background Sync** -> `CanvasEngine` receives `theme-changed`, redraws grid with dark slate colors (`#0f172a` background, `#334155` dots). ✅
4. **Step 3: Default Shape Color Sync** -> `ShapeManager` receives `theme-changed`. Iterates shapes: automatically converts black/slate strokes (`#1e293b`) to white (`#ffffff`). Emits `shapes-style-modified`. Shapes re-render visibly against dark background. ✅
5. **Step 4: Alternative Path (Hamburger Menu)** -> User opens Main Menu, clicks "Toggle Theme". `MainMenu.js:137` calls `themeManager.toggle()` -> **CRASH (`TypeError: themeManager.toggle is not a function`)**. 🔴
6. **Integration Rating**: **50/100** — Works via desktop button, completely broken and crashes via hamburger menu!

---

## User Journey 4: Diagram Export & Re-Import Roundtrip

### Step-by-Step Flow Audit
1. **User Goal**: Save diagram to JSON file, clear canvas, and reload JSON file.
2. **Step 1: Export JSON** -> User clicks "Export JSON Diagram" (or presses Ctrl+S). `PersistenceManager.exportJSON()` serializes viewport, grid type, and all shapes to `.json` file download. ✅
3. **Step 2: Clear Canvas** -> User clicks "Clear Canvas" in menu. `ShapeManager.clear()` empties shapes map. `shapeLayer.destroyChildren()` clears canvas. ✅
4. **Step 3: Import JSON** -> User clicks "Import JSON / Excalidraw" (or presses Ctrl+O), selects exported JSON. `PersistenceManager.importJSON()` parses file, calls `importSceneData()`. ✅
5. **Step 4: State Restoration** -> Viewport zoom/pan restored, grid type set, shapes recreated via `ShapeManager.recreateShape()`. ✅
6. **Flaw Detection**: If user had imported an SVG vector prior to export, the SVG was not registered in `ShapeManager`. After step 3, the SVG is lost forever. 🔴
7. **Integration Rating**: **70/100** — Works for native shapes, fails for imported SVG vectors.

---

## Cross-Feature Integration Assessment

| Integration Pair | Interaction Behavior | Status | Issue / Flaw |
|---|---|---|---|
| **Shape Move + Connectors** | Moving shape re-routes attached arrows | ✅ Pass | Dynamic anchor position calculation works smoothly |
| **Properties Panel + Undo/Redo** | Changing color in panel -> Ctrl+Z | ✅ Pass | `StyleManager` registers `oldStyle` and `newStyle` |
| **Theme Toggle + Color Palettes** | Switching theme updates active swatches | ✅ Pass | `ThemeManager` triggers palette rebuild |
| **Mobile Properties Sheet + Delete** | Tap delete shape on mobile sheet | 🔴 Fail | Triggers canvas clear instead of shape delete |
| **Rough Mode + Extended Shapes** | Enable sketchy mode on Cloud/Star/Pill | 🔴 Fail | Shapes turn invisible or transform into plain rects |
| **SVG Import + History / Save** | Import SVG -> Ctrl+Z or Save | 🔴 Fail | SVG untracked, bypasses history and autosave entirely |
| **Text Editing + Shortcuts** | Typing in text shape -> press 'V' or 'R' | ✅ Pass | Keydown listeners ignore events when input/textarea active |
