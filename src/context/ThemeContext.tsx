import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

type Theme = "dark" | "light";

interface ThemeColors {
  background: string;
  surface: string;
  /** Elevated surface (cards/inputs/sheets) — one step lighter than surface. */
  surface2: string;
  primary: string;
  /** Vivid accent for CTAs, links, active icons (gradient end). */
  accent: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  border: string;
  error: string;
  errorSoft: string;
  statusBarStyle: "light" | "dark";
}

interface ThemeContextType {
  theme: Theme;
  colors: ThemeColors;
  toggleTheme: () => void;
  isDark: boolean;
}

// "Deep Plum" — a cohesive dark theme anchored on the brand purple. No pure
// black: the base is a deep purple-black, surfaces are lifted in measurable
// steps for depth, text meets WCAG-AA on every surface, and the violet accent
// carries CTAs/links. The old #050404 base + 60%/40%-opacity text are gone.
const darkColors: ThemeColors = {
  background: "#160B14",
  surface: "#241320",
  surface2: "#332030",
  primary: "#4A1942",
  accent: "#A855F7",
  text: "#F3EEF2",
  textSecondary: "#C9B8C4",
  textMuted: "#9A8693",
  border: "#3A2435",
  error: "#F87171",
  errorSoft: "rgba(248, 113, 113, 0.15)",
  statusBarStyle: "light",
};

const lightColors: ThemeColors = {
  background: "#F5F5F7",
  surface: "#FFFFFF",
  surface2: "#EFEDF2",
  primary: "#4A1942",
  accent: "#7C3AED",
  text: "#1D1D1F",
  textSecondary: "rgba(29, 29, 31, 0.6)",
  textMuted: "rgba(29, 29, 31, 0.4)",
  border: "rgba(0, 0, 0, 0.1)",
  error: "#DC2626",
  errorSoft: "rgba(220, 38, 38, 0.1)",
  statusBarStyle: "dark",
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>("dark");

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  }, []);

  const colors = theme === "dark" ? darkColors : lightColors;
  const isDark = theme === "dark";

  return (
    <ThemeContext.Provider value={{ theme, colors, toggleTheme, isDark }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}
