tailwind.config = {
  theme: {
    extend: {
      colors: {
        ivory: "#F7F2E9",
        bone: "#EFE7D8",
        sand: "#D9CBB0",
        ink: "#15110E",
        coal: "#241C17",
        terra: "#B4521E",
        ember: "#D9772F",
        moss: "#2F4A3A",
        cowrie: "#FBF8F1"
      },
      fontFamily: {
        display: ['"Cormorant Garamond"', "Georgia", "serif"],
        sans: ['"Jost"', "system-ui", "sans-serif"]
      },
      letterSpacing: { wider2: "0.28em", wider3: "0.4em" },
      keyframes: {
        marquee: { "0%": { transform: "translateX(0)" }, "100%": { transform: "translateX(-50%)" } },
        floaty: { "0%,100%": { transform: "translateY(0)" }, "50%": { transform: "translateY(10px)" } }
      },
      animation: { marquee: "marquee 38s linear infinite", floaty: "floaty 2.4s ease-in-out infinite" }
    }
  }
};
