/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all of your component files.
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        contrast: "var(--contrast)",
        text: "var(--text)",
        primary: '#FF5F2F',
        dark: {
          bg: '#303030',
          fg: '#3D3D3D',
        },
        light: {
          bg: '#F6F6F6',
          fg: '#E6E6E6',
        }
      },
    },
  },
  plugins: [],
};
