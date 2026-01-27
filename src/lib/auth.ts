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
  signal?: AbortSignal,
): Promise<string | null> {
  const res = await fetch(
    "https://graph.microsoft.com/v1.0/organization?$select=id,displayName",
    {
      headers: { Authorization: `Bearer ${accessToken}` },
      signal,
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
    const cacheKey = account
      ? `tenantDisplayName:${account.homeAccountId}`
      : "tenantDisplayName:unknown";
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

    const cachedCompany = sessionStorage.getItem(cacheKey);
    if (cachedCompany) {
      setUser((prev) => (prev ? { ...prev, company: cachedCompany } : prev));
      return;
    }

    let active = true;
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 6000);
    (async () => {
      try {
        const result = await instance.acquireTokenSilent({
          scopes: ["User.Read"],
          account,
        });
        const tenantName = await fetchTenantDisplayName(
          result.accessToken,
          controller.signal,
        );
        if (!tenantName || !active) return;
        sessionStorage.setItem(cacheKey, tenantName);
        setUser((prev) => (prev ? { ...prev, company: tenantName } : prev));
      } catch {
        // Ignore graph errors; company remains unset.
      }
    })();
    return () => {
      window.clearTimeout(timeoutId);
      controller.abort();
      active = false;
    };
  }, [account, instance]);

  const login = (redirectStartPage?: string) =>
    instance.loginRedirect({
      scopes: ["openid", "profile", "email", "User.Read"],
      prompt: "select_account",
      redirectStartPage,
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
