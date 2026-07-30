# 10 — Responsive Design & Mobile Audit

## Viewport Configuration
```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
```
- ✅ `width=device-width` — correct
- ⚠️ `maximum-scale=1.0, user-scalable=no` — blocks accessibility zoom

## Mobile Layout Architecture

InkFlow uses a dual-layout approach:
1. **Desktop** (≥768px): Top floating toolbar, bottom-left footer, floating properties panel
2. **Mobile** (<768px): Bottom tab bar (`<nav id="mobile-bottom-bar">`), bottom sheet for properties, dedicated mobile UI wiring in `mobile-ui.js` and `main.js`

### Mobile Components
| Component | Implementation |
|---|---|
| Bottom Tab Bar | Fixed bottom nav with tool icons and labels |
| Properties Sheet | Draggable bottom sheet with backdrop overlay |
| Tool Selection | Mirrors desktop toolbar via separate mobile buttons |
| Color Palettes | Duplicated palettes in mobile sheet (separate DOM, separate JS wiring) |
| Delete Button | `#mb-btn-delete-shape` — **BROKEN** (see below) |

## Critical Mobile Issues

### 1. 🔴 Mobile Delete Button Clears Entire Canvas
- **File**: `main.js:284-286`
- **Code**: `deleteShapeBtn?.addEventListener('click', () => { document.getElementById('btn-clear')?.click(); });`
- **Problem**: The mobile "Delete Shape" button (`#mb-btn-delete-shape`) programmatically clicks the desktop "Clear Canvas" button (`#btn-clear`) instead of deleting only the selected shape.
- **User Impact**: On mobile, tapping "Delete" on a single shape prompts the user to clear ALL shapes from the entire canvas.
- **Fix**: Call `toolManager.deleteSelectedShapes()` instead of clicking `#btn-clear`.

### 2. 🔴 Double-Tap to Edit Text/Lines Doesn't Work on Mobile
- **File**: `SelectTool.js`
- **Code**: `if (event.evt.detail === 2)` (double-click detection)
- **Problem**: `event.evt.detail` returns `2` for mouse double-clicks, but touch events on mobile do not set `.detail = 2`. Double-tapping a text shape on mobile does nothing — users cannot edit text content on mobile.
- **Fix**: Implement a manual double-tap detector using timestamp comparison:
```javascript
const now = Date.now();
if (now - this._lastTapTime < 300) { /* double tap */ }
this._lastTapTime = now;
```

### 3. 🟡 Duplicated DOM and Event Wiring
- The mobile UI has completely separate DOM elements (`#mb-stroke-palette`, `#mb-fill-palette`, etc.) that duplicate the desktop elements (`#prop-stroke-palette`, `#prop-fill-palette`).
- The JavaScript wiring in `main.js` (lines 289-400) manually syncs mobile palettes with the style manager, duplicating logic already in `PropertiesPanel.js`.
- **Impact**: Changes to desktop properties logic must be manually mirrored in mobile wiring, creating a maintenance burden and sync bugs.

### 4. 🟡 Bottom Sheet Not Truly Responsive
- The bottom sheet has a fixed `max-height` and doesn't adapt to different phone screen sizes or orientations. On very small screens (e.g., iPhone SE), content may overflow.
- The sheet handle drag logic uses hardcoded pixel thresholds.

### 5. 🟢 No Landscape Mode Optimization
- On mobile landscape orientation, the bottom bar and bottom sheet consume significant vertical space, leaving very little canvas area.
- No landscape-specific layout adjustments exist.

## Breakpoint Analysis

| Breakpoint | Behavior |
|---|---|
| ≥ 768px | Desktop layout: floating toolbar, footer, properties panel |
| < 768px | Mobile layout: bottom bar, properties sheet, mobile menu |
| < 480px | Same as < 768px — no further adaptation |
| Landscape | Same as portrait — no optimization |

## Touch Interaction Audit

| Gesture | Desktop Equivalent | Mobile Status |
|---|---|---|
| Tap | Click | ✅ Works |
| Double-tap | Double-click | ❌ Broken (`.detail !== 2`) |
| Pan (2-finger) | Scroll/wheel pan | ✅ Works (Konva native) |
| Pinch zoom | Ctrl+Wheel zoom | ✅ Works (Konva native) |
| Long press | Right-click | ⚠️ No context menu on long-press |
| Drag shape | Mouse drag | ✅ Works |
| Drag to draw | Mouse drag | ✅ Works |

## Responsive Score: **45/100**
