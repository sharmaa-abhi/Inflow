# 16 — Dead Code & Unused Exports

## Debug Statements (Ship to Production)

| File | Line | Code | Action |
|---|---|---|---|
| `Tooltip.js` | 7 | `console.log('Tooltip system constructor called');` | Remove |
| `Tooltip.js` | 16 | `console.log('Tooltip container appended to body');` | Remove |

## Incorrect Asset References

| File | Line | Current Value | Correct Value | Issue |
|---|---|---|---|---|
| `index.html` | 6 | `href="/public/favicon.svg"` | `href="/favicon.svg"` | Vite serves `public/` at root. Current path causes 404 and Vite warning. |

## Dead Code Patterns

### Unreachable Wrapper in `main.js`
- **Lines 198-206**: The code attempts to wrap `themeManager.toggle` with a mobile-sync decorator:
```javascript
const origToggle = themeManager.toggle?.bind(themeManager);
if (origToggle) {
  themeManager.toggle = (...args) => { ... };
}
```
- Since `themeManager` has no `toggle()` method, `origToggle` is always `undefined`, and the `if (origToggle)` block never executes. This is dead code.

### Unused `getSelfRect` Override in LaserTool
- **File**: `LaserTool.js:86-93`
- The `getSelfRect()` override returns a 200,000×200,000 bounding box. While not strictly "dead", it's a brute-force workaround for Konva's culling that could be replaced with `shape.perfectDrawEnabled(false)`.

### Potentially Unused CSS Classes
Without a CSS purge tool, it's difficult to confirm, but the following patterns in `style.css` appear to have no matching HTML:
- Several animation keyframe names that may have been deprecated during UI redesign
- Hover states for elements that no longer exist in the current HTML

## Stale Comments

| File | Line | Comment | Issue |
|---|---|---|---|
| `TextTool.js` | 177 | `// Wait, Konva Text computes its own height...` | Developer thinking-out-loud left in code |
| `Statusbar.js` | 16 | `// Note: grid select is now in the hamburger menu...` | Migration note that should be removed after stabilization |

## Recommendations

1. Remove the 2 `console.log` statements in `Tooltip.js`.
2. Fix favicon path from `/public/favicon.svg` to `/favicon.svg`.
3. Remove the dead `themeManager.toggle` wrapper in `main.js:198-206`.
4. Remove thinking-out-loud comments.
5. Add ESLint rules: `no-console`, `no-unreachable`, `no-unused-vars`.
