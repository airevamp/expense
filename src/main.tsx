import React from "react";
import { createRoot } from "react-dom/client";
import { CssBaseline, ThemeProvider } from "@mui/material";
import { BrowserRouter } from "react-router-dom";
import { MsalProvider } from "@azure/msal-react";
import { PublicClientApplication } from "@azure/msal-browser";
import App from "./App";
import theme from "./theme";

const msalInstance = new PublicClientApplication({
  auth: {
    clientId: import.meta.env.VITE_ENTRA_CLIENT_ID,
    authority: import.meta.env.VITE_ENTRA_AUTHORITY,
    redirectUri: `${window.location.origin}/`,
    postLogoutRedirectUri: `${window.location.origin}/capture`,
  },
  cache: {
    cacheLocation: "sessionStorage",
    storeAuthStateInCookie: false,
  },
});

(async () => {
  await msalInstance.initialize();

  try {
    const result = await msalInstance.handleRedirectPromise();
    if (result?.account) {
      msalInstance.setActiveAccount(result.account);
    }
  } catch (error) {
    console.error("MSAL redirect handling failed:", error);
  }

  const accounts = msalInstance.getAllAccounts();
  if (accounts.length > 0 && !msalInstance.getActiveAccount()) {
    msalInstance.setActiveAccount(accounts[0]);
  }

  createRoot(document.getElementById("root")!).render(
    <MsalProvider instance={msalInstance}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </ThemeProvider>
    </MsalProvider>,
  );
})();

// Register a tiny service worker for offline shell
if ("serviceWorker" in navigator) {
  window.addEventListener("load", async () => {
    const reg = await navigator.serviceWorker.register("/sw.js");

    // Reload when the new SW takes control
    let reloading = false;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (reloading) return;
      reloading = true;
      window.location.reload();
    });

    // If there's an update waiting already, activate it
    if (reg.waiting) {
      reg.waiting.postMessage({ type: "SKIP_WAITING" });
    }

    // When a new SW is found, wait until it becomes "installed" then activate it
    reg.addEventListener("updatefound", () => {
      const sw = reg.installing;
      if (!sw) return;

      sw.addEventListener("statechange", () => {
        if (sw.state === "installed" && navigator.serviceWorker.controller) {
          reg.waiting?.postMessage({ type: "SKIP_WAITING" });
        }
      });
    });
  });
}
