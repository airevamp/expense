import { useEffect } from "react";
import { useIsAuthenticated, useMsal } from "@azure/msal-react";
import { InteractionStatus } from "@azure/msal-browser";
import { Box, CircularProgress } from "@mui/material";

type Prop = { children: React.ReactElement };

export default function RequireAuth({ children }: Prop) {
  const isAuthenticated = useIsAuthenticated();
  const { instance, inProgress } = useMsal();

  const msalIsBusy = inProgress !== InteractionStatus.None;

  useEffect(() => {
    if (msalIsBusy || isAuthenticated) return;

    // ✅ If MSAL already has an account in cache, use it (don’t re-login)
    const cached = instance.getAllAccounts();
    if (cached.length > 0) {
      instance.setActiveAccount(instance.getActiveAccount() ?? cached[0]);
      return;
    }

    // ✅ Only if truly no cached accounts, start login
    instance.loginRedirect({
      scopes: ["openid", "profile", "email"],
      prompt: "select_account",
    });
  }, [isAuthenticated, msalIsBusy, instance]);

  if (!isAuthenticated) {
    return (
      <Box sx={{ display: "grid", placeItems: "center", minHeight: "40vh" }}>
        <CircularProgress />
      </Box>
    );
  }

  return children;
}
