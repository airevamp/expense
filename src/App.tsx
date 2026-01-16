import React, { Suspense } from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  Container,
  IconButton,
  Button,
  Menu,
  MenuItem,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import { useNavigate, useRoutes, Link as RouterLink } from "react-router-dom";
import { routes } from "./routes";
import { AccountCircle } from "@mui/icons-material";

export default function App() {
  const element = useRoutes(routes);
  const navigate = useNavigate();
  const [auth, setAuth] = React.useState<boolean>(true);
  const [menuAnchorEl, setMenuAnchorEl] = React.useState<null | HTMLElement>(
    null
  );
  const navMenuOpen = Boolean(menuAnchorEl);
  const closeNavMenu = React.useCallback(() => {
    setMenuAnchorEl(null);
  }, []);

  const openMenu = React.useCallback((event: React.MouseEvent<HTMLElement>) => {
    setMenuAnchorEl(event.currentTarget);
  }, []);

  return (
    <>
      <AppBar position="sticky" elevation={0}>
        <Toolbar>
          <IconButton edge="start" color="inherit" onClick={openMenu}>
            <MenuIcon />
          </IconButton>
          <Menu
            id="menu"
            anchorEl={menuAnchorEl}
            anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
            keepMounted
            open={navMenuOpen}
            onClose={closeNavMenu}
            onClick={() => setMenuAnchorEl(null)}
          >
            <MenuItem component={RouterLink} to="/dashboard">
              Dashboard
            </MenuItem>
            <MenuItem component={RouterLink} to="/capture">
              Capture
            </MenuItem>
            <MenuItem component={RouterLink} to="/receipts">
              Receipts
            </MenuItem>
          </Menu>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Rise North Expenses
          </Typography>
          {auth && (
            <div>
              <IconButton color="inherit" component={RouterLink} to="/expenses">
                <AccountCircle />
              </IconButton>
            </div>
          )}
        </Toolbar>
      </AppBar>
      <Container maxWidth="sm" sx={{ py: 2 }}>
        <Suspense fallback={<div>Loading…</div>}>{element}</Suspense>
      </Container>
    </>
  );
}
