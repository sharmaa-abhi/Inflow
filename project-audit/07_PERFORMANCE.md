# 07 — Performance Audit

## Critical Performance Issues

### 1. Layout Thrashing in Canvas Grid Renderer
- **File**: `CanvasEngine.js:85`
- **Severity**: 🔴 High
- **Issue**: The grid `sceneFunc` checks `document.body.classList.contains('dark')` on every frame during pans and zooms. This forces the browser to recalculate styles inside the render loop.
- **Impact**: Jank during smooth pan/zoom operations, especially noticeable on lower-end devices.
- **Fix**: Cache the dark mode boolean in a variable and update it only when `theme-changed` fires.

```javascript
// BEFORE (inside sceneFunc — called every frame):
const isDark = document.body.classList.contains('dark');

// AFTER (cached, updated via event):
this.isDark = false;
eventBus.on('theme-changed', (theme) => { this.isDark = theme === 'dark'; });
```

### 2. O(N²) Snapping Algorithm
- **File**: `SnapManager.js:64`
- **Severity**: 🔴 High
- **Issue**: During drag operations, `getClientRect({ skipTransform: false })` is called for **every shape on the canvas** inside the `pointermove` handler. `getClientRect()` triggers Konva's internal matrix computation.
- **Impact**: With 100+ shapes, each drag frame computes 100+ bounding rects. At 60fps, this is 6000+ rect computations per second. Performance degrades quadratically.
- **Fix**: Cache bounding rects at drag start and invalidate only on shape changes. Use spatial indexing (quadtree) for large canvases.

### 3. History Stack Flooding from Continuous Inputs
- **File**: `PropertiesPanel.js:496, 608`
- **Severity**: 🟡 Medium
- **Issue**: Dragging color pickers and the line smoothing slider fire `input` events continuously, each registering a separate undo entry. A single color drag creates 30-50 history entries.
- **Impact**: Undo stack becomes unusable — user must click Undo 50 times to revert a single color change. Memory consumption grows linearly with drag distance.
- **Fix**: Debounce or batch continuous inputs — register a single undo entry on `change` (mouseup) instead of `input` (mousemove).

### 4. Unbounded Undo Stack
- **File**: `HistoryManager.js`
- **Severity**: 🟡 Medium
- **Issue**: The undo stack has no size limit. Each entry stores closured references to shape data and DOM callbacks.
- **Impact**: Over long sessions (hours of diagramming), memory consumption grows unbounded. Each undo entry holds references that prevent garbage collection of old shape data.
- **Fix**: Cap the undo stack at ~100-200 entries and drop the oldest entries.

### 5. Offscreen Canvas Allocation per Rough Render
- **File**: `BaseShape.js:194-251`
- **Severity**: 🟡 Medium
- **Issue**: Every call to `renderRoughWith()` creates a new `document.createElement('canvas')` and a new `rough.canvas()` instance. When toggling sketchy mode for many shapes, this allocates and discards many canvases.
- **Impact**: GC pressure spikes, potential frame drops during mode toggle.
- **Fix**: Pool and reuse a single offscreen canvas, clearing it between renders.

### 6. Full Layer Redraws on Property Changes
- **File**: Various tools and `PropertiesPanel.js`
- **Severity**: 🟢 Low-Medium
- **Issue**: Property changes call `shapeLayer.batchDraw()` which redraws the entire shape layer, including all shapes. Konva's dirty-rectangle optimization helps, but complex scenes with 100+ shapes still suffer.
- **Fix**: For single-shape property changes, use `shape.konvaNode.getLayer().batchDraw()` or Konva's targeted node caching.

## Performance Metrics Estimate

| Scenario | Expected Behavior | Current Behavior |
|---|---|---|
| 50 shapes, smooth pan | 60fps | ~45-55fps (layout thrashing) |
| 100 shapes, drag with snap | 60fps | ~20-30fps (O(N²) snapping) |
| Color slider drag | 1 undo entry | 30-50 undo entries |
| 2-hour session | Stable memory | Growing memory (unbounded stack) |
| Sketchy mode toggle (50 shapes) | Instant | 200-500ms (canvas allocation) |

## Recommendations Priority

1. **P0**: Fix layout thrashing in grid renderer (simple cache variable).
2. **P0**: Debounce continuous property inputs to single undo entries.
3. **P1**: Cache bounding rects in SnapManager at drag start.
4. **P1**: Cap undo stack size to 150 entries.
5. **P2**: Pool offscreen canvases for rough rendering.
