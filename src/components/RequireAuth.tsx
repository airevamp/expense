import React from "react";
import { useIsAuthenticated, useMsal } from "@azure/msal-react";
import { Box, CircularProgress } from "@mui/material";

type Prop = {
  children: React.ReactElement;
};

export default function RequireAuth({ children }: Prop) {
  const isAuthenticated = useIsAuthenticated();
  const { instance, inProgress } = useMsal();

  const msalIsBusy = inProgress !== "none";

  React.useEffect(() => {
    if (!isAuthenticated && !msalIsBusy) {
      instance.loginRedirect({
        scopes: ["openid", "profile", "email"],
      });
    }
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
