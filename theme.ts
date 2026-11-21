"use client";

import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  cssVariables: true,
  colorSchemes: {
    light: {
      palette: {
        background: {
          default: "#fafafa",
        },
      },
    },
    dark: {
      palette: {
        background: {
          default: "#000000",
        },
      },
    },
  },
  typography: {
    fontFamily: "var(--font-geist-sans), sans-serif",
  },
});

export default theme;
