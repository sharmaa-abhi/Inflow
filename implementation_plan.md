# Implementation Plan - Line Smoothing with Standard and Enhanced RDP (ERDP)

This plan details how to add smooth freehand drawing in InkFlow using two approaches: Standard RDP + Tension, and Enhanced RDP (ERDP) which dynamically weights point significance based on local curvature (angle) to preserve sharp corners. The settings will be fully controllable in both desktop and mobile panels.

## User Review Required

> [!IMPORTANT]
> - Since this is a Vite-based Konva.js Web Application, we cannot use `@shopify/react-native-skia` or `react-native-free-canvas` directly. Instead, we use Konva's native Cardinal spline (`tension`) property along with a new custom-written Enhanced RDP (ERDP) algorithm.
> - The new "Line Smoothing" configuration (Standard vs ERDP, and a Smoothness slider) will be available in the desktop properties panel, in the mobile properties sheet, and as a quick "Pen Settings" button on mobile.
> - We will also fix an existing bug in `main.js` where calls to `setStrokeColor`, `setFillColor`, etc., on the `styleManager` were throwing errors because they were missing in `StyleManager.js`.

## Proposed Changes

---

### Coordinate / Math Library

#### [MODIFY] [math.js](file:///c:/Excelidraw/src/utils/math.js)
- Implement `simplifyPathERDP(points, epsilon, sensitivity)` to compute path simplification while weighting the distance threshold based on segment angles. Sharp turns will have higher weight (lower effective epsilon) to preserve details.
- Implement the helper `rdpSimplifyWeighted(points, weights, epsilon)` to perform the recursion.

---

### Shapes & Rendering

#### [MODIFY] [PenShape.js](file:///c:/Excelidraw/src/shapes/PenShape.js)
- Override `applyStyles()` to retrieve the `smoothingTension` style property (defaulting to `0.4` if unspecified) and apply it to the Konva Line node as `tension`.

---

### Drawing Tools

#### [MODIFY] [PenTool.js](file:///c:/Excelidraw/src/tools/PenTool.js)
- Modify `onPointerMove()` to implement real-time smoothing. It will preserve the raw coordinates in `this.points`, and update the shape's geometry using a simplified version computed on the fly using either standard `simplifyPath` or the new `simplifyPathERDP`.
- Epsilon for simplification will be computed dynamically from the `smoothingTension` style property (`epsilon = 0.5 + smoothness * 1.5`).
- Modify `onPointerUp()` to apply the same simplification on the final drawn line.

---

### Style Management

#### [MODIFY] [StyleManager.js](file:///c:/Excelidraw/src/managers/StyleManager.js)
- Add default active styles for `smoothingMode` (`'erdp'`) and `smoothingTension` (`0.4`).
- Add helper setters `setSmoothingMode(mode)` and `setSmoothingTension(tension)`.
- Implement missing setter methods: `setStrokeColor(color)`, `setFillColor(color)`, `setStrokeWidth(width)`, and `setStrokeStyle(style)` to resolve existing mobile menu runtime crashes.

---

### User Interface (HTML & CSS)

#### [MODIFY] [index.html](file:///c:/Excelidraw/index.html)
- Add a new "Line Smoothing" section in the desktop Properties Panel (`#properties-panel`).
- Add a new "Line Smoothing" section in the mobile Properties Sheet (`#props-sheet`).
- Add a quick "Pen Settings" button (`#mb-btn-pen-settings`) in the mobile `#top-bar` actions area.

#### [MODIFY] [mobile-components.css](file:///c:/Excelidraw/src/mobile-components.css)
- Add CSS rules for the new Pen Settings button, toggle switches, and sliders.

---

### UI Controllers & Event Handling

#### [MODIFY] [PropertiesPanel.js](file:///c:/Excelidraw/src/ui/PropertiesPanel.js)
- Wire up the new desktop properties panel controls (`#prop-toggle-erdp`, `#prop-slider-smoothing`, `#prop-val-smoothing`).
- Sync these controls with shape style selections and tool configurations.
- Ensure the Line Smoothing section is shown for Pen shapes and hidden for other shape types.

#### [MODIFY] [main.js](file:///c:/Excelidraw/src/main.js)
- Wire up the mobile properties sheet controls (`#mb-toggle-erdp`, `#mb-slider-smoothing`, `#mb-val-smoothing`).
- Subscribe to `tool-changed` (replacing the incorrect `tool:changed`) to monitor when the Pen tool is selected.
- Show/hide the `#mb-btn-pen-settings` button in the top-bar actions based on the active tool.
- Implement the click handler for `#mb-btn-pen-settings` to open the bottom sheet as a "Pen Settings" drawer before drawing (hiding shape-specific controls like the Delete button).

---

## Verification Plan

### Automated Tests
- Run `npm run build` to ensure the project compiles successfully without any TypeScript/Vite/Tailwind build errors.

### Manual Verification
1. Open the application.
2. Select the Pen tool and draw on the canvas.
3. Observe real-time drawing. Compare Standard RDP (with jagged points and curve tension) vs Enhanced RDP (keeps sharp corners like zig-zags and boxes clean while curving flat segments).
4. Verify on mobile layout (or Chrome inspector responsive mode) that:
   - When the Pen tool is selected, a "Pen Settings" slider icon appears in the top menu bar.
   - Clicking the slider icon opens the bottom sheet with stroke/smoothing configurations.
   - Adjusting the slider updates the active style and subsequent drawing smoothing.
   - Tapping an already drawn line and modifying its properties sheet updates the line's smoothness on the fly.
