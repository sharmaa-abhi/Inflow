# 17 — Critical Bugs Report

> **Total Bugs Found: 17**
> 🔴 Critical: 8 | 🟡 Medium: 6 | 🟢 Low: 3
>
> ✅ **Status: All 8 Critical bugs have been FIXED** (Build: passing, 116 modules)

---

## 🔴 CRITICAL BUGS

### ✅ FIXED — BUG-001: Theme Toggle Crash in Main Menu
- **File**: [`MainMenu.js:137`](file:///c:/Excelidraw/src/ui/MainMenu.js)
- **Severity**: 🔴 Critical (Runtime crash)
- **Fix Applied**: `themeManager.toggle()` → `themeManager.setDarkTheme(!themeManager.isDark)`

---

### ✅ FIXED — BUG-002: Mobile "Delete Shape" Clears Entire Canvas
- **File**: [`main.js:284-286`](file:///c:/Excelidraw/src/main.js)
- **Severity**: 🔴 Critical (Data destruction)
- **Fix Applied**: Mobile delete button now calls `toolManager.deleteSelectedShapes()` directly instead of `#btn-clear.click()`

---

### ✅ FIXED — BUG-003: Ghost Nodes on File Import (Memory Leak)
- **File**: [`PersistenceManager.js:309`](file:///c:/Excelidraw/src/managers/PersistenceManager.js)
- **Severity**: 🔴 Critical (Memory leak + visual corruption)
- **Fix Applied**: `importSceneData()` now calls `s.destroy()` on all existing shapes and `shapeLayer.destroyChildren()` before clearing the registry

---

### ✅ FIXED — BUG-004: Sketchy Mode Causes 11 of 16 Shape Types to Disappear or Morph
- **File**: [`roughRenderer.js:60`](file:///c:/Excelidraw/src/utils/roughRenderer.js)
- **Severity**: 🔴 Critical (Feature broken)
- **Fix Applied**:
  - Added `'cylinder'`, `'cloud'`, `'speechBubble'`, and `'polygon'` cases to `roughRenderer.js`
  - Updated `CylinderShape`, `CloudShape`, `SpeechBubbleShape`, `ParallelogramShape`, `TrapezoidShape`, `StarShape` to pass proper geometry to rough renderer
  - Added `applyRoughMode()` override to `TextShape`, `PenShape`, `ImageShape` to keep them visible in rough mode (no rough equivalent for these types)
  - Added graceful fallback in `BaseShape.renderRoughWith()`: if no bitmap produced, show crisp konva node instead

---

### ✅ FIXED — BUG-005: SVG Import Creates Untracked, Unselectable Ghost Nodes
- **File**: [`SvgShape.js`](file:///c:/Excelidraw/src/shapes/SvgShape.js) (NEW) + [`MainMenu.js`](file:///c:/Excelidraw/src/ui/MainMenu.js) + [`ShapeManager.js`](file:///c:/Excelidraw/src/managers/ShapeManager.js)
- **Severity**: 🔴 Critical (Feature broken)
- **Fix Applied**:
  - Created new `SvgShape` class extending `BaseShape` that wraps parsed SVG paths in a `Konva.Group`
  - SVG imports now registered with `shapeManager.addShape()` — selectable, deletable, serializable
  - History entry registered for undo/redo support
  - `ShapeManager.recreateShape()` handles `type: 'svg'` for JSON restore

---

### ✅ FIXED — BUG-006: Connector Label Edits Cannot Be Undone
- **File**: [`SelectTool.js:457`](file:///c:/Excelidraw/src/tools/SelectTool.js)
- **Severity**: 🔴 Critical (Data integrity)
- **Fix Applied**: `_openConnectorLabelEditor()` commit function now saves old text and calls `historyManager.registerChange({ undo, redo })` before applying new label. No-op if text unchanged.

---

### ✅ FIXED — BUG-007: Double-Tap to Edit Text Doesn't Work on Mobile
- **File**: [`SelectTool.js`](file:///c:/Excelidraw/src/tools/SelectTool.js)
- **Severity**: 🔴 Critical (Feature broken on mobile)
- **Fix Applied**: Added `this._lastTapTime` tracking in constructor. Double-click now detected via `event.evt.detail === 2` (mouse) OR timestamp delta `< 300ms` (touch). Works on all devices.

---

### ✅ FIXED — BUG-014: Desktop Properties Panel "Delete Selection" Button Silently Fails
- **File**: [`PropertiesPanel.js:111`](file:///c:/Excelidraw/src/ui/PropertiesPanel.js)
- **Severity**: 🔴 Critical (Feature broken)
- **Fix Applied**: `toolManager.deleteSelected?.()` → `toolManager.deleteSelectedShapes()`

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

