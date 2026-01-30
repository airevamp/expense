import { Box, CircularProgress } from "@mui/material";
import { useIsAuthenticated, useMsal } from "@azure/msal-react";
import { InteractionStatus } from "@azure/msal-browser";
import { Navigate, useLocation } from "react-router-dom";

type Prop = { children: React.ReactElement };

export default function RequireAuth({ children }: Prop) {
  const isAuthenticated = useIsAuthenticated();
  const { instance, inProgress } = useMsal();
  const activeAccount = instance.getActiveAccount();
  const location = useLocation();

  const msalIsBusy = inProgress !== InteractionStatus.None;

  if (!isAuthenticated) {
    if (msalIsBusy) {
      return (
        <Box sx={{ display: "grid", placeItems: "center", minHeight: "40vh" }}>
          <CircularProgress />
        </Box>
      );
    }
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (!activeAccount) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return children;
}
