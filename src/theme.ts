import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: { mode: "light", primary: { main: "#1976d2" } },
  shape: { borderRadius: 16 },
  components: {
    MuiButton: {
      styleOverrides: { root: { textTransform: "none", borderRadius: 16 } },
    },
    MuiCard: { styleOverrides: { root: { borderRadius: 16 } } },
  },
});

export default theme;
