/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all files that contain Nativewind classes.
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}", "./hooks/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          primary: "#111111",
          secondary: "#dadada",
          tertiary: "#070fff",
          quaternary: "#007fff",
          quinary: "#ff7700",
        },

        light: {
          primary: "#111111",
          secondary: "#dadada",
          background: "#dadada",
          card: "#dadada",
          border: "#111111",
          overlay: "#dadada",
          text: {
            primary: "#111111",
            secondary: "#111111",
            muted: "#111111",
            inverted: "#dadada",
          },
          icon: {
            default: "#111111",
            active: "#070fff",
          },
          tabIcon: {
            default: "#111111",
            selected: "#007fff",
          },
          status: {
            success: "#007fff",
            warning: "#ff7700",
            error: "#070fff",
            info: "#007fff",
          },
          bg: {
            success: "#dadada",
            warning: "#ff7700",
            error: "#dadada",
            info: "#dadada",
            accent: "#dadada",
            input: "#dadada",
          },
          textStatus: {
            success: "#007fff",
            warning: "#ff7700",
            error: "#070fff",
            info: "#007fff",
            accent: "#070fff",
          },
          accent: "#070fff",
          focus: "#007fff",
        },

        dark: {
          primary: "#dadada",
          secondary: "#007fff",
          background: "#111111",
          card: "#111111",
          border: "#dadada",
          overlay: "#111111",
          text: {
            primary: "#dadada",
            secondary: "#dadada",
            muted: "#dadada",
            inverted: "#111111",
          },
          icon: {
            default: "#dadada",
            active: "#007fff",
          },
          tabIcon: {
            default: "#dadada",
            selected: "#007fff",
          },
          status: {
            success: "#007fff",
            warning: "#ff7700",
            error: "#070fff",
            info: "#007fff",
          },
          bg: {
            success: "#111111",
            warning: "#111111",
            error: "#111111",
            info: "#111111",
            accent: "#111111",
            input: "#111111",
          },
          textStatus: {
            success: "#007fff",
            warning: "#ff7700",
            error: "#070fff",
            info: "#007fff",
            accent: "#070fff",
          },
          accent: "#070fff",
          focus: "#007fff",
        },
      },
    },
  },
  plugins: [require("@tailwindcss/forms"), require("@tailwindcss/typography")],
};
