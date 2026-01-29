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
import { GlobalLoading } from "./components/LoadingProvider";

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
    const splash = document.getElementById("boot-splash");
    if (!splash) return;

    const shownKey = "bootSplashShown";
    const alreadyShown = sessionStorage.getItem(shownKey) === "true";
    if (alreadyShown) {
      splash.remove();
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
      document.body.style.height = "";
      return;
    }

    sessionStorage.setItem(shownKey, "true");
    const isPwa =
      window.matchMedia?.("(display-mode: standalone)")?.matches ||
      (window.navigator as any)?.standalone === true;
    if (!isPwa) {
      splash.remove();
      return;
    }

    const MIN_VISIBLE_TIME = 2000;
    const FADE_DURATION = 900;
    const startTime = performance.now();

    const removeSplash = () => {
      const logo = splash.querySelector(".boot-logo") as HTMLElement | null;
      if (!logo) {
        splash.remove();
        return;
      }

      splash.style.opacity = "1";
      logo.style.willChange = "transform, opacity";
      logo.style.transformOrigin = "center";
      logo.style.transition = `transform ${FADE_DURATION}ms ease, opacity ${FADE_DURATION}ms ease`;
      logo.style.transform = "scale(1)";
      logo.style.opacity = "1";

      void logo.getBoundingClientRect();
      requestAnimationFrame(() => {
        logo.style.transform = "scale(1.18)";
        logo.style.opacity = "0";
      });

      setTimeout(() => {
        splash.remove();
        document.documentElement.style.overflow = "";
        document.body.style.overflow = "";
        document.body.style.height = "";
      }, FADE_DURATION + 80);
    };

    const elapsed = performance.now() - startTime;
    const remaining = Math.max(0, MIN_VISIBLE_TIME - elapsed);

    setTimeout(() => {
      requestAnimationFrame(removeSplash);
    }, remaining);
  }, []);

  const logout = React.useCallback(() => {
    logoutMsal();
  }, [logoutMsal]);

  useEffect(() => {
    if (!user?.userId) return;
    const timeoutId = window.setTimeout(() => logoutMsal(), 10 * 60 * 1000);
    return () => window.clearTimeout(timeoutId);
  }, [user?.userId, logoutMsal]);

  return (
    <>
      <GlobalLoading />
      <AppBar position="sticky" elevation={0}>
        <Toolbar
          sx={{
            pt: "env(safe-area-inset-top)",
            minHeight: `calc(56px + env(safe-area-inset-top))`,
          }}
        >
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
