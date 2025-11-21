// frontend/tailwind.config.js
module.exports = {
  content: [
    "./pages/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        background: "#0b0f1a",
        panel: "rgba(255,255,255,0.03)",
        neon: {
          cyan: "#00e6ff",
          magenta: "#ff4dd2",
          violet: "#7a5cff",
          laser: "#ffd300",
        },
      },
      boxShadow: {
        "neon-cyan": "0 0 20px rgba(0,230,255,0.12), 0 0 60px rgba(0,230,255,0.06)",
        "neon-magenta": "0 0 16px rgba(255,77,210,0.10)",
      },
      fontFamily: {
        display: ["Orbitron", "sans-serif"],
        body: ["Inter", "sans-serif"],
      },
    },
  },
  plugins: [],
};
