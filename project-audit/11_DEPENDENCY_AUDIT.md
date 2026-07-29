# 11 — Dependency Audit

## npm Audit Results

```
# npm audit report

postcss  <=8.5.17
Severity: high
PostCSS: Path Traversal in Previous Source Map Auto-Loading
Advisory: GHSA-r28c-9q8g-f849
Fix: npm audit fix

1 high severity vulnerability
```

## Dependency Tree Analysis

### Direct Dependencies (4)
| Package | Version | Size Impact | Necessity |
|---|---|---|---|
| `konva` | ^10.3.0 | ~300KB min | ✅ Core rendering engine — essential |
| `roughjs` | ^4.6.6 | ~80KB min | ✅ Sketchy rendering — core feature |
| `tailwindcss` | ^4.3.2 | Build-time only | ⚠️ Mixed use — Tailwind utilities mixed with custom CSS |
| `@tailwindcss/vite` | ^4.3.2 | Build-time only | ⚠️ Required by tailwindcss |

### Dev Dependencies (1)
| Package | Version | Purpose |
|---|---|---|
| `vite` | ^8.1.1 | Build tool + dev server |

## Dependency Health

| Metric | Status |
|---|---|
| Total direct deps | 4 (very lean) |
| Total dev deps | 1 (very lean) |
| Known vulnerabilities | 1 high (postcss transitive) |
| Outdated packages | None detected |
| Unused dependencies | None detected |
| Missing lockfile | ✅ `package-lock.json` present |
| Lock file integrity | ✅ Consistent with package.json |

## Assessment

The dependency footprint is remarkably small and well-chosen:
- **Konva** is the right choice for a canvas-based diagramming tool.
- **rough.js** is the de facto library for hand-drawn rendering.
- **Vite** is an excellent modern build tool.
- **Tailwind CSS** usage is debatable — it's mixed with 3000+ lines of custom CSS in `style.css`. The project would benefit from choosing one approach (Tailwind-only or custom CSS-only) rather than mixing both.

## Action Items

| Priority | Action |
|---|---|
| P0 | Run `npm audit fix` to patch postcss vulnerability |
| P2 | Evaluate whether Tailwind CSS provides enough value to justify the dependency, given the massive custom `style.css` |
| P3 | Consider pinning exact versions instead of caret ranges for reproducible builds |
