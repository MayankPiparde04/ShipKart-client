/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all files that contain Nativewind classes.
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}", "./hooks/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // 🌞 LIGHT THEME COLORS
        light: {
          // === CORE COLORS ===
          primary: "#0a7ea4", // Teal blue (brand primary)
          secondary: "#2563eb", // Vivid blue (secondary CTA)
          background: "#fefefe", // Pure off-white (app background)
          card: "#ffffff", // White (card surface)
          border: "#e2e8f0", // Soft gray-blue (neutral border)
          overlay: "rgba(0, 0, 0, 0.04)", // Light overlay (modal background)

          // === TEXT COLORS ===
          text: {
            primary: "#080b12", // Slate black (main text)
            secondary: "#374151", // Slate gray (support text)
            muted: "#6b7280", // Cool gray (placeholder/subtle)
            inverted: "#ffffff", // White (on dark surfaces)
          },

          // === ICONS ===
          icon: {
            default: "#4b5563", // Mid-gray (default icon)
            active: "#0a7ea4", // Teal blue (active icon)
          },

          // === TAB ICONS ===
          tabIcon: {
            default: "#9ca3af", // Light gray (inactive tab)
            selected: "#0a7ea4", // Teal blue (active tab)
          },

          // === STATUS COLORS ===
          status: {
            success: "#16a34a", // True green
            warning: "#f59e0b", // Amber
            error: "#dc2626", // Red
            info: "#0284c7", // Ocean blue
          },

          // === BACKGROUND STATUS ===
          bg: {
            success: "#dcfce7", // Mint green background
            warning: "#fef3c7", // Pale amber
            error: "#fee2e2", // Soft red
            info: "#e0f2fe", // Ice blue
            accent: "#ede9fe", // Lavender
            input: "#f9fafb", // Very light gray (input)
          },

          // === STATUS TEXT ===
          textStatus: {
            success: "#15803d", // Forest green
            warning: "#b45309", // Dark amber
            error: "#991b1b", // Deep red
            info: "#075985", // Steel blue
            accent: "#5b21b6", // Deep violet
          },

          // === ACCENTS & FOCUS ===
          accent: "#7c3aed", // Electric violet
          focus: "#bae6fd", // Pale sky blue
        },

        // 🌙 DARK THEME COLORS
        dark: {
          // === CORE COLORS ===
          primary: "#ffffff", // White (brand primary)
          secondary: "#60a5fa", // Soft blue (CTA)
          background: "#0f1113", // Rich black
          card: "#1a1d1f", // Dark charcoal
          border: "#2d333b", // Dim gray
          overlay: "rgba(255, 255, 255, 0.03)", // Light overlay

          // === TEXT COLORS ===
          text: {
            primary: "#f3f4f6", // Near white
            secondary: "#9ca3af", // Soft gray
            muted: "#6b7280", // Mid gray
            inverted: "#0a0e10", // Deep black (for light backgrounds)
          },

          // === ICONS ===
          icon: {
            default: "#9ca3af", // Gray
            active: "#ffffff", // White
          },

          // === TAB ICONS ===
          tabIcon: {
            default: "#6b7280", // Mid gray
            selected: "#ffffff", // White
          },

          // === STATUS COLORS ===
          status: {
            success: "#22c55e", // Neon green
            warning: "#eab308", // Yellow gold
            error: "#ef4444", // Coral red
            info: "#38bdf8", // Cyan
          },

          // === BACKGROUND STATUS ===
          bg: {
            success: "rgba(34, 197, 94, 0.1)", // Green tint
            warning: "rgba(234, 179, 8, 0.1)", // Yellow tint
            error: "rgba(239, 68, 68, 0.08)", // Red tint
            info: "rgba(14, 165, 233, 0.08)", // Info tint
            accent: "rgba(192, 132, 252, 0.12)", // Lilac
            input: "#111827", // Charcoal
          },

          // === STATUS TEXT ===
          textStatus: {
            success: "#4ade80", // Bright green
            warning: "#facc15", // Vivid gold
            error: "#f87171", // Soft red
            info: "#0ea5e9", // Sky blue
            accent: "#d8b4fe", // Lavender
          },

          // === ACCENTS & FOCUS ===
          accent: "#c084fc", // Lilac
          focus: "#0ea5e9", // Sky blue
        },
      },
    },
  },
  plugins: [require("@tailwindcss/forms"), require("@tailwindcss/typography")],
};
