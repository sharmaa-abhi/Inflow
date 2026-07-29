# 12 — Error Handling Audit

## Overall Assessment: **Very Poor (20/100)**

The application has almost no structured error handling. Most functions assume happy-path execution. Failures result in silent data loss, unhandled exceptions, or cryptic runtime crashes.

---

## Missing Error Handling (By Module)

### PersistenceManager.js — File I/O Operations
| Operation | Current Behavior | Risk |
|---|---|---|
| `saveToLocalStorage()` | No try/catch. If localStorage is full (quota exceeded), the save fails silently. | 🔴 Silent data loss |
| `loadFromLocalStorage()` | `JSON.parse()` wrapped in try/catch ✅, but only catches parse errors, not localStorage access errors. | 🟡 Partial |
| `importSceneData(data)` | No validation of input schema. No try/catch around shape recreation. | 🔴 Crash on malformed input |
| `importExcalidrawFile(json)` | No validation of Excalidraw file format. Assumes specific property names exist. | 🔴 Crash on malformed input |
| `exportPNG()` | Uses `stage.toDataURL()` which can fail with tainted canvases (CORS images). No try/catch. | 🔴 Uncaught exception |

### ImageTool.js — File Upload
| Operation | Current Behavior | Risk |
|---|---|---|
| `processFile()` | `FileReader.onload` is set, but `FileReader.onerror` is never set. | 🔴 Silent failure |
| File type check | Only checks `file.type.startsWith('image/')` — no size limit. A 500MB image will freeze the browser. | 🟡 DoS risk |

### svgParser.js — XML Parsing
| Operation | Current Behavior | Risk |
|---|---|---|
| `DOMParser.parseFromString()` | No check for parser errors. `DOMParser` returns a document with a `<parsererror>` element on malformed XML, but this is never checked. | 🟡 Silent failure |

### ShapeManager.js — Shape Operations
| Operation | Current Behavior | Risk |
|---|---|---|
| `recreateShape(data)` | A giant switch statement on `data.type`. Unknown types fall through to `default` which returns `null`. Callers don't check for `null`. | 🔴 Null reference crash |
| `getShapeById(id)` | Returns `undefined` if not found. Some callers check, many don't. | 🟡 Inconsistent |

### HistoryManager.js — Undo/Redo
| Operation | Current Behavior | Risk |
|---|---|---|
| `undo()` / `redo()` | Calls closured callbacks that reference shapes. If a shape was already destroyed, the callback crashes. | 🔴 Runtime crash |
| No try/catch around action callbacks | A single failed undo breaks the entire history stack. | 🔴 Cascading failure |

### TextTool.js — DOM Textarea
| Operation | Current Behavior | Risk |
|---|---|---|
| `finalizeEditing()` | Called on `blur`. If called twice (e.g., programmatic blur + user click), guards prevent double-processing ✅. | ✅ Safe |
| `textarea.remove()` | If textarea was already removed, this is a no-op in modern browsers ✅. | ✅ Safe |

---

## Error Handling Patterns Found

### ✅ Positive Patterns
1. **Null-safe DOM queries**: Many UI controllers use `if (this.btnZoomIn)` guards before attaching listeners. This prevents crashes if elements are missing.
2. **Optional chaining in main.js**: Mobile wiring uses `?.` extensively (e.g., `document.getElementById('mb-btn-export-png')?.addEventListener(...)`)
3. **JSON parse try/catch**: `PersistenceManager.loadFromLocalStorage()` wraps `JSON.parse` in try/catch.

### ❌ Missing Patterns
1. **No global error handler**: No `window.onerror` or `window.addEventListener('unhandledrejection', ...)` to catch and report uncaught exceptions.
2. **No user-facing error messages**: When operations fail, the user sees nothing — no toast, no alert, no status indicator.
3. **No error boundaries**: A crash in one component (e.g., PropertiesPanel) can cascade and freeze the entire application.
4. **No input validation layer**: Functions accept raw external input (JSON files, SVG strings, color values) without validation.

---

## Recommendations

1. **P0**: Add try/catch around all `localStorage` operations with user-facing error toasts.
2. **P0**: Add `FileReader.onerror` handler in ImageTool.
3. **P0**: Wrap undo/redo callbacks in try/catch to prevent stack corruption.
4. **P1**: Add a global `window.onerror` handler that shows a toast notification.
5. **P1**: Validate JSON schema before importing scene data.
6. **P2**: Add file size limits for image uploads (e.g., 10MB max).
7. **P2**: Check `DOMParser` output for `<parsererror>` in SVG import.
