# 17 — Critical Bugs Report

> **Total Bugs Found: 17**
> 🔴 Critical: 8 | 🟡 Medium: 6 | 🟢 Low: 3

---

## 🔴 CRITICAL BUGS

### BUG-001: Theme Toggle Crash in Main Menu
- **File**: [`MainMenu.js:137`](file:///c:/Excelidraw/src/ui/MainMenu.js)
- **Severity**: 🔴 Critical (Runtime crash)
- **Repro**: Click hamburger menu → Click "Toggle Theme"
- **Root Cause**: `MainMenu.js:137` calls `themeManager.toggle()`, but `ThemeManager.js` has no `toggle()` method. It only exposes `setDarkTheme(isDark)`.
- **Impact**: Clicking the theme toggle button in the main menu throws `TypeError: themeManager.toggle is not a function`, crashing the menu handler. The toolbar's separate theme toggle button (`#btn-theme-toggle`) works correctly because it calls `themeManager.setDarkTheme(!this.isDark)`.
- **Fix**:
```diff
// MainMenu.js:137
- themeManager.toggle();
+ themeManager.setDarkTheme(!themeManager.isDark);
```

---

### BUG-002: Mobile "Delete Shape" Clears Entire Canvas
- **File**: [`main.js:284-286`](file:///c:/Excelidraw/src/main.js)
- **Severity**: 🔴 Critical (Data destruction)
- **Repro**: On mobile → Select a shape → Open properties sheet → Tap "Delete Shape"
- **Root Cause**: The mobile delete button handler clicks the desktop `#btn-clear` element (which is the "Clear Canvas" button) instead of deleting only the selected shape.
- **Impact**: User expects to delete one shape but is prompted to clear the entire canvas. If confirmed, all work is lost.
- **Fix**:
```diff
// main.js:284-286
  deleteShapeBtn?.addEventListener('click', () => {
-   document.getElementById('btn-clear')?.click();
+   toolManager.deleteSelectedShapes();
    closePropsSheet();
  });
```

---

### BUG-003: Ghost Nodes on File Import (Memory Leak)
- **File**: [`PersistenceManager.js:309`](file:///c:/Excelidraw/src/managers/PersistenceManager.js)
- **Severity**: 🔴 Critical (Memory leak + visual corruption)
- **Repro**: Draw shapes → Import a JSON file
- **Root Cause**: `importSceneData(data)` calls `shapeManager.clear()` to remove shapes from the manager's registry, but does **not** call `.destroy()` on existing shapes' `konvaNode` instances and does not call `shapeLayer.destroyChildren()`. The old Konva nodes remain on the canvas layer.
- **Impact**: Old shapes are visually overlaid on top of imported shapes. They cannot be selected or deleted (since they're no longer in `shapeManager`). They consume memory and degrade rendering performance. Continued imports compound the leak.
- **Fix**:
```diff
// PersistenceManager.js importSceneData()
+ const existingShapes = shapeManager.getAllShapes();
+ existingShapes.forEach(s => s.destroy());
+ this.canvasEngine.shapeLayer.destroyChildren();
  shapeManager.clear();
```

---

### BUG-004: Sketchy Mode Causes 11 of 16 Shape Types to Disappear or Morph
- **File**: [`roughRenderer.js:60`](file:///c:/Excelidraw/src/utils/roughRenderer.js)
- **Severity**: 🔴 Critical (Feature broken)
- **Repro**: Draw a cylinder/cloud/star/speech bubble/sticky note/pill/parallelogram/trapezoid/image/text/pen → Toggle sketchy (hand-drawn) mode
- **Root Cause**: `roughRenderer.js` only implements rough equivalents for 5 shape types: `rectangle`, `circle`, `diamond`, `line`, `arrow`. The remaining 11 types fall through to a `default` case that renders an empty transparent canvas. Some shapes (e.g., `CylinderShape`) call `renderRoughWith({ type: 'rectangle' })` as a fallback, causing them to morph into rectangles.
- **Impact**: Toggling sketchy mode causes most shapes to either vanish entirely or transform into wrong shapes. Text, images, and pen strokes become invisible.
- **Fix**: Implement rough rendering for all shape types, or gracefully skip rough rendering for unsupported types (keep the Konva node visible).

---

### BUG-005: SVG Import Creates Untracked, Unselectable Ghost Nodes
- **File**: [`svgParser.js`](file:///c:/Excelidraw/src/utils/svgParser.js) + [`MainMenu.js`](file:///c:/Excelidraw/src/ui/MainMenu.js)
- **Severity**: 🔴 Critical (Feature broken)
- **Repro**: Main menu → "Import RAW SVG Vector XML" → Select an SVG file
- **Root Cause**: `createKonvaNodesFromSvg()` returns a `Konva.Group` which is added directly to `shapeLayer`, but is **never registered with `shapeManager`**. There is no `SvgShape` class.
- **Impact**:
  - Imported SVG paths cannot be selected (clicking them clears selection)
  - They cannot be deleted, moved (with history), or modified
  - They are NOT saved in JSON export or autosave (since `PersistenceManager` serializes from `shapeManager`)
  - Refreshing the page loses all imported SVGs
  - They are effectively invisible to the application's data model
- **Fix**: Create an `SvgShape` class that wraps the Konva Group, or convert SVG paths into `PenShape` instances registered with `shapeManager`.

---

### BUG-006: Connector Label Edits Cannot Be Undone
- **File**: [`SelectTool.js:457`](file:///c:/Excelidraw/src/tools/SelectTool.js)
- **Severity**: 🔴 Critical (Data integrity)
- **Repro**: Draw an arrow between two shapes → Double-click the arrow → Type a label → Click away → Press Ctrl+Z
- **Root Cause**: `_openConnectorLabelEditor()` applies the label text directly to `shape.labelText` on blur, but never calls `historyManager.registerChange()`. The label edit is not tracked in the undo/redo stack.
- **Impact**: Users cannot undo label changes. In a complex diagram with many connector labels, this means accidental text changes are permanent (until manual re-editing).
- **Fix**: Register the label change with `historyManager` before applying.

---

### BUG-007: Double-Tap to Edit Text Doesn't Work on Mobile
- **File**: [`SelectTool.js`](file:///c:/Excelidraw/src/tools/SelectTool.js)
- **Severity**: 🔴 Critical (Feature broken on mobile)
- **Repro**: On mobile/touch device → Double-tap a text shape
- **Root Cause**: Double-click detection uses `event.evt.detail === 2`. Touch events on mobile do not set `detail` to `2` — this property is only meaningful for mouse `click` events.
- **Impact**: Mobile users cannot open the text editor by double-tapping. There is no alternative gesture or button to enter text editing mode on mobile.
- **Fix**: Implement manual double-tap detection with timestamp:
```javascript
const now = Date.now();
const isDoubleTap = (now - this._lastTapTime) < 300;
this._lastTapTime = now;
```

---

### BUG-014: Desktop Properties Panel "Delete Selection" Button Silently Fails
- **File**: [`PropertiesPanel.js:111`](file:///c:/Excelidraw/src/ui/PropertiesPanel.js)
- **Severity**: 🔴 Critical (Feature broken)
- **Repro**: Select shape → Click "Delete Selection" button in Properties Panel
- **Root Cause**: `PropertiesPanel.js:111` attempts to call `toolManager.deleteSelected?.()`, but `ToolManager.js` names the method `deleteSelectedShapes()`.
- **Impact**: Clicking the "Delete Selection" button in the desktop panel closes the panel via `deselectAll()`, but fails to delete the shape from canvas.
- **Fix**:
```diff
// PropertiesPanel.js:111
- toolManager.deleteSelected?.();
+ toolManager.deleteSelectedShapes();
```

---

## 🟡 MEDIUM BUGS

### BUG-008: Layout Thrashing in Grid Renderer
- **File**: [`CanvasEngine.js:85`](file:///c:/Excelidraw/src/core/CanvasEngine.js)
- **Severity**: 🟡 Medium (Performance degradation)
- **Issue**: `document.body.classList.contains('dark')` queried inside `sceneFunc` during every pan/zoom frame causes style recalculation.
- **Fix**: Cache the boolean in a class field, update on `theme-changed` event.

### BUG-009: O(N²) Snapping Performance
- **File**: [`SnapManager.js:64`](file:///c:/Excelidraw/src/managers/SnapManager.js)
- **Severity**: 🟡 Medium (Performance degradation at scale)
- **Issue**: `getClientRect()` called for every shape on every drag frame.
- **Fix**: Cache bounding rects at drag start.

### BUG-010: History Stack Flooding from Sliders
- **File**: [`PropertiesPanel.js:496, 608`](file:///c:/Excelidraw/src/ui/PropertiesPanel.js)
- **Severity**: 🟡 Medium (UX degradation)
- **Issue**: Dragging color pickers or smoothing sliders creates 30-50+ undo entries per drag.
- **Fix**: Debounce — register undo entry on `change` (mouseup) not `input` (mousemove).

### BUG-011: Unbounded Undo Stack Memory Growth
- **File**: [`HistoryManager.js`](file:///c:/Excelidraw/src/managers/HistoryManager.js)
- **Severity**: 🟡 Medium (Memory leak over time)
- **Issue**: No cap on undo stack size. Long sessions accumulate unbounded closured state.
- **Fix**: Cap at ~150 entries, drop oldest.

### BUG-015: File Import Corrupts State on Uncaught Parse Error
- **File**: [`PersistenceManager.js:309`](file:///c:/Excelidraw/src/managers/PersistenceManager.js)
- **Severity**: 🟡 Medium (State corruption)
- **Issue**: If an imported file contains malformed shape data, `recreateShape()` returns null or throws, leaving the canvas in a partially cleared or broken state.
- **Fix**: Wrap individual shape recreation in try-catch and validate shape JSON schema before modifying state.

### BUG-016: Mobile Theme Switcher Icon Desynchronization
- **File**: [`main.js:198`](file:///c:/Excelidraw/src/main.js)
- **Severity**: 🟡 Medium (UI state desync)
- **Issue**: `main.js` attempts to monkey-patch `themeManager.toggle`, but `ThemeManager` uses `setDarkTheme(isDark)`. Mobile theme icons (`#mb-theme-icon-sun`, `#mb-theme-icon-moon`) do not stay synchronized when theme changes via main menu or keyboard.
- **Fix**: Subscribe mobile icon updates directly to `eventBus.on('theme-changed')`.

---

## 🟢 LOW BUGS

### BUG-012: Console.log Statements in Production
- **File**: [`Tooltip.js:7, 16`](file:///c:/Excelidraw/src/ui/Tooltip.js)
- **Severity**: 🟢 Low (Console pollution)
- **Fix**: Remove both `console.log()` calls.

### BUG-013: Incorrect Favicon Path
- **File**: [`index.html:6`](file:///c:/Excelidraw/index.html)
- **Severity**: 🟢 Low (404 warning, missing favicon)
- **Current**: `href="/public/favicon.svg"`
- **Fix**: `href="/favicon.svg"` (Vite serves `public/` at root path)

### BUG-017: Z-Index Stepper Input Allows Out-of-Bounds Values
- **File**: [`PropertiesPanel.js:124`](file:///c:/Excelidraw/src/ui/PropertiesPanel.js)
- **Severity**: 🟢 Low (UI edge case)
- **Issue**: Manual entry in Z-Index input field accepts negative numbers or numbers exceeding total shape count.
- **Fix**: Clamp input value between `0` and `allShapes.length - 1` before invoking `toolManager.changeSelectedZIndex(val)`.

