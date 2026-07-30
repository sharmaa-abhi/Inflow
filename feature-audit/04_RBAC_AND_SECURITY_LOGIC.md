# 04 — Role-Based Access & Security Logic Audit

## Phase 6: Role-Based Access & Permissions (RBAC) Audit

### Architectural Context
InkFlow is a 100% client-side, browser-native single-user application.
- **Backend API**: None
- **Authentication**: None
- **Authorization / RBAC**: None
- **Multi-tenancy**: None

---

## Security & Permission Logic Matrix

| Security Boundary | Risk / Vector | Audit Finding | Status |
|---|---|---|---|
| **Unauthenticated Access** | Open access to diagram tool | Expected behavior for a client-side whiteboard. Anyone with URL can use app. | ✅ N/A |
| **Data Isolation** | Cross-user data leakage | All state is strictly local to the user's `localStorage` domain origin. No cross-origin data exposure. | ✅ Safe |
| **SVG XML Parsing (XSS)** | Injection via imported SVG files | `svgParser.js` parses raw SVG XML using `DOMParser`. Only extracts path `d` attributes and converts to Konva vector lines. Does NOT execute inline scripts or inject HTML DOM. | ✅ Low Risk |
| **Excalidraw JSON Import** | Prototype pollution via JSON import | `convertExcalidrawToInkFlow` parses elements and constructs object literals manually. Low risk of prototype pollution. | ✅ Safe |
| **Dependencies Vulnerability** | PostCSS CVE path traversal | `postcss <= 8.5.17` (GHSA-r28c-9q8g-f849) vulnerability present in dev environment. | 🔴 High Risk (Fixable via `npm audit fix`) |
| **Content Security Policy** | Script injection / Data exfiltration | No CSP `<meta>` tag configured in `index.html`. | 🟡 Medium Risk |

---

## Data Privacy & Client-Side Storage Integrity

1. **Plaintext LocalStorage**:
   - Diagram shapes, text labels, and embedded base64 image data URLs are saved in unencrypted plaintext in browser `localStorage`.
   - Any malicious browser extension with origin permissions can read diagram content.

2. **No Data Exfiltration Risk**:
   - App makes zero outgoing network requests during canvas operations.
   - Default architecture diagram is fetched via relative path `/InkFlow-Architecture.excalidraw`.

---

## Security Audit Verdict: **35/100**
- Functional client-side isolation is naturally secure due to absence of backend.
- Main vulnerabilities stem from unpatched dev dependencies (`postcss`) and missing CSP security headers.
