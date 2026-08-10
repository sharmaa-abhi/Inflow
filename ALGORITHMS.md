# 🧮 InkFlow – Complete Algorithms & Mathematical Foundations Specification

This document provides a comprehensive technical index and architectural specification of all algorithms, mathematical formulations, geometric data structures, and state management techniques utilized throughout the **InkFlow** whiteboard & diagramming application.

---

## 📋 Table of Contents
1. [Geometry & Vector Math Algorithms](#1-geometry--vector-math-algorithms)
2. [Rendering, Texture & 3D Algorithms](#2-rendering-texture--3d-algorithms)
3. [Interactive Tools & Collision Algorithms](#3-interactive-tools--collision-algorithms)
4. [Persistence, Conversion & Color Algorithms](#4-persistence-conversion--color-algorithms)
5. [Summary Table of Implementation Files](#5-summary-table-of-implementation-files)

---

## 1. Geometry & Vector Math Algorithms

### 1.1 Ramer-Douglas-Peucker (RDP) Path Simplification
- **File**: [`src/utils/math.js`](file:///c:/Excelidraw/src/utils/math.js#L110-L172)
- **Functions**: `simplifyPath(points, epsilon)`, `rdpSimplify(points, epsilon)`
- **Description**: Standard curve simplification algorithm used to reduce the number of control points in freehand drawing paths while retaining original vector shape fidelity. It recursively subdivides point sequences and eliminates points lying within distance threshold `epsilon` from segment baselines.

### 1.2 Enhanced Ramer-Douglas-Peucker (ERDP) Curve Simplification
- **File**: [`src/utils/math.js`](file:///c:/Excelidraw/src/utils/math.js#L235-L346)
- **Functions**: `simplifyPathERDP(points, epsilon, cornerSens, timestamps)`, `simplifyPathAdaptive(points, opts)`
- **Description**: Custom adaptive curve simplification algorithm. It extends standard RDP by computing per-point significance weights based on:
  1. **Local Curvature**: Angle change between consecutive segments.
  2. **Drawing Velocity**: Slower strokes preserve fine detail, while fast strokes undergo aggressive simplification.
  3. **Point Density**: Dense point clusters are adaptively thinned to optimize rendering performance.

### 1.3 Orthogonal / Manhattan Connector Routing Algorithm
- **File**: [`src/utils/routing.js`](file:///c:/Excelidraw/src/utils/routing.js#L32-L77)
- **Functions**: `computeOrthogonalPath(startPos, endPos, startAnchorType, endAnchorType)`
- **Description**: Generates multi-segment 90-degree right-angled connector lines between bound shapes. It calculates initial stub offsets (`STUB=20px`), determines horizontal vs. vertical orientation exit vectors, and constructs L-bends or Z-bends based on anchor positions.

### 1.4 Rotated Bounding Box (AABB) Calculation
- **File**: [`src/utils/math.js`](file:///c:/Excelidraw/src/utils/math.js#L58-L85)
- **Functions**: `getRotatedBB(x, y, width, height, rotationDegrees)`
- **Description**: Applies 2D affine rotation transformation matrices ($x' = x \cos\theta - y \sin\theta$, $y' = x \sin\theta + y \cos\theta$) across 4 bounding rectangle vertices to calculate the Axis-Aligned Bounding Box (AABB) for rotated vector elements.

### 1.5 Euclidean Distance & Trigonometric Angle Snapping
- **File**: [`src/utils/math.js`](file:///c:/Excelidraw/src/utils/math.js#L13-L47)
- **Functions**: `getDistance(x1, y1, x2, y2)`, `snapAngle(radians, stepDegrees)`, `snapPointToAngle(x, y, ox, oy)`
- **Description**: Computes 2D Euclidean distance ($\sqrt{\Delta x^2 + \Delta y^2}$) using `Math.hypot`, and snaps line/arrow angles to 45-degree steps when holding the `Shift` modifier key during creation or dragging.

---

## 2. Rendering, Texture & 3D Algorithms

### 2.1 Rough.js Hand-Drawn Vector Sketch Renderer
- **File**: [`src/utils/roughRenderer.js`](file:///c:/Excelidraw/src/utils/roughRenderer.js#L48-L200)
- **Functions**: `renderRoughShape(shapeData)`
- **Description**: Offscreen Canvas rendering engine converting geometric shapes (`rectangle`, `ellipse`, `diamond`, `line`, `arrow`, `polygon`) into sketchy illustrations using rough.js. It generates randomized stroke bowing, roughness variances, and pattern fills (`hachure`, `cross-hatch`, `dots`, `solid`).

### 2.2 Procedural Noise Watercolor Paper Generator
- **File**: [`src/utils/watercolorPaper.js`](file:///c:/Excelidraw/src/utils/watercolorPaper.js#L1-L80)
- **Functions**: `createWatercolorPaperCanvas()`, `getWatercolorPaperPattern()`
- **Description**: Generates an organic canvas surface texture on an OffscreenCanvas using multi-octave procedural noise algorithms to create realistic grain and fiber variations.

### 2.3 3D Perspective Matrix Stack Transformation
- **File**: [`src/managers/ThreeDPreviewManager.js`](file:///c:/Excelidraw/src/managers/ThreeDPreviewManager.js#L50-L160)
- **Functions**: `activate()`, `render3DScene()`, `_bindDragRotation()`
- **Description**: Projects 2D canvas shape layers into an interactive 3D stacked view. It maps shape $Z$-index properties into CSS 3D matrix space (`rotateX`, `rotateY`, `rotateZ`, `translateZ`) with mouse rotation interaction.

---

## 3. Interactive Tools & Collision Algorithms

### 3.1 Smart Anchor Proximity & Snapping Engine
- **File**: [`src/managers/AnchorManager.js`](file:///c:/Excelidraw/src/managers/AnchorManager.js#L1-L150)
- **Functions**: `_updateAnchors(canvasPos)`, `getNearestAnchor(canvasPos)`
- **Description**: Performs spatial proximity checks (`ANCHOR_VISIBLE_RADIUS=80px`, `ANCHOR_SNAP_RADIUS=20px`) against 5 connection points per shape (Top, Right, Bottom, Left, Center). It dynamically updates connector routes when bound shapes are moved.

### 3.2 AABB Selection Marquee & Rectangle Intersection
- **File**: [`src/utils/math.js`](file:///c:/Excelidraw/src/utils/math.js#L94-L100), [`src/tools/SelectTool.js`](file:///c:/Excelidraw/src/tools/SelectTool.js#L100-L200)
- **Functions**: `rectIntersect(rectA, rectB)`
- **Description**: Axis-Aligned Bounding Box (AABB) intersection testing to identify shapes contained within or intersecting the mouse selection marquee rectangle.

### 3.3 Dynamic Object Alignment & Guide Line Snapping
- **File**: [`src/managers/SnapManager.js`](file:///c:/Excelidraw/src/managers/SnapManager.js#L32-L180)
- **Functions**: `handleSnapping(movingShape)`
- **Description**: Compares left, center, right, top, middle, and bottom edge bounds between the dragged shape and all static canvas objects. When edges align within threshold `snapThreshold=8px`, it snaps the shape and draws visual guide lines.

### 3.4 Point-to-Line Orthogonal Segment Collision (Eraser Engine)
- **File**: [`src/utils/math.js`](file:///c:/Excelidraw/src/utils/math.js#L152-L172), [`src/tools/EraserTool.js`](file:///c:/Excelidraw/src/tools/EraserTool.js#L30-L90)
- **Functions**: `getOrthoDistance(p, lineStart, lineEnd)`
- **Description**: Calculates the minimum distance from the eraser cursor to multi-segment freehand pen paths, removing stroke points or deleting path segments when within cursor radius.

### 3.5 Temporal Particle Decay & Fading Laser Trail
- **File**: [`src/tools/LaserTool.js`](file:///c:/Excelidraw/src/tools/LaserTool.js#L1-L120)
- **Functions**: `_renderLaserTrail()`, `_addPoint(pos)`
- **Description**: Tracks laser pointer points with timestamps (`Date.now()`). It applies alpha opacity attenuation over time (`LIFETIME=1000ms`), creating a fading laser trail on the overlay canvas layer.

---

## 4. Persistence, Conversion & Color Algorithms

### 4.1 Excalidraw ↔ InkFlow JSON Schema Converter
- **File**: [`src/managers/PersistenceManager.js`](file:///c:/Excelidraw/src/managers/PersistenceManager.js#L167-L350)
- **Functions**: `convertExcalidrawToInkFlow(excalidrawObj)`
- **Description**: Schema translation engine that converts Excalidraw `.excalidraw` JSON structures (`rectangle`, `ellipse`, `diamond`, `arrow`, `line`, `draw`, `text`) into native InkFlow shape instances, handling binding links, font families, and stroke properties.

### 4.2 DOM SVG XML Parser & Path Normalization
- **File**: [`src/utils/svgParser.js`](file:///c:/Excelidraw/src/utils/svgParser.js#L11-L95)
- **Functions**: `parseSvgPaths(svgText)`, `createKonvaNodesFromSvg(svgText, pos)`
- **Description**: Parses raw SVG XML text into DOM tree objects, converting `<path>`, `<rect>`, `<circle>`, `<polygon>`, and `<polyline>` elements into normalized SVG path data string sequences.

### 4.3 Command Pattern Stack-Based Undo/Redo State Management
- **File**: [`src/managers/HistoryManager.js`](file:///c:/Excelidraw/src/managers/HistoryManager.js#L1-L85)
- **Functions**: `pushState(stateData)`, `undo()`, `redo()`
- **Description**: Maintains a dual-stack (`undoStack`, `redoStack`) snapshot history algorithm with configurable capacity limits (`maxHistory=50`), enabling lossless scene restoration.

### 4.4 Multi-Format Color Conversion & Parsing Engine
- **File**: [`src/utils/colors.js`](file:///c:/Excelidraw/src/utils/colors.js#L257-L380)
- **Functions**: `parseAnyColor(str)`, `toHex(rgb)`, `toRgb(rgb)`, `toHsl(rgb)`, `convertColor(colorStr, format)`
- **Description**: Color conversion suite that parses arbitrary CSS color strings (3/6/8-digit HEX, RGB, RGBA, HSL, HSLA, named colors) into RGB color space objects, and serializes them into any requested CSS format.

---

## 5. Summary Table of Implementation Files

| Category | Algorithm Name | Source File | Key Exports / Methods |
| :--- | :--- | :--- | :--- |
| **Geometry** | RDP Path Simplification | [`src/utils/math.js`](file:///c:/Excelidraw/src/utils/math.js) | `simplifyPath` |
| **Geometry** | Enhanced RDP (ERDP) | [`src/utils/math.js`](file:///c:/Excelidraw/src/utils/math.js) | `simplifyPathERDP`, `simplifyPathAdaptive` |
| **Routing** | Orthogonal / Manhattan Routing | [`src/utils/routing.js`](file:///c:/Excelidraw/src/utils/routing.js) | `computeOrthogonalPath` |
| **Geometry** | Rotated Bounding Box (AABB) | [`src/utils/math.js`](file:///c:/Excelidraw/src/utils/math.js) | `getRotatedBB` |
| **Geometry** | Distance & Angle Snapping | [`src/utils/math.js`](file:///c:/Excelidraw/src/utils/math.js) | `getDistance`, `snapAngle`, `snapPointToAngle` |
| **Rendering** | Rough.js Sketchy Vector Renderer | [`src/utils/roughRenderer.js`](file:///c:/Excelidraw/src/utils/roughRenderer.js) | `renderRoughShape` |
| **Texture** | Procedural Watercolor Noise | [`src/utils/watercolorPaper.js`](file:///c:/Excelidraw/src/utils/watercolorPaper.js) | `getWatercolorPaperPattern` |
| **3D** | Perspective Matrix Stack | [`src/managers/ThreeDPreviewManager.js`](file:///c:/Excelidraw/src/managers/ThreeDPreviewManager.js) | `render3DScene` |
| **Snapping** | Anchor Proximity Snapping | [`src/managers/AnchorManager.js`](file:///c:/Excelidraw/src/managers/AnchorManager.js) | `getNearestAnchor` |
| **Collision** | AABB Marquee Selection | [`src/utils/math.js`](file:///c:/Excelidraw/src/utils/math.js) | `rectIntersect` |
| **Snapping** | Dynamic Alignment Guides | [`src/managers/SnapManager.js`](file:///c:/Excelidraw/src/managers/SnapManager.js) | `handleSnapping` |
| **Collision** | Point-to-Line Eraser | [`src/utils/math.js`](file:///c:/Excelidraw/src/utils/math.js) | `getOrthoDistance` |
| **Laser** | Particle Alpha Decay Trail | [`src/tools/LaserTool.js`](file:///c:/Excelidraw/src/tools/LaserTool.js) | `_renderLaserTrail` |
| **Converter** | Excalidraw JSON Converter | [`src/managers/PersistenceManager.js`](file:///c:/Excelidraw/src/managers/PersistenceManager.js) | `convertExcalidrawToInkFlow` |
| **Parser** | DOM SVG XML Parser | [`src/utils/svgParser.js`](file:///c:/Excelidraw/src/utils/svgParser.js) | `parseSvgPaths` |
| **History** | Command Stack Undo/Redo | [`src/managers/HistoryManager.js`](file:///c:/Excelidraw/src/managers/HistoryManager.js) | `pushState`, `undo`, `redo` |
| **Color** | Multi-Format Color Engine | [`src/utils/colors.js`](file:///c:/Excelidraw/src/utils/colors.js) | `parseAnyColor`, `convertColor` |

---
*Generated for InkFlow Application Architecture.*
