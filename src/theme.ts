import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: { mode: "light", primary: { main: "#f8dd2bee" } },
  shape: { borderRadius: 16 },
  components: {
    MuiButton: {
      styleOverrides: { root: { textTransform: "none", borderRadius: 16 } },
    },
    MuiCard: { styleOverrides: { root: { borderRadius: 16 } } },
  },
});

export default theme;
