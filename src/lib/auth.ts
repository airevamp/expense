import { useEffect, useMemo, useState } from "react";
import { useMsal } from "@azure/msal-react";
import type { AccountInfo } from "@azure/msal-browser";

type AuthUser = {
  userId: string;
  userName?: string;
  tenantId?: string;
};

function pickAccount(accounts: AccountInfo[]) {
  return accounts[0] ?? null;
}

export function useUser() {
  const { instance, accounts, inProgress } = useMsal();
  const account = useMemo(() => pickAccount(accounts), [accounts]);
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    if (!account) {
      setUser(null);
      return;
    }

    const claims: any = account.idTokenClaims ?? {};
    const tenantId: string | undefined = claims.tid;
    const objectId: string | undefined = claims.oid;

    setUser({
      userId: objectId ?? account.homeAccountId,
      userName: claims.name ?? claims.preferred_username ?? account.username,
      tenantId,
    });
  }, [account]);

  const login = () =>
    instance.loginRedirect({
      scopes: ["openid", "profile", "email"],
      prompt: "select_account",
    });

  const logout = () =>
    instance.logoutRedirect({
      postLogoutRedirectUri: `${window.location.origin}/capture`,
    });

  return {
    user,
    loading: inProgress !== "none",
    login,
    logout,
  };
}
