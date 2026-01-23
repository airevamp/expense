import React, { Suspense, useEffect } from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  Container,
  IconButton,
  Button,
  Menu,
  MenuItem,
  CircularProgress,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import { useRoutes, Link as RouterLink } from "react-router-dom";
import { routes } from "./routes";
import { AccountCircle } from "@mui/icons-material";
import { useUser } from "./lib/auth";

export default function App() {
  const element = useRoutes(routes);
  const { user, loading: authLoading, login, logout: logoutMsal } = useUser();
  const auth = Boolean(user?.userId);
  const [menuAnchorEl, setMenuAnchorEl] = React.useState<null | HTMLElement>(
    null,
  );

  const [accountAnchorEl, setAccountAnchorEl] =
    React.useState<null | HTMLElement>(null);
  const navMenuOpen = Boolean(menuAnchorEl);
  const accountMenuOpen = Boolean(accountAnchorEl);
  const closeNavMenu = React.useCallback(() => {
    setMenuAnchorEl(null);
  }, []);
  const closeAccountMenu = React.useCallback(() => {
    setAccountAnchorEl(null);
  }, []);

  const openMenu = React.useCallback((event: React.MouseEvent<HTMLElement>) => {
    setMenuAnchorEl(event.currentTarget);
  }, []);
  const openAccountMenu = React.useCallback(
    (event: React.MouseEvent<HTMLElement>) => {
      setAccountAnchorEl(event.currentTarget);
    },
    [],
  );

  useEffect(() => {
    const isPwa =
      window.matchMedia?.("(display-mode: standalone)")?.matches ||
      (window.navigator as any)?.standalone === true;

    if (!isPwa) return;

    const MIN_DURATION = 800; // ms (try 600–1000)

    const start = performance.now();

    requestAnimationFrame(() => {
      const el = document.getElementById("boot-splash");
      if (!el) return;

      const elapsed = performance.now() - start;
      const remaining = Math.max(0, MIN_DURATION - elapsed);

      setTimeout(() => {
        el.classList.add("hide");
        setTimeout(() => el.remove(), 260);
      }, remaining);
    });
  }, []);

  const logout = React.useCallback(() => {
    logoutMsal();
  }, [logoutMsal]);

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
          <Menu
            id="account-menu"
            anchorEl={accountAnchorEl}
            anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
            keepMounted
            open={accountMenuOpen}
            onClose={closeAccountMenu}
            onClick={closeAccountMenu}
          >
            <MenuItem component={RouterLink} to="/profile">
              Profile
            </MenuItem>
            <MenuItem onClick={logout}>Logout</MenuItem>
          </Menu>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Expenses
          </Typography>
          {!authLoading && !auth && (
            <Button
              color="inherit"
              onClick={login}
              sx={{
                textTransform: "none",
                bgcolor: "rgba(0, 0, 0, 0.35)",
                "&:hover": { bgcolor: "rgba(0, 0, 0, 0.5)" },
              }}
            >
              Sign in
            </Button>
          )}
          {auth && (
            <>
              <IconButton color="inherit" onClick={openAccountMenu}>
                <AccountCircle />
              </IconButton>
              <Typography variant="body2" sx={{ mr: 1 }}>
                Hello {user?.userName || user?.userId}
              </Typography>
            </>
          )}
        </Toolbar>
      </AppBar>
      <Container maxWidth="sm" sx={{ py: 2 }}>
        <Suspense fallback={<CircularProgress />}>{element}</Suspense>
      </Container>
    </>
  );
}
