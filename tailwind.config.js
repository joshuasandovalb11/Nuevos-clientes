/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      fontFamily: {
        "poppins-bold": ["Poppins_700Bold"],
        "roboto": ["Roboto_400Regular"],
        "roboto-medium": ["Roboto_500Medium"],
      },
    },
  },
  plugins: [],
};

