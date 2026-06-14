/**
 * MyFleet Design Tokens
 * Dark luxury theme — mirrors tailwind.config.js for inline style usage.
 */

export const Colors = {
  // "Deep Plum" dark theme — kept in sync with src/context/ThemeContext.tsx
  bg: {
    primary: "#160B14",
  },
  surface: "#241320",
  surface2: "#332030",
  accent: {
    DEFAULT: "#4A1942",
    violet: "#A855F7",
    gradientStart: "#4A1942",
    gradientEnd: "#7C3AED",
  },
  text: {
    primary: "#F3EEF2",
    secondary: "#C9B8C4",
    muted: "#9A8693",
  },
  border: {
    DEFAULT: "#3A2435",
    focus: "#A855F7",
  },
  success: "#2ECC71",
  warning: "#F39C12",
  error: "#E74C3C",
  star: "#F1C40F",
} as const;

export const Typography = {
  families: {
    regular: "Poppins_400Regular",
    medium: "Poppins_500Medium",
    semibold: "Poppins_600SemiBold",
    bold: "Poppins_700Bold",
  },
  sizes: {
    xs: 11,
    sm: 13,
    base: 15,
    lg: 17,
    xl: 20,
    "2xl": 24,
    "3xl": 26,
    "4xl": 32,
  },
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  "2xl": 24,
  "3xl": 32,
} as const;

export const BorderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
} as const;
