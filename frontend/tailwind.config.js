/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#2563eb", // blue-600
        secondary: "#1e293b", // slate-800
        accent: "#10b981", // emerald-500
      },
    },
  },
  darkMode: 'class',
  plugins: [],
};
