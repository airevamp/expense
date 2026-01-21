import { useEffect, useState } from "react";

// In production, wire up Microsoft Entra External ID (Customers) + Google federation.
// For SWA, you can read user info from /.auth/me or your own auth context.
type ClientClaim = {
  typ?: string;
  type?: string;
  val?: string;
  value?: string;
};
type ClientPrincipal = {
  userId?: string;
  userDetails?: string;
  userRoles?: string[];
  claims?: ClientClaim[];
};
type AuthUser = { teamId: string; userId: string; userName?: string };

let cachedUser: AuthUser | null = null;
let inFlight: Promise<AuthUser | null> | null = null;

function claimValue(principal: ClientPrincipal, keys: string[]) {
  const claims = principal.claims ?? [];
  for (const key of keys) {
    const match = claims.find(
      (c) => (c.typ ?? c.type ?? "").toLowerCase() === key.toLowerCase(),
    );
    const val = match?.val ?? match?.value;
    if (val) return String(val);
  }
  return null;
}

function extractTeamId(principal: ClientPrincipal) {
  const teamFromClaim = claimValue(principal, [
    "teamid",
    "team_id",
    "tenantid",
    "tid",
    "http://schemas.microsoft.com/identity/claims/tenantid",
    "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/tenantid",
  ]);
  if (teamFromClaim) return teamFromClaim;
  const teamRole = principal.userRoles?.find(
    (role) => role.startsWith("team:") || role.startsWith("org:"),
  );
  if (teamRole) return teamRole.split(":")[1] || teamRole;
  return principal.userId || principal.userDetails || null;
}

function extractUserName(principal: ClientPrincipal) {
  const nameFromClaim = claimValue(principal, [
    "name",
    "firstname",
    "preferred_username",
    "upn",
    "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name",
  ]);
  if (nameFromClaim) return nameFromClaim;
  return principal.userDetails || principal.userId || null;
}

function parseAuthResponse(payload: any): AuthUser | null {
  const raw = Array.isArray(payload) ? payload[0] : payload;
  const principal: ClientPrincipal | undefined = raw?.clientPrincipal ?? raw;
  console.log("Auth principal:", principal);
  if (!principal?.userId) return null;
  const teamId = extractTeamId(principal);
  if (!teamId) return null;
  const userName = extractUserName(principal) || undefined;
  return { teamId, userId: principal.userId, userName };
}

async function loadUser(): Promise<AuthUser | null> {
  if (cachedUser) return cachedUser;
  if (!inFlight) {
    inFlight = fetch("/.auth/me", { credentials: "include" })
      .then((res) => {
        return res.ok ? res.json() : null;
      })
      .then(parseAuthResponse)
      .catch(() => null)
      .finally(() => {
        inFlight = null;
      });
  }
  const user = await inFlight;
  if (user) cachedUser = user;
  return user;
}

export function useUser() {
  const [user, setUser] = useState<AuthUser | null>(() => cachedUser);
  const [loading, setLoading] = useState<boolean>(() => !cachedUser);

  useEffect(() => {
    let active = true;
    if (!cachedUser) {
      void loadUser().then((loaded) => {
        if (!active) return;
        if (loaded) setUser(loaded);
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
    return () => {
      active = false;
    };
  }, []);

  return { user, loading };
}
