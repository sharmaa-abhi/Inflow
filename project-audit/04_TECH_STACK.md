# 04 — Tech Stack

## Runtime Dependencies

| Package | Version | Purpose | Status |
|---|---|---|---|
| `konva` | `^10.3.0` | HTML5 Canvas rendering engine (Stage/Layer/Node API) | ✅ Current |
| `roughjs` | `^4.6.6` | Hand-drawn/sketchy shape rendering | ✅ Current |
| `tailwindcss` | `^4.3.2` | Utility-first CSS framework | ✅ Current |
| `@tailwindcss/vite` | `^4.3.2` | Tailwind CSS Vite integration plugin | ✅ Current |

## Dev Dependencies

| Package | Version | Purpose | Status |
|---|---|---|---|
| `vite` | `^8.1.1` | Build tool and dev server | ✅ Current |

## Transitive Dependency Vulnerabilities

| Package | Severity | Advisory | Fix |
|---|---|---|---|
| `postcss` ≤8.5.17 | **HIGH** | [GHSA-r28c-9q8g-f849](https://github.com/advisories/GHSA-r28c-9q8g-f849) — Path Traversal in source map auto-loading | `npm audit fix` |

## Missing Tooling (Industry Standard Gaps)

| Tool | Category | Impact |
|---|---|---|
| ESLint | Linting | No static analysis for code quality, unused vars, or anti-patterns |
| Prettier | Formatting | Inconsistent code style across files |
| TypeScript | Type Safety | No compile-time type checking; runtime crashes from type errors |
| Vitest / Jest | Unit Testing | Zero test coverage |
| Playwright / Cypress | E2E Testing | No automated UI testing |
| Husky + lint-staged | Git Hooks | No pre-commit quality gates |
| GitHub Actions / CI | CI/CD | No automated build/test/deploy pipeline |
| Stylelint | CSS Linting | No CSS quality enforcement |
| `dotenv` | Configuration | No environment variable management |

## Browser API Usage

| API | Used In | Purpose |
|---|---|---|
| `localStorage` | PersistenceManager, ThemeManager | Autosave, theme preference |
| `FileReader` | ImageTool, PersistenceManager | File import (images, JSON) |
| `Blob` / `URL.createObjectURL` | PersistenceManager | File download (JSON, PNG export) |
| `requestAnimationFrame` | LaserTool | Laser trail fade animation loop |
| `DOMParser` | svgParser | SVG XML parsing |
| `OffscreenCanvas` / `<canvas>` | roughRenderer, BaseShape | Rough.js offscreen rendering |
| `matchMedia` | ThemeManager | System dark mode detection |
| `Drag & Drop API` | ImageTool | Image drag-and-drop to canvas |

## Recommendations

1. **Immediately**: Run `npm audit fix` to patch the postcss CVE.
2. **Short-term**: Add ESLint + Prettier with a pre-commit hook via Husky.
3. **Medium-term**: Migrate to TypeScript for type safety on the 10K+ line codebase.
4. **Long-term**: Add Vitest for unit tests and Playwright for E2E canvas interaction tests.
