/**
 * Comprehensive Color Palettes for InkFlow
 * Contains 15 categorized color families with 10 shades each (150 colors total)
 */
export const COLORS = {
  blue: [
    "#EAF4FF",
    "#D6EBFF",
    "#B9DBFF",
    "#8EC5FF",
    "#5DA9FF",
    "#3B82F6",
    "#2563EB",
    "#1D4ED8",
    "#1E40AF",
    "#172554",
  ],

  green: [
    "#F0FDF4",
    "#DCFCE7",
    "#BBF7D0",
    "#86EFAC",
    "#4ADE80",
    "#22C55E",
    "#16A34A",
    "#15803D",
    "#166534",
    "#14532D",
  ],

  purple: [
    "#FAF5FF",
    "#F3E8FF",
    "#E9D5FF",
    "#D8B4FE",
    "#C084FC",
    "#A855F7",
    "#9333EA",
    "#7E22CE",
    "#6B21A8",
    "#581C87",
  ],

  red: [
    "#FEF2F2",
    "#FEE2E2",
    "#FECACA",
    "#FCA5A5",
    "#F87171",
    "#EF4444",
    "#DC2626",
    "#B91C1C",
    "#991B1B",
    "#7F1D1D",
  ],

  orange: [
    "#FFF7ED",
    "#FFEDD5",
    "#FED7AA",
    "#FDBA74",
    "#FB923C",
    "#F97316",
    "#EA580C",
    "#C2410C",
    "#9A3412",
    "#7C2D12",
  ],

  yellow: [
    "#FEFCE8",
    "#FEF9C3",
    "#FEF08A",
    "#FDE047",
    "#FACC15",
    "#EAB308",
    "#CA8A04",
    "#A16207",
    "#854D0E",
    "#713F12",
  ],

  pink: [
    "#FDF2F8",
    "#FCE7F3",
    "#FBCFE8",
    "#F9A8D4",
    "#F472B6",
    "#EC4899",
    "#DB2777",
    "#BE185D",
    "#9D174D",
    "#831843",
  ],

  cyan: [
    "#ECFEFF",
    "#CFFAFE",
    "#A5F3FC",
    "#67E8F9",
    "#22D3EE",
    "#06B6D4",
    "#0891B2",
    "#0E7490",
    "#155E75",
    "#164E63",
  ],

  gray: [
    "#F9FAFB",
    "#F3F4F6",
    "#E5E7EB",
    "#D1D5DB",
    "#9CA3AF",
    "#6B7280",
    "#4B5563",
    "#374151",
    "#1F2937",
    "#111827",
  ],

  neutral: [
    "#FAFAFA",
    "#F5F5F5",
    "#E5E5E5",
    "#D4D4D4",
    "#A3A3A3",
    "#737373",
    "#525252",
    "#404040",
    "#262626",
    "#171717",
  ],

  neon: [
    "#00F5FF",
    "#00FFA3",
    "#39FF14",
    "#A100FF",
    "#FF00FF",
    "#FF1744",
    "#FFD600",
    "#FF6D00",
    "#7C4DFF",
    "#18FFFF",
  ],

  pastel: [
    "#FFD6E8",
    "#FFE8CC",
    "#FFF3BF",
    "#D3F9D8",
    "#C5F6FA",
    "#D0EBFF",
    "#E5DBFF",
    "#F8F0FC",
    "#FFF0F6",
    "#F1F3F5",
  ],

  earth: [
    "#5C4033",
    "#7B5E57",
    "#8D6E63",
    "#A1887F",
    "#BCAAA4",
    "#D7CCC8",
    "#8BC34A",
    "#6D4C41",
    "#4E342E",
    "#3E2723",
  ],

  premiumDark: [
    "#0A0A0A",
    "#111827",
    "#1F2937",
    "#121826",
    "#1E1E2F",
    "#2B2D42",
    "#3A3F58",
    "#4A5568",
    "#6B7280",
    "#F8FAFC",
  ],

  metallic: [
    "#D9D9D9",
    "#C0C0C0",
    "#B8B8B8",
    "#A8A8A8",
    "#8F8F8F",
    "#757575",
    "#FFD700",
    "#E5E4E2",
    "#CD7F32",
    "#B87333",
  ],
};

/** Category labels for UI display */
export const PALETTE_CATEGORIES = [
  { id: 'quick', name: 'Quick Picks' },
  { id: 'blue', name: 'Blue' },
  { id: 'green', name: 'Green' },
  { id: 'purple', name: 'Purple' },
  { id: 'red', name: 'Red' },
  { id: 'orange', name: 'Orange' },
  { id: 'yellow', name: 'Yellow' },
  { id: 'pink', name: 'Pink' },
  { id: 'cyan', name: 'Cyan' },
  { id: 'gray', name: 'Gray' },
  { id: 'neutral', name: 'Neutral' },
  { id: 'neon', name: 'Neon' },
  { id: 'pastel', name: 'Pastel' },
  { id: 'earth', name: 'Earth' },
  { id: 'premiumDark', name: 'Premium Dark' },
  { id: 'metallic', name: 'Metallic' },
  { id: 'all', name: 'All Colors' }
];

/** Quick pick default colors for stroke */
export const DEFAULT_STROKE_COLORS = [
  "#1E293B", "#3B82F6", "#22C55E", "#EF4444", "#F97316",
  "#A855F7", "#06B6D4", "#EAB308", "#6B7280", "#00F5FF"
];

/** Quick pick default colors for fill */
export const DEFAULT_FILL_COLORS = [
  "transparent", "#EAF4FF", "#DCFCE7", "#FEE2E2", "#FFEDD5",
  "#F3E8FF", "#CFFAFE", "#FEF9C3", "#E5E7EB", "#FFD6E8"
];

/** Get color list by category ID */
export function getColorsByCategory(categoryId = 'quick') {
  if (categoryId === 'quick') {
    return DEFAULT_STROKE_COLORS;
  }
  if (categoryId === 'all') {
    return Object.values(COLORS).flat();
  }
  return COLORS[categoryId] || DEFAULT_STROKE_COLORS;
}

// ─────────────────────────────────────────────────────────────────────────────
// Multi-Format Color Conversion Utilities
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Parse any CSS color string into { r, g, b }.
 * Supports: #hex (3/6/8 digit), rgb(), rgba(), hsl(), hsla(), 'transparent'.
 * Returns null if unrecognized.
 * @param {string} str
 * @returns {{ r:number, g:number, b:number }|null}
 */
export function parseAnyColor(str) {
  if (!str || typeof str !== 'string') return null;
  str = str.trim();
  if (str === 'transparent' || str === 'none') return { r: 0, g: 0, b: 0 };

  // HEX 3-digit shorthand
  const hex3 = str.match(/^#([0-9a-f]{3})$/i);
  if (hex3) {
    const [, h] = hex3;
    return {
      r: parseInt(h[0] + h[0], 16),
      g: parseInt(h[1] + h[1], 16),
      b: parseInt(h[2] + h[2], 16),
    };
  }
  // HEX 6-digit (optional 8-digit alpha ignored)
  const hex6 = str.match(/^#([0-9a-f]{6})([0-9a-f]{2})?$/i);
  if (hex6) {
    const [, h] = hex6;
    return {
      r: parseInt(h.slice(0, 2), 16),
      g: parseInt(h.slice(2, 4), 16),
      b: parseInt(h.slice(4, 6), 16),
    };
  }
  // RGB / RGBA (comma-separated legacy syntax)
  const rgb = str.match(/^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);
  if (rgb) return { r: +rgb[1], g: +rgb[2], b: +rgb[3] };

  // HSL / HSLA
  const hsl = str.match(/^hsla?\(\s*([\d.]+)\s*,\s*([\d.]+)%\s*,\s*([\d.]+)%/i);
  if (hsl) return hslToRgb(+hsl[1], +hsl[2], +hsl[3]);

  return null;
}

/**
 * Convert hue (0-360), saturation (0-100), lightness (0-100) → { r, g, b }.
 */
export function hslToRgb(h, s, l) {
  s /= 100; l /= 100;
  const k = n => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = n => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return {
    r: Math.round(f(0) * 255),
    g: Math.round(f(8) * 255),
    b: Math.round(f(4) * 255),
  };
}

/**
 * Convert { r, g, b } (0-255) → { h (0-360), s (0-100), l (0-100) }.
 */
export function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

/** { r, g, b } → '#rrggbb' */
export function toHex({ r, g, b }) {
  return '#' + [r, g, b]
    .map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0'))
    .join('');
}

/** { r, g, b } → 'rgb(r, g, b)' */
export function toRgbString({ r, g, b }) {
  return `rgb(${r}, ${g}, ${b})`;
}

/** { r, g, b } → 'hsl(h, s%, l%)' */
export function toHslString({ r, g, b }) {
  const { h, s, l } = rgbToHsl(r, g, b);
  return `hsl(${h}, ${s}%, ${l}%)`;
}

/**
 * Detect which format a color string is in.
 * @param {string} str
 * @returns {'hex'|'rgb'|'hsl'|'transparent'|'unknown'}
 */
export function detectFormat(str) {
  if (!str) return 'unknown';
  const s = str.trim().toLowerCase();
  if (s === 'transparent' || s === 'none') return 'transparent';
  if (s.startsWith('#')) return 'hex';
  if (s.startsWith('rgb')) return 'rgb';
  if (s.startsWith('hsl')) return 'hsl';
  return 'unknown';
}

/**
 * Convert a color string to the specified target format.
 * @param {string} colorStr - any valid CSS color
 * @param {'hex'|'rgb'|'hsl'} targetFormat
 * @returns {string} converted string, or original if conversion fails
 */
export function convertColor(colorStr, targetFormat) {
  if (!colorStr) return colorStr;
  const s = colorStr.trim().toLowerCase();
  if (s === 'transparent' || s === 'none') return 'transparent';
  const rgb = parseAnyColor(colorStr);
  if (!rgb) return colorStr;
  switch (targetFormat) {
    case 'hex': return toHex(rgb);
    case 'rgb': return toRgbString(rgb);
    case 'hsl': return toHslString(rgb);
    default: return colorStr;
  }
}

