/**
 * Resolves font family input (name or legacy numeric id) into standard font stack.
 * @param {string|number} fontFamily 
 * @returns {string} Font family CSS string
 */
export function resolveFontFamilyName(fontFamily) {
  if (fontFamily === 3 || fontFamily === 'Architects Daughter' || fontFamily === 'handwritten' || fontFamily === 'Caveat') {
    return "'Architects Daughter', cursive";
  }
  if (fontFamily === 2 || fontFamily === 'Fira Code' || fontFamily === 'code' || fontFamily === 'monospace') {
    return "'Fira Code', monospace";
  }
  if (fontFamily === 1 || fontFamily === 'Inter' || fontFamily === 'sans' || fontFamily === 'sans-serif') {
    return "'Inter', sans-serif";
  }
  if (typeof fontFamily === 'string') {
    return fontFamily;
  }
  return "'Architects Daughter', cursive";
}

/**
 * Ensures Google Fonts are loaded before drawing text on canvas to prevent layout shift or fallback flicker.
 * @param {string} fontFamilyName 
 * @param {number} fontSize 
 */
export async function preloadFont(fontFamilyName, fontSize = 24) {
  try {
    if (document.fonts && document.fonts.load) {
      await document.fonts.load(`${fontSize}px ${fontFamilyName}`);
      await document.fonts.ready;
    }
  } catch (err) {
    console.warn('Font preload exception:', err);
  }
}
