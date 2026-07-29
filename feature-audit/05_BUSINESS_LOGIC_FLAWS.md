# 05 — Comprehensive Bug & Flaw Reports

## Feature Flaw Reports (Phase 7 Format)

---

### FLAW-001: Main Menu Dark Mode Toggle Throws Uncaught TypeError
- **Feature Name**: Dark Mode / Theme Toggle
- **Flow Step**: User opens Main Menu (hamburger icon) -> Clicks "Toggle Theme"
- **Expected Behavior**: Application toggles between Dark and Light mode smoothly, updating canvas grid, background, text swatches, and menu label.
- **Actual Behavior (Found in Code)**: `MainMenu.js:137` calls `themeManager.toggle()`. `ThemeManager.js` has no `toggle()` method. Console throws `TypeError: themeManager.toggle is not a function`, and theme does NOT change.
- **Trigger Condition**: Click "Toggle Theme" in the Main Menu flyout.
- **Severity**: 🔴 **Critical**
- **Recommended Code Fix**:
```javascript
// c:\Excelidraw\src\ui\MainMenu.js:136-139
if (this.btnThemeToggle) {
  this.btnThemeToggle.addEventListener('click', () => {
    themeManager.setDarkTheme(!themeManager.isDark);
    this.syncThemeLabel();
  });
  this.syncThemeLabel();
}
```

---

### FLAW-002: Desktop Properties Panel "Delete Selection" Button Silently Fails
- **Feature Name**: Floating Properties Panel — Shape Deletion
- **Flow Step**: User selects shape -> Opens Properties Panel -> Clicks "Delete Selection" button
- **Expected Behavior**: Selected shape is deleted from canvas, removed from `shapeManager`, destroyed, registered in `historyManager`, and panel closes.
- **Actual Behavior (Found in Code)**: `PropertiesPanel.js:111` calls `toolManager.deleteSelected?.()`. But `ToolManager.js` names the method `deleteSelectedShapes()`. The call silently evaluates to `undefined`. The panel closes via `shapeManager.deselectAll()`, but the shape remains on canvas.
- **Trigger Condition**: Click "Delete Selection" at the bottom of the floating Properties Panel.
- **Severity**: 🔴 **Critical**
- **Recommended Code Fix**:
```javascript
// c:\Excelidraw\src\ui\PropertiesPanel.js:111
if (this.btnDeleteSelected) {
  this.btnDeleteSelected.addEventListener('click', () => {
    toolManager.deleteSelectedShapes();
    shapeManager.deselectAll();
  });
}
```

---

### FLAW-003: Mobile Sheet Delete Button Clears Entire Canvas
- **Feature Name**: Mobile Layout — Shape Deletion
- **Flow Step**: Mobile view -> Select shape -> Open properties bottom sheet -> Tap "Delete Shape"
- **Expected Behavior**: Deletes only the selected shape.
- **Actual Behavior (Found in Code)**: `main.js:284-287` executes `document.getElementById('btn-clear')?.click()`. This triggers the "Clear Canvas" workflow, clearing all shapes on the canvas!
- **Trigger Condition**: Tap "Delete Shape" on mobile properties bottom sheet.
- **Severity**: 🔴 **Critical**
- **Recommended Code Fix**:
```javascript
// c:\Excelidraw\src\main.js:284-287
deleteShapeBtn?.addEventListener('click', () => {
  toolManager.deleteSelectedShapes();
  closePropsSheet();
});
```

---

### FLAW-004: File Import Leaves Ghost Shape Nodes (Memory & State Leak)
- **Feature Name**: JSON / Excalidraw File Import
- **Flow Step**: Draw shapes on canvas -> Import new JSON / Excalidraw file
- **Expected Behavior**: Canvas is cleared completely, existing Konva shape nodes destroyed, and new file shapes loaded.
- **Actual Behavior (Found in Code)**: `PersistenceManager.js:323` calls `shapeManager.clear()`. This empties the JavaScript Map `shapeManager.shapes`, but fails to destroy existing Konva nodes on `canvasEngine.shapeLayer`. Old shapes remain visible on canvas as non-selectable, un-deletable "ghost" shapes overlaid beneath new file shapes.
- **Trigger Condition**: Import any scene JSON file when shapes already exist on canvas.
- **Severity**: 🔴 **Critical**
- **Recommended Code Fix**:
```javascript
// c:\Excelidraw\src\managers\PersistenceManager.js:322
importSceneData(data) {
  if (!data) return;
  ...
  // 1. Clear current canvas and destroy Konva nodes
  const existingShapes = shapeManager.getAllShapes();
  existingShapes.forEach(shape => shape.destroy());
  this.canvasEngine.shapeLayer.destroyChildren();
  shapeManager.clear();
```

---

### FLAW-005: Hand-Drawn / Sketchy Mode Causes 11 Shape Types to Disappear or Morph
- **Feature Name**: Sketchy Mode (rough.js)
- **Flow Step**: Create extended shapes (Cloud, Star, Cylinder, Sticky Note, Text, Pen, etc.) -> Press 'H' or click Sketchy Mode toggle.
- **Expected Behavior**: Shapes render with hand-drawn sketchy aesthetics matching rough.js stroke styles.
- **Actual Behavior (Found in Code)**: `roughRenderer.js:60` switch statement only implements rough paths for 5 primitives: `rectangle`, `circle`, `diamond`, `line`, `arrow`. All other 11 shape types fall through to default transparent rendering (they turn invisible) or morph into plain rectangles/circles. Text, Pen drawings, and Images vanish completely.
- **Trigger Condition**: Enable Sketchy Mode when canvas contains shapes other than rect, circle, diamond, line, or arrow.
- **Severity**: 🔴 **Critical**
- **Recommended Code Fix**: Extend `roughRenderer.js` with path generators for all shape types, or gracefully fallback to rendering crisp Konva nodes for non-roughable shape types.

---

### FLAW-006: SVG Vector XML Import Produces Untracked Canvas Ghosts
- **Feature Name**: SVG File Import
- **Flow Step**: Main Menu -> "Import RAW SVG Vector XML" -> Choose SVG file
- **Expected Behavior**: SVG vector paths are imported, converted to controllable InkFlow shape objects, selectable, draggable, editable, and saved.
- **Actual Behavior (Found in Code)**: `MainMenu.js:105` calls `createKonvaNodesFromSvg(svgText)` and adds the returned `Konva.Group` directly to `shapeLayer`. It is NEVER registered with `shapeManager`. It has no shape ID, no state serialization, no undo history, no selectability, and is lost on file export or autosave.
- **Trigger Condition**: Import any SVG file via Main Menu.
- **Severity**: 🔴 **Critical**
- **Recommended Code Fix**: Create a dedicated `SvgShape` class extending `BaseShape` that serializes vector paths and registers with `shapeManager`.

---

### FLAW-007: Connector Line Label Editing Bypasses History Stack
- **Feature Name**: Connector Arrows — Inline Text Labeling
- **Flow Step**: Double-click line/arrow -> Type text label -> Click away -> Press Ctrl+Z
- **Expected Behavior**: Undo reverts the text label addition or change.
- **Actual Behavior (Found in Code)**: `SelectTool.js:457` (`_openConnectorLabelEditor`) updates `shape.labelText` directly on textarea blur without registering a change with `historyManager`. Ctrl+Z does nothing.
- **Trigger Condition**: Edit a connector label and try to undo.
- **Severity**: 🔴 **Critical**
- **Recommended Code Fix**: Register label modifications in `historyManager` with old and new text callbacks.

---

### FLAW-008: Touch Screen Double-Tap Ignored on Mobile Devices
- **Feature Name**: Text / Line Inline Editing on Mobile
- **Flow Step**: Touch device -> Double-tap text shape or line connector
- **Expected Behavior**: Text editor opens overlay textarea for typing.
- **Actual Behavior (Found in Code)**: `SelectTool.js` checks `event.evt.detail === 2`. Mouse double-clicks set `detail = 2`, but touch events on mobile web browsers do not set `detail` to 2. Double-tap gesture is completely ignored.
- **Trigger Condition**: Double-tap any editable shape on a touch device.
- **Severity**: 🔴 **Critical**
- **Recommended Code Fix**: Implement manual timestamp double-tap detection for touch events (`now - lastTap < 300ms`).

---

### FLAW-009: Layout Thrashing in Frame Render Loop
- **Feature Name**: Canvas Grid Engine Performance
- **Flow Step**: Pan or zoom infinite canvas
- **Expected Behavior**: Smooth 60fps pan/zoom.
- **Actual Behavior (Found in Code)**: `CanvasEngine.js:85` queries `document.body.classList.contains('dark')` inside the `sceneFunc` grid renderer on every single animation frame. This forces synchronous DOM style recalculation during active pans/zooms.
- **Trigger Condition**: Pan or zoom the canvas.
- **Severity**: 🟡 **Medium**
- **Recommended Code Fix**: Cache `this.isDark` in `CanvasEngine` and update it only when `theme-changed` fires.

---

### FLAW-010: O(N²) Bounding Box Computation During Shape Drag
- **Feature Name**: Object Snapping Engine
- **Flow Step**: Drag any shape on a canvas containing 100+ shapes
- **Expected Behavior**: Smooth drag performance with smart guide snapping.
- **Actual Behavior (Found in Code)**: `SnapManager.js:64` invokes `node.getClientRect({ skipTransform: false })` on every single shape on the canvas inside the `pointermove` drag frame. 100 shapes at 60fps = 6,000 matrix transform calculations/sec.
- **Trigger Condition**: Drag a shape when canvas has many shapes.
- **Severity**: 🟡 **Medium**
- **Recommended Code Fix**: Cache shapes' bounding rects on `dragstart` and update only the dragged shape's rect during move.
