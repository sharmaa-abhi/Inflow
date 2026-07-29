# 09 — Accessibility Audit

## Overall WCAG 2.1 Compliance: **Partial (Level A — Failing)**

---

## Critical Failures

### 1. Canvas Content is Completely Inaccessible to Screen Readers
- **Issue**: The entire drawing surface is a `<canvas>` element rendered by Konva. Canvas content is opaque to assistive technologies — screen readers cannot detect, describe, or navigate shapes.
- **Impact**: Blind and low-vision users cannot use the application at all.
- **WCAG**: 1.1.1 Non-text Content (Level A — Fail)
- **Fix**: This is an inherent limitation of canvas-based apps. Mitigation options:
  - Add an ARIA live region that announces shape selections and operations.
  - Provide a text-based "shape tree" in the sidebar with keyboard navigation.
  - Use `aria-label` on the canvas container describing current state.

### 2. No Keyboard Navigation for Canvas Operations
- **Issue**: Shape selection, drag, resize, and rotation can only be performed via mouse/touch. There are no keyboard equivalents for:
  - Selecting shapes (Tab/Shift+Tab through shapes)
  - Nudging shapes (Arrow keys)
  - Resizing shapes (Shift+Arrow)
  - Rotating shapes
- **WCAG**: 2.1.1 Keyboard (Level A — Fail)
- **Fix**: Implement keyboard handlers in `SelectTool` for arrow-key nudge, Tab cycling through shapes, and Enter for editing.

### 3. No Focus Management in Modal Dialogs
- **Issue**: The `ContextMenu`, `MainMenu`, and `PropertiesPanel` do not trap focus. When a menu opens, users can Tab behind it into invisible elements.
- **WCAG**: 2.4.3 Focus Order (Level A — Fail)
- **Fix**: Implement focus trapping using `inert` attribute on background content or a focus-trap library.

### 4. Color-Only Information Conveyance
- **Issue**: Color picker palettes and the selected color state use color alone to indicate the active selection (a ring/border highlight on a color swatch). Users with color blindness may not distinguish which color is selected.
- **WCAG**: 1.4.1 Use of Color (Level A — Fail)
- **Fix**: Add a checkmark icon or text label on the selected color swatch.

---

## Moderate Issues

### 5. Missing ARIA Roles on Interactive Elements
| Element | Issue |
|---|---|
| `#extended-shapes-menu` | No `role="menu"` or `role="listbox"` |
| `.context-menu` | Created dynamically with no `role="menu"` |
| `.context-menu-item` | No `role="menuitem"` |
| Tool buttons | No `role="radio"` or `aria-pressed` for toggle state |
| Color swatches | No `role="radio"` or `aria-label` describing the color |

### 6. Interactive Elements Without Visible Focus Styles
- Some buttons (tool buttons, zoom controls) lack a visible `:focus-visible` outline, making keyboard navigation impossible to track visually.
- **WCAG**: 2.4.7 Focus Visible (Level AA — Fail)

### 7. Tooltip System Removes `title` Attribute
- `Tooltip.js:67` removes the native `title` attribute while showing the custom tooltip. If the custom tooltip fails to render (e.g., during rapid hover), the element has no accessible name.
- **WCAG**: 4.1.2 Name, Role, Value (Level A — Risk)

### 8. `user-scalable=no` in Viewport Meta
- **File**: `index.html:7` — `maximum-scale=1.0, user-scalable=no`
- This prevents users with low vision from pinch-zooming the interface.
- **WCAG**: 1.4.4 Resize Text (Level AA — Fail)
- **Note**: This is intentional for canvas apps to prevent interference with canvas zoom, but it blocks accessibility.

---

## Positive Findings

| Feature | Status |
|---|---|
| `lang="en"` on `<html>` | ✅ Present |
| Semantic `<header>`, `<footer>`, `<nav>` elements | ✅ Used |
| `aria-label` on mobile bottom sheet | ✅ Present |
| `role="status"` on toast notification | ✅ Present |
| `aria-live="polite"` on toast | ✅ Present |
| `title` attributes on toolbar buttons | ✅ Present |
| High contrast color ratios in dark mode | ⚠️ Mostly passing |

---

## Accessibility Score: **25/100**

The application fails multiple WCAG Level A criteria, making it inaccessible to users with disabilities. Canvas-based applications have inherent accessibility challenges, but basic improvements (keyboard navigation, ARIA roles, focus management) would significantly improve the score.
