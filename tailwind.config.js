/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // "Deep Plum" dark theme — kept in sync with src/context/ThemeContext.tsx
        bg: {
          primary: "#160B14",
        },
        surface: "#241320",
        surface2: "#332030",
        accent: {
          DEFAULT: "#4A1942",
          violet: "#A855F7",
          gradient: {
            start: "#4A1942",
            end: "#7C3AED",
          },
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
      },
      fontFamily: {
        poppins: ["Poppins_400Regular"],
        "poppins-medium": ["Poppins_500Medium"],
        "poppins-semibold": ["Poppins_600SemiBold"],
        "poppins-bold": ["Poppins_700Bold"],
      },
      borderRadius: {
        "2xl": "16px",
        "3xl": "24px",
      },
    },
  },
  plugins: [],
};
