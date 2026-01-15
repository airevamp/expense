// In production, wire up Microsoft Entra External ID (Customers) + Google federation.
// For SWA, you can read user info from /.auth/me or your own auth context.
export function useUser() {
  // TODO: replace with real auth; return { teamId, userId }
  return { teamId: "acme", userId: "user-123" };
}
