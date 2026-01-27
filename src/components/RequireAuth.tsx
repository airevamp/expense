import { useEffect } from "react";
import { Box, Button, CircularProgress, Stack, Typography } from "@mui/material";
import { useIsAuthenticated, useMsal } from "@azure/msal-react";
import { InteractionStatus } from "@azure/msal-browser";

type Prop = { children: React.ReactElement };

export default function RequireAuth({ children }: Prop) {
  const isAuthenticated = useIsAuthenticated();
  const { instance, inProgress } = useMsal();
  const activeAccount = instance.getActiveAccount();
  const accounts = instance.getAllAccounts();

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
      scopes: ["openid", "profile", "email", "User.Read"],
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

  if (!activeAccount) {
    return (
      <Box sx={{ display: "grid", placeItems: "center", minHeight: "40vh" }}>
        <Stack spacing={2} sx={{ width: "100%", maxWidth: 420 }}>
          <Typography variant="subtitle1">Choose an account</Typography>
          {accounts.map((account) => (
            <Button
              key={account.homeAccountId}
              variant="outlined"
              onClick={() => instance.setActiveAccount(account)}
            >
              {account.username || account.homeAccountId}
            </Button>
          ))}
          <Button
            variant="contained"
            onClick={() =>
              instance.loginRedirect({
                scopes: ["openid", "profile", "email", "User.Read"],
                prompt: "select_account",
              })
            }
          >
            Use a different account
          </Button>
        </Stack>
      </Box>
    );
  }

  return children;
}
