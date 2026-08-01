// ─── Font System for InkFlow Text & Typography ────────────────────────────────
// Excalidraw-compatible font families, size presets, resolution, and preloading.
// ────────────────────────────────────────────────────────────────────────────────

/**
 * The canonical set of font families available in InkFlow.
 * Each entry provides:
 *   - id: numeric identifier (1-indexed, used in serialization)
 *   - name: human-readable display name
 *   - family: CSS font-family stack with fallbacks
 *   - category: CSS generic family keyword
 *   - preview: the CSS family used in the toolbar dropdown "Aa" preview
 */
export const FONT_FAMILIES = [
  {
    id: 1,
    name: 'Virgil',
    family: '"Caveat", "Architects Daughter", cursive',
    category: 'handwriting',
    preview: '"Caveat", cursive',
  },
  {
    id: 2,
    name: 'Helvetica',
    family: 'Helvetica, Arial, sans-serif',
    category: 'sans-serif',
    preview: 'Helvetica, Arial, sans-serif',
  },
  {
    id: 3,
    name: 'Cascadia',
    family: '"Cascadia Code", "Fira Code", Consolas, monospace',
    category: 'monospace',
    preview: '"Fira Code", Consolas, monospace',
  },
  {
    id: 4,
    name: 'Inter',
    family: '"Inter", system-ui, -apple-system, sans-serif',
    category: 'sans-serif',
    preview: '"Inter", system-ui, sans-serif',
  },
  {
    id: 5,
    name: 'Geist',
    family: '"Geist", "Inter", system-ui, sans-serif',
    category: 'sans-serif',
    preview: '"Geist", "Inter", system-ui, sans-serif',
  },
];

/** Ordered font size presets matching Excalidraw conventions. */
export const FONT_SIZE_PRESETS = [12, 14, 16, 18, 20, 24, 28, 32, 40, 48, 64, 96, 128];

/** Default font size for new text elements. */
export const DEFAULT_FONT_SIZE = 20;

/** Default font family id for new text elements (Virgil / handwriting). */
export const DEFAULT_FONT_FAMILY_ID = 1;

// ─── Lookup Helpers ────────────────────────────────────────────────────────────

/**
 * Look up a font entry by its numeric id.
 * @param {number} id
 * @returns {Object|undefined}
 */
export function getFontById(id) {
  return FONT_FAMILIES.find(f => f.id === id);
}

/**
 * Look up a font entry by its display name (case-insensitive).
 * @param {string} name
 * @returns {Object|undefined}
 */
export function getFontByName(name) {
  const lower = (name || '').toLowerCase();
  return FONT_FAMILIES.find(f => f.name.toLowerCase() === lower);
}

// ─── Legacy alias map for backward compatibility ───────────────────────────────
const LEGACY_ALIASES = {
  'architects daughter': 1,
  'handwritten': 1,
  'hand': 1,
  'caveat': 1,
  'sans': 2,
  'arial': 2,
  'code': 3,
  'mono': 3,
  'monospace': 3,
  'fira code': 3,
  'consolas': 3,
  'inter': 4,
  'geist': 5,
};

/**
 * Resolves any font family input (numeric id, name string, or legacy alias)
 * into the canonical CSS font-family string.
 *
 * @param {string|number} fontFamily - Font identifier
 * @returns {string} CSS font-family value
 */
export function resolveFontFamily(fontFamily) {
  // Numeric id
  if (typeof fontFamily === 'number') {
    const entry = getFontById(fontFamily);
    return entry ? entry.family : FONT_FAMILIES[0].family;
  }

  // Numeric string id ('1', '2', etc.)
  if (typeof fontFamily === 'string' && /^\d+$/.test(fontFamily)) {
    const entry = getFontById(parseInt(fontFamily, 10));
    return entry ? entry.family : FONT_FAMILIES[0].family;
  }

  if (typeof fontFamily === 'string') {
    // Exact name match
    const byName = getFontByName(fontFamily);
    if (byName) return byName.family;

    // Legacy alias match
    const lower = fontFamily.toLowerCase().trim();
    const aliasId = LEGACY_ALIASES[lower];
    if (aliasId !== undefined) {
      const entry = getFontById(aliasId);
      return entry ? entry.family : FONT_FAMILIES[0].family;
    }

    // If it already looks like a CSS font-family string, pass through
    if (fontFamily.includes(',') || fontFamily.includes('"')) {
      return fontFamily;
    }
  }

  // Fallback to Virgil
  return FONT_FAMILIES[0].family;
}

/**
 * Backward-compat alias for resolveFontFamily.
 * @deprecated Use resolveFontFamily instead.
 */
export const resolveFontFamilyName = resolveFontFamily;

/**
 * Given a font family input, returns the canonical font entry object (or default).
 * @param {string|number} fontFamily
 * @returns {Object} Font entry from FONT_FAMILIES
 */
export function resolveFontEntry(fontFamily) {
  if (typeof fontFamily === 'number') {
    return getFontById(fontFamily) || FONT_FAMILIES[0];
  }
  if (typeof fontFamily === 'string') {
    if (/^\d+$/.test(fontFamily)) {
      return getFontById(parseInt(fontFamily, 10)) || FONT_FAMILIES[0];
    }
    const byName = getFontByName(fontFamily);
    if (byName) return byName;

    const lower = fontFamily.toLowerCase().trim();
    const aliasId = LEGACY_ALIASES[lower];
    if (aliasId !== undefined) {
      return getFontById(aliasId) || FONT_FAMILIES[0];
    }
  }
  return FONT_FAMILIES[0];
}

// ─── Font Size Helpers ─────────────────────────────────────────────────────────

/**
 * Returns the next larger font size from presets.
 * If current size exceeds the largest preset, returns current.
 * @param {number} current
 * @returns {number}
 */
export function getNextFontSize(current) {
  for (const size of FONT_SIZE_PRESETS) {
    if (size > current) return size;
  }
  return current;
}

/**
 * Returns the next smaller font size from presets.
 * If current size is below the smallest preset, returns current.
 * @param {number} current
 * @returns {number}
 */
export function getPrevFontSize(current) {
  for (let i = FONT_SIZE_PRESETS.length - 1; i >= 0; i--) {
    if (FONT_SIZE_PRESETS[i] < current) return FONT_SIZE_PRESETS[i];
  }
  return current;
}

// ─── Font Preloading ───────────────────────────────────────────────────────────

/**
 * Preloads a single font at a given size to avoid FOUT (Flash of Unstyled Text).
 * @param {string} fontFamilyCSS - CSS font-family string
 * @param {number} [fontSize=20]
 * @returns {Promise<void>}
 */
export async function preloadFont(fontFamilyCSS, fontSize = 20) {
  try {
    if (document.fonts && document.fonts.load) {
      await document.fonts.load(`${fontSize}px ${fontFamilyCSS}`);
      await document.fonts.ready;
    }
  } catch (err) {
    // Font may not be available — this is non-fatal
    console.warn('[InkFlow] Font preload skipped:', fontFamilyCSS, err.message);
  }
}

/**
 * Preloads all registered font families at the default size.
 * Call this at application startup.
 * @returns {Promise<void>}
 */
export async function preloadAllFonts() {
  const promises = FONT_FAMILIES.map(f => preloadFont(f.family, DEFAULT_FONT_SIZE));
  await Promise.allSettled(promises);
}
