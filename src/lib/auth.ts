import { useEffect, useState } from "react";
import { useMsal } from "@azure/msal-react";

type AuthUser = {
  userId: string;
  userName?: string;
  tenantId?: string;
  company?: string;
};

async function fetchTenantDisplayName(
  accessToken: string,
): Promise<string | null> {
  const res = await fetch(
    "https://graph.microsoft.com/v1.0/organization?$select=id,displayName,verifiedDomains",
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    },
  );
  if (!res.ok) return null;
  const data = (await res.json()) as {
    value?: Array<{ displayName?: string }>;
  };
  return data.value?.[0]?.displayName ?? null;
}

export function useUser() {
  const { instance, inProgress } = useMsal();
  const account = instance.getActiveAccount();
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

    let active = true;
    (async () => {
      try {
        const result = await instance.acquireTokenSilent({
          scopes: ["User.Read"],
          account,
        });
        const tenantName = await fetchTenantDisplayName(result.accessToken);
        if (!tenantName || !active) return;
        setUser((prev) => (prev ? { ...prev, company: tenantName } : prev));
      } catch {
        // Ignore graph errors; company remains unset.
      }
    })();
    return () => {
      active = false;
    };
  }, [account, instance]);

  const login = () =>
    instance.loginRedirect({
      scopes: ["openid", "profile", "email", "User.Read"],
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
