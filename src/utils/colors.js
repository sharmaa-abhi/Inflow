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
