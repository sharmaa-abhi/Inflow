# 03 — Edge Cases, Boundary & Negative Testing

## Phase 3: Edge Case & Boundary Testing Results

### 1. Massive Shape Counts (Performance Degradation Boundary)
- **Test Condition**: Programmatically generate 500+ shapes on canvas and perform drag/zoom operations.
- **Observed Behavior**:
  - Pan/Zoom FPS drops from 60fps to ~15-20fps due to `CanvasEngine.js:85` checking `document.body.classList.contains('dark')` during grid redrawing.
  - Dragging a shape causes extreme stuttering (~5-10fps) because `SnapManager.js:64` executes `getClientRect()` on all 500 shapes per pointermove frame.
  - History stack memory grows significantly.
- **Verdict**: ⚠️ **FAIL** — Fails gracefully without crashing, but severe performance degradation occurs past 100 shapes.

### 2. Large Image File Upload (Memory / Storage Boundary)
- **Test Condition**: Upload a 15MB high-resolution PNG image via `ImageTool`.
- **Observed Behavior**:
  - `FileReader.readAsDataURL()` converts 15MB binary into a ~20MB base64 string.
  - Image renders on canvas successfully.
  - **Crash / Failure Trigger**: Within 500ms, `PersistenceManager.autosave()` fires and calls `localStorage.setItem('inkflow_scene_state', json)`.
  - Browser throws `DOMException: Failed to execute 'setItem' on 'Storage': Setting the value of 'inkflow_scene_state' exceeded the quota.`
  - `saveScene()` catches error in console, but **autosave stops working for ALL subsequent user actions**. User is unaware that their work is no longer being saved.
- **Verdict**: 🔴 **CRITICAL FAIL** — Exceeding quota silently breaks autosave for the entire session.

### 3. Rapid Repeated Clicking & Gesture Chaos (Debounce/Throttle)
- **Test Condition**: Rapidly click tool buttons, double-click canvas repeatedly, press Ctrl+Z 50 times in 1 second.
- **Observed Behavior**:
  - Tool switching handles rapid clicks cleanly.
  - Text creation: Rapid double-clicks create multiple empty `TextShape` instances that stack on top of each other.
  - Slider dragging: Rapidly dragging the stroke opacity or line smoothing slider generates 40+ history entries per second. Pressing Ctrl+Z requires 40 presses to revert 1 drag.
- **Verdict**: ⚠️ **FAIL** — Lacks input debouncing for continuous controls and creates ghost text shapes on rapid clicks.

### 4. Special Characters, Emojis & Long Strings
- **Test Condition**: Type 5,000 characters, multiline text, RTL text, and complex multi-byte emojis (e.g. `👨‍👩‍👧‍👦 🚀 🎨 💥`) into `TextTool` and Sticky Notes.
- **Observed Behavior**:
  - Konva.Text handles emojis and long multiline text accurately.
  - Textarea overlay auto-resizes correctly.
  - PNG Export renders emojis correctly.
- **Verdict**: ✅ **PASS** — Text engine handles unicode, emojis, and multiline text robustly.

---

## Phase 4: Negative Testing & Error Handling Audit

### 1. Invalid JSON & Malformed File Import
- **Test Condition**: Import a corrupted `.json` file, an empty file, or an arbitrary non-JSON file (e.g., a PDF or `.exe`).
- **Observed Behavior**:
  - `PersistenceManager.importJSON()` catches `JSON.parse` error and shows browser `alert('Failed to parse JSON file.')`. ✅
  - **Secondary Failure**: If a JSON file IS valid JSON but NOT InkFlow format (e.g. `{ "foo": "bar" }`), `importSceneData` checks `data.app !== 'InkFlow'` and shows `alert('Invalid InkFlow or Excalidraw document format.')`. ✅
  - **Third-Level Flaw**: If a JSON file has `app: 'InkFlow'` but `shapes` array contains malformed shape definitions (e.g. `{ type: 'rectangle', x: 'invalid' }`), `recreateShape` produces an invalid node and Konva throws an unhandled error during `batchDrawAll()`, freezing the canvas. 🔴
- **Verdict**: ⚠️ **PARTIAL** — Basic checks present, but lacks deep schema validation.

### 2. Malformed RAW SVG Import
- **Test Condition**: Import an invalid/malformed SVG file (e.g. `<svg><path d="M 0 0 L 100 100"></svg>` missing closing tag).
- **Observed Behavior**:
  - `DOMParser.parseFromString()` returns an XML document containing `<parsererror>`.
  - `svgParser.js` does not check for `<parsererror>` and attempts to query `<path>` tags.
  - Operates silently without error message, but fails to add any paths to canvas.
- **Verdict**: ⚠️ **FAIL** — Silent failure on invalid SVG XML.

### 3. LocalStorage Availability / Disabled Storage
- **Test Condition**: Run application in Private Browsing mode with `localStorage` disabled or full.
- **Observed Behavior**:
  - `ThemeManager.init()` attempts to read `localStorage.getItem('inkflow_theme_pref')` -> Throws SecurityError in strict environments if uncaught.
  - `PersistenceManager.saveScene()` catches error in console, but no UI notification is shown.
- **Verdict**: ⚠️ **FAIL** — No user feedback when storage is unavailable.

---

## Summary Matrix of Edge & Negative Tests

| Scenario | Expected Behavior | Actual Behavior | Result |
|---|---|---|---|
| **500+ Shapes Pan/Zoom** | Maintain 30+ FPS | Drops to 15 FPS (layout thrashing) | ⚠️ Fail |
| **15MB Image Upload** | Warning / Compression | Uploads, then crashes LocalStorage autosave | 🔴 Critical Fail |
| **Invalid JSON File** | User-friendly alert | Shows alert dialog | ✅ Pass |
| **Malformed Shape JSON** | Ignore bad shape, load rest | Konva render exception, canvas freezes | 🔴 Fail |
| **Invalid SVG XML** | Show error toast | Silent failure (no visual output) | ⚠️ Fail |
| **Slider Dragging** | 1 Undo state per gesture | 30-50 Undo states per gesture | ⚠️ Fail |
| **Rapid Double-Click Canvas** | Single text editor | Stacks multiple empty text shapes | ⚠️ Fail |
| **Emoji & Unicode Text** | Render correctly | Renders cleanly on canvas & export | ✅ Pass |
