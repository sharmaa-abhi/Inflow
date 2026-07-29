# 06 — Code Quality

## Overall Assessment: **D+ (40/100)**

The codebase demonstrates functional competence — the application works — but falls far short of production-grade engineering standards. It lacks type safety, static analysis, automated testing, and consistent coding patterns.

---

## Code Smells & Anti-Patterns

### 1. Debug Statements in Production Code
| File | Line | Statement |
|---|---|---|
| `Tooltip.js` | 7 | `console.log('Tooltip system constructor called');` |
| `Tooltip.js` | 16 | `console.log('Tooltip container appended to body');` |

**Severity**: Medium — Pollutes browser console in production.

### 2. Hardcoded Magic Numbers
| File | Line | Value | Context |
|---|---|---|---|
| `CanvasEngine.js` | 33 | `20` | Grid spacing |
| `ShapeTool.js` | 248 | `80` | Default shape size |
| `ShapeTool.js` | 243 | `4` | Size threshold |
| `LaserTool.js` | 16 | `1000` | Trail lifespan ms |
| `routing.js` | 33 | `20` | Stub segment length |
| `StickyTool.js` | 79 | `30` | Neighbor button gap |

**Severity**: Low-Medium — Should be named constants for maintainability.

### 3. God Function: `main.js`
The `main.js` file is 449 lines of procedural bootstrap code with:
- Manager initialization
- DOM event wiring for 30+ buttons
- Mobile UI wiring
- Keyboard shortcut registration
- Theme synchronization
- Color palette generation

This should be decomposed into focused initialization modules.

### 4. Inconsistent Dependency Patterns
Some tools receive dependencies via constructor injection:
```javascript
// PenTool — receives shapeManager and styleManager via constructor
constructor(canvasEngine, shapeManager, styleManager)
```
Others import singletons directly:
```javascript
// ShapeTool — imports singletons at module level
import { shapeManager } from '../managers/ShapeManager';
import { styleManager } from '../managers/StyleManager';
```

### 5. Repeated Undo/Redo Boilerplate
Every tool (`ShapeTool`, `PenTool`, `TextTool`, `StickyTool`, `ImageTool`) contains nearly identical undo/redo registration code:
```javascript
historyManager.registerChange({
  type: 'add',
  shapeId: shape.id,
  undo: () => { shapeManager.removeShape(shape.id); shape.destroy(); ... },
  redo: () => { const re = shapeManager.recreateShape(shape.serialize()); ... }
});
```
This should be extracted into a shared helper like `historyManager.registerShapeAdd(shape)`.

### 6. No Input Validation
- `PersistenceManager.importSceneData()` does not validate the JSON schema before processing.
- `svgParser.js` does not sanitize SVG input — potential XSS vector.
- Color inputs accept arbitrary strings without validation.
- Number inputs have no bounds checking in many handlers.

### 7. Commented-Out Code
Search for commented-out code blocks reveals dead logic scattered across files, particularly in `PropertiesPanel.js` and `main.js`.

---

## Naming Conventions

| Category | Convention Used | Consistent? |
|---|---|---|
| Classes | PascalCase | ✅ Yes |
| Functions | camelCase | ✅ Yes |
| Constants | UPPER_SNAKE_CASE (partial) | ⚠️ Inconsistent — some arrays like `STROKE_COLORS` use it, others don't |
| Files | PascalCase for classes | ✅ Yes |
| CSS classes | kebab-case + Tailwind | ✅ Yes |
| DOM IDs | kebab-case | ✅ Yes |
| Private methods | `_prefix` convention | ⚠️ Inconsistent — some use it, many don't |

---

## Complexity Hotspots

| File | Lines | Cyclomatic Complexity | Risk |
|---|---|---|---|
| `SelectTool.js` | 500+ | Very High | Multi-concern god class (selection, drag, resize, rotate, labels, multi-select) |
| `PropertiesPanel.js` | 650+ | Very High | Handles every property type with complex event wiring |
| `main.js` | 449 | High | Monolithic bootstrap with embedded business logic |
| `PersistenceManager.js` | 420+ | High | Handles 5 different file formats in one module |
| `ShapeTool.js` | 312 | Medium-High | Giant switch statement for 12 shape types |
