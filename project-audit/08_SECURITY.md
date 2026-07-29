# 08 — Security Audit

## OWASP Risk Assessment

### 1. SVG Import — XML Injection / XSS (OWASP A03:2021 — Injection)
- **File**: `svgParser.js`
- **Severity**: 🔴 Critical
- **Issue**: `createKonvaNodesFromSvg()` uses `DOMParser` to parse raw SVG XML text and extracts `<path>` elements. However:
  - No sanitization of the SVG input is performed.
  - SVG can contain `<script>` tags, `onload` event handlers, `<foreignObject>` with arbitrary HTML, and `<use>` references to external resources.
  - While the current implementation only reads `<path>` `d` attributes and creates Konva lines (not inserting raw SVG into the DOM), the `DOMParser` still parses the full SVG tree.
  - A malicious SVG with embedded JavaScript won't execute in this specific code path (since Konva nodes are drawn to `<canvas>`, not injected into the DOM), but the parsing itself is a risk vector if the code is ever extended.
- **Risk**: Low in current implementation (canvas-only rendering), but High if SVG is ever rendered to DOM or if the parser is extended.
- **Fix**: Use a sanitization library like DOMPurify before parsing SVG input.

### 2. Data URLs in Image Import — Storage Exhaustion
- **File**: `ImageTool.js:60-90`
- **Severity**: 🟡 Medium
- **Issue**: `processFile()` reads uploaded images as full base64 data URLs via `FileReader.readAsDataURL()`. These data URLs are stored in shape state and serialized to localStorage.
  - A single 5MB image becomes a ~6.7MB base64 string.
  - localStorage has a 5-10MB limit per origin (browser dependent).
  - Importing multiple images can exhaust localStorage, causing autosave to fail silently.
- **Risk**: Medium — Data loss when localStorage is full.
- **Fix**: Compress images client-side (e.g., resize to max dimensions, use canvas to re-encode as JPEG) before storing. Consider IndexedDB for large blobs.

### 3. No CSP (Content Security Policy) Headers
- **File**: `index.html`
- **Severity**: 🟡 Medium
- **Issue**: No `Content-Security-Policy` meta tag or HTTP header is configured.
- **Risk**: If an XSS vulnerability is found, there are no CSP restrictions to limit the blast radius.
- **Fix**: Add a strict CSP:
```html
<meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' data: blob:;">
```

### 4. JSON Import — No Schema Validation
- **File**: `PersistenceManager.js:309`
- **Severity**: 🟡 Medium
- **Issue**: `importSceneData(data)` accepts arbitrary JSON objects and blindly iterates `data.shapes`, calling `recreateShape()` for each entry. No validation of:
  - Expected properties (type, x, y, width, height)
  - Value bounds or types
  - Malicious property injection (prototype pollution)
- **Risk**: Medium — A crafted JSON file could inject unexpected properties into shape objects.
- **Fix**: Validate the JSON schema using a whitelist of expected properties and types.

### 5. Dependency Vulnerability — postcss Path Traversal
- **Package**: `postcss` ≤ 8.5.17
- **Severity**: 🔴 High
- **Advisory**: [GHSA-r28c-9q8g-f849](https://github.com/advisories/GHSA-r28c-9q8g-f849)
- **Issue**: PostCSS auto-loads `.map` files referenced by `sourceMappingURL` comments without sanitizing the path, allowing path traversal to read arbitrary `.map` files from the filesystem.
- **Impact**: Development-time risk. An attacker who controls source files processed by PostCSS could read arbitrary `.map` files.
- **Fix**: `npm audit fix`

### 6. localStorage Data is Unencrypted
- **File**: `PersistenceManager.js`
- **Severity**: 🟢 Low
- **Issue**: All diagram data (shapes, positions, image data URLs) is stored in `localStorage` as plaintext JSON. Any script running on the same origin (including browser extensions) can read this data.
- **Risk**: Low — This is a client-side-only app with no server communication, but sensitive diagram content (e.g., architecture diagrams with credentials) would be exposed.

## Security Scorecard

| Category | Score | Notes |
|---|---|---|
| Input Sanitization | 30/100 | No SVG sanitization, no JSON schema validation |
| Dependency Security | 70/100 | 1 high CVE, easily fixable |
| CSP / Headers | 0/100 | No CSP configured |
| Data Protection | 40/100 | Plaintext localStorage, no size limits |
| Authentication | N/A | Client-only app, no auth needed |
| Network Security | N/A | No server communication |

**Overall Security Score: 35/100**
