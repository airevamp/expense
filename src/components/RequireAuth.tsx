import React from "react";
import { useIsAuthenticated, useMsal } from "@azure/msal-react";

type Prop = {
  children: React.ReactElement;
};

export default function RequireAuth({ children }: Prop) {
  const isAuthenticated = useIsAuthenticated();
  const { instance, inProgress } = useMsal();

  React.useEffect(() => {
    if (!isAuthenticated && inProgress === "none") {
      instance.loginRedirect({
        scopes: ["openid", "profile", "email"],
      });
    }
  }, [isAuthenticated, inProgress, instance]);

  return children;
}
