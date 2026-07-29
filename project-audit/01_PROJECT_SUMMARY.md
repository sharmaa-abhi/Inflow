# 01 — Project Summary

## Application Name
**InkFlow** — Professional Diagram & Whiteboard Application

## Version
`v2.0` (as stated in UI branding); `package.json` version is `0.0.0` (never bumped).

## Purpose
InkFlow is a browser-based infinite-canvas diagramming and whiteboarding tool inspired by Excalidraw. It supports freehand drawing, geometric shapes (rectangle, circle, diamond, line, arrow, pill, parallelogram, trapezoid, cylinder, cloud, star, speech bubble), sticky notes, text, images, connectors with orthogonal routing, a hand-drawn/sketchy rendering mode (via rough.js), undo/redo history, JSON/Excalidraw file import/export, PNG export, SVG import, dark mode, snapping, and a responsive mobile layout.

## Repository Statistics

| Metric | Value |
|---|---|
| Total Source Files | 57 |
| Total Source Size | ~409 KB |
| Total Commits | 48 |
| Branches | `main`, `mobile` (active) |
| Languages | JavaScript (51), CSS (2), SVG (2), Markdown (1), PNG (1) |
| Framework | Vanilla JS + Vite 8.1 |
| Rendering Engine | Konva.js v10.3 |
| Sketch Engine | rough.js v4.6 |
| CSS Framework | Tailwind CSS v4.3 (via Vite plugin) |
| Package Manager | npm |
| Test Framework | **None** |
| CI/CD Pipeline | **None** |
| Linting | **None configured** |
| TypeScript | **Not used** |

## Key Observations

1. **No tests exist** — zero unit, integration, or E2E tests.
2. **No CI/CD pipeline** — no GitHub Actions, no pre-commit hooks, no automated quality gates.
3. **No linting or formatting** — no ESLint, Prettier, or Stylelint configuration.
4. **No TypeScript** — entire codebase is vanilla JavaScript with no type checking.
5. **Version `0.0.0`** — `package.json` version was never updated despite UI claiming "v2.0".
6. **Active branch is `mobile`** — development appears to be on a feature branch, not `main`.
7. **Single developer workflow** — commit messages suggest solo development with no code review process.
8. **1 known CVE** — `postcss <=8.5.17` has a high-severity path traversal vulnerability (GHSA-r28c-9q8g-f849).
