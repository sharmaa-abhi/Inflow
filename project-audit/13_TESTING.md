# 13 — Testing Audit

## Test Coverage: **0%**

### Current State
- **Unit tests**: None
- **Integration tests**: None
- **End-to-end tests**: None
- **Visual regression tests**: None
- **Test framework**: None configured
- **Test scripts in package.json**: None
- **CI/CD test pipeline**: None
- **`tests/` or `__tests__/` directory**: Does not exist

---

## Risk Assessment

With zero test coverage on a 10,000+ line codebase containing:
- 16 shape types with serialization/deserialization
- 8 tool implementations with complex pointer event handling
- 9 manager singletons with cross-cutting interactions
- History (undo/redo) with closured callbacks
- File import/export in 4 formats (JSON, Excalidraw, PNG, SVG)
- Real-time rendering with Konva and rough.js
- Mobile-specific UI with duplicated logic

...the probability of regressions during any future change is **extremely high**.

---

## Recommended Test Strategy

### Phase 1: Unit Tests (Vitest)
Priority targets for maximum risk reduction:

| Module | Test Cases | Priority |
|---|---|---|
| `helpers.js` | `generateId()` uniqueness, `debounce()` timing | P0 |
| `colors.js` | HEX↔RGB↔HSL conversion accuracy | P0 |
| `math.js` | `snapPointToAngle()`, `simplifyPath()`, `simplifyPathERDP()` | P0 |
| `routing.js` | `computeOrthogonalPath()` for all anchor combinations | P0 |
| `EventBus.js` | `on()`, `emit()`, `off()`, multi-listener, event isolation | P0 |
| `HistoryManager.js` | Push, undo, redo, stack overflow, stack underflow | P1 |
| `ShapeManager.js` | `addShape`, `removeShape`, `select`, `recreateShape` | P1 |
| `StyleManager.js` | `getActiveStyles`, `applyStylesToShape` | P1 |
| Shape serialization | `serialize()` → `recreateShape()` roundtrip for all 16 types | P1 |

### Phase 2: Integration Tests
| Scenario | Description |
|---|---|
| Shape lifecycle | Create → select → modify → undo → redo → delete |
| File roundtrip | Export JSON → clear → import JSON → verify shapes match |
| Connector binding | Draw arrow from shape A to shape B → move shape A → verify arrow follows |
| Sketchy mode toggle | Enable sketchy → verify all shapes render → disable → verify shapes restore |

### Phase 3: E2E Tests (Playwright)
| Scenario | Description |
|---|---|
| Draw and export | Draw 3 shapes → export PNG → verify file downloads |
| Mobile workflow | (Mobile viewport) Select tool → draw rectangle → open properties → change color |
| Keyboard shortcuts | Press R → draw → press V → select → press Delete → verify deleted |
| Undo/redo chain | Draw 5 shapes → undo 3 → redo 1 → verify canvas state |

### Setup Recommendation
```bash
npm install -D vitest @vitest/coverage-v8 playwright @playwright/test
```

```json
// package.json scripts
{
  "test": "vitest",
  "test:coverage": "vitest --coverage",
  "test:e2e": "playwright test"
}
```

---

## Testing Score: **0/100**
