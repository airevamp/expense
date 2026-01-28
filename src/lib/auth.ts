import { useEffect, useState } from "react";
import { useMsal } from "@azure/msal-react";
import { useLoading } from "../components/LoadingProvider";

type AuthUser = {
  userId: string;
  userName?: string;
  tenantId?: string;
  company?: string;
};

const tenantNameCache = new Map<string, string>();
const tenantNamePromise = new Map<string, Promise<string | null>>();

async function fetchTenantDisplayName(
  accessToken: string,
): Promise<string | null> {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), 6000);
  const res = await fetch(
    "https://graph.microsoft.com/v1.0/organization?$select=id,displayName",
    {
      headers: { Authorization: `Bearer ${accessToken}` },
      signal: controller.signal,
    },
  );
  window.clearTimeout(timeoutId);
  if (!res.ok) return null;
  const data = (await res.json()) as {
    value?: Array<{ displayName?: string }>;
  };
  return data.value?.[0]?.displayName ?? null;
}

export function useUser() {
  const { instance, inProgress } = useMsal();
  const account = instance.getActiveAccount();
  const accountId = account?.homeAccountId;
  const [user, setUser] = useState<AuthUser | null>(null);
  const { start, stop } = useLoading();

  useEffect(() => {
    const currentAccount = instance.getActiveAccount();
    const cacheKey = currentAccount
      ? `tenantDisplayName:${currentAccount.homeAccountId}`
      : "tenantDisplayName:unknown";
    if (!currentAccount) {
      setUser(null);
      return;
    }

    const claims: any = currentAccount.idTokenClaims ?? {};
    const tenantId: string | undefined = claims.tid;
    const objectId: string | undefined = claims.oid;
    setUser({
      userId: objectId ?? currentAccount.homeAccountId,
      userName:
        claims.name ?? claims.preferred_username ?? currentAccount.username,
      tenantId,
    });

    const memoryCached = tenantNameCache.get(cacheKey);
    if (memoryCached) {
      setUser((prev) => (prev ? { ...prev, company: memoryCached } : prev));
      return;
    }

    const cachedCompany = sessionStorage.getItem(cacheKey);
    if (cachedCompany) {
      tenantNameCache.set(cacheKey, cachedCompany);
      setUser((prev) => (prev ? { ...prev, company: cachedCompany } : prev));
      return;
    }

    let active = true;
    let inflight = tenantNamePromise.get(cacheKey);
    if (!inflight) {
      inflight = (async () => {
        try {
          start();
          const result = await instance.acquireTokenSilent({
            scopes: ["User.Read"],
            account: currentAccount,
          });
          return await fetchTenantDisplayName(result.accessToken);
        } catch {
          return null;
        } finally {
          stop();
        }
      })();
      tenantNamePromise.set(cacheKey, inflight);
    }

    void inflight
      .then((tenantName) => {
        if (!tenantName || !active) return;
        tenantNameCache.set(cacheKey, tenantName);
        sessionStorage.setItem(cacheKey, tenantName);
        setUser((prev) => (prev ? { ...prev, company: tenantName } : prev));
      })
      .finally(() => {
        tenantNamePromise.delete(cacheKey);
      });
    return () => {
      active = false;
    };
  }, [accountId, instance, start, stop]);

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
