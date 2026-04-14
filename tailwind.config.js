/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all files that contain Nativewind classes.
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}", "./hooks/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        navy: {
          950: "#001224",
          900: "#001933",
          800: "#054161",
        },
        azure: {
          500: "#007FFF",
          400: "#3399FF",
          200: "#99CCFF",
          50: "#E5F2FF",
        },
        tech: {
          cyan: "#00F6FF",
        },
        brand: {
          primary: "#001224",
          secondary: "#001933",
          tertiary: "#054161",
          quaternary: "#007FFF",
          quinary: "#3399FF",
          technical: "#00F6FF",
        },

        light: {
          primary: "#001224",
          secondary: "#001933",
          background: "#001224",
          card: "#001933",
          border: "#054161",
          overlay: "#001224",
          text: {
            primary: "#E5F2FF",
            secondary: "#99CCFF",
            muted: "#99CCFF",
            inverted: "#001224",
          },
          icon: {
            default: "#99CCFF",
            active: "#007FFF",
          },
          tabIcon: {
            default: "#99CCFF",
            selected: "#007FFF",
          },
          status: {
            success: "#00F6FF",
            warning: "#3399FF",
            error: "#3399FF",
            info: "#007FFF",
          },
          bg: {
            success: "#001933",
            warning: "#001933",
            error: "#001933",
            info: "#001933",
            accent: "#001933",
            input: "#001933",
          },
          textStatus: {
            success: "#00F6FF",
            warning: "#99CCFF",
            error: "#99CCFF",
            info: "#007FFF",
            accent: "#3399FF",
          },
          accent: "#3399FF",
          focus: "#007FFF",
        },

        dark: {
          primary: "#E5F2FF",
          secondary: "#99CCFF",
          background: "#001224",
          card: "#001933",
          border: "#054161",
          overlay: "#001224",
          text: {
            primary: "#E5F2FF",
            secondary: "#99CCFF",
            muted: "#99CCFF",
            inverted: "#001224",
          },
          icon: {
            default: "#99CCFF",
            active: "#007FFF",
          },
          tabIcon: {
            default: "#99CCFF",
            selected: "#007FFF",
          },
          status: {
            success: "#00F6FF",
            warning: "#99CCFF",
            error: "#3399FF",
            info: "#007FFF",
          },
          bg: {
            success: "#001933",
            warning: "#001933",
            error: "#001933",
            info: "#001933",
            accent: "#001933",
            input: "#001933",
          },
          textStatus: {
            success: "#00F6FF",
            warning: "#99CCFF",
            error: "#99CCFF",
            info: "#007FFF",
            accent: "#3399FF",
          },
          accent: "#3399FF",
          focus: "#007FFF",
        },
      },
      borderRadius: {
        card: "16px",
      },
      boxShadow: {
        "azure-glow": "0 0 16px rgba(0, 127, 255, 0.28)",
      },
    },
  },
  plugins: [require("@tailwindcss/forms"), require("@tailwindcss/typography")],
};
