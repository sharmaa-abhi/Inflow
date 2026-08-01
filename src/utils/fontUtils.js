export const FONT_FAMILIES = [
  {
    id: 1,
    name: "Virgil",
    family: "Virgil"
  },
  {
    id: 2,
    name: "Helvetica",
    family: "Helvetica, Arial, sans-serif"
  },
  {
    id: 3,
    name: "Cascadia",
    family: '"Cascadia Code", Consolas, monospace'
  }
];

/**
 * Resolves font family input (name, object, or legacy numeric id) into standard font stack string.
 * @param {string|number} fontFamily 
 * @returns {string} Font family CSS string
 */
export function resolveFontFamilyName(fontFamily) {
  if (fontFamily === 1 || fontFamily === '1' || fontFamily === 'Virgil' || fontFamily === 'handwritten' || fontFamily === 'Architects Daughter') {
    return 'Virgil, "Architects Daughter", cursive';
  }
  if (fontFamily === 2 || fontFamily === '2' || fontFamily === 'Helvetica' || fontFamily === 'sans' || fontFamily === 'Inter') {
    return 'Helvetica, Arial, sans-serif';
  }
  if (fontFamily === 3 || fontFamily === '3' || fontFamily === 'Cascadia' || fontFamily === 'code' || fontFamily === 'Fira Code') {
    return '"Cascadia Code", Consolas, monospace';
  }
  if (typeof fontFamily === 'number') {
    const found = FONT_FAMILIES.find(f => f.id === fontFamily);
    if (found) return found.family;
  }
  if (typeof fontFamily === 'string') {
    return fontFamily;
  }
  return 'Virgil, "Architects Daughter", cursive';
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
