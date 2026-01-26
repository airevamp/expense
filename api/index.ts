import {
  app,
  HttpRequest,
  HttpResponseInit,
  InvocationContext,
} from "@azure/functions";
import { buildBlobSasUrl } from "./shared/storage.js";

type CallerIdentity = {
  teamId?: string;
  userId?: string;
};

function parseBlobNamePrefix(blobName: string) {
  const parts = blobName.split("/");
  if (parts.length < 8) return null;
  const [orgMarker, teamId, userMarker, userId, y, m, d] = parts;
  if (orgMarker !== "org" || userMarker !== "user") return null;
  if (!teamId || !userId) return null;
  if (!isValidDateParts(y, m, d)) return null;
  return { teamId, userId, y, m, d };
}

function isValidDateParts(y: string, m: string, d: string) {
  const year = Number(y);
  const month = Number(m);
  const day = Number(d);
  if (!Number.isInteger(year) || year < 2000 || year > 2100) return false;
  if (!Number.isInteger(month) || month < 1 || month > 12) return false;
  if (!Number.isInteger(day) || day < 1 || day > 31) return false;
  const dt = new Date(Date.UTC(year, month - 1, day));
  return (
    dt.getUTCFullYear() === year &&
    dt.getUTCMonth() === month - 1 &&
    dt.getUTCDate() === day
  );
}

function getCallerIdentity(req: HttpRequest): CallerIdentity | null {
  const teamHeader = req.headers.get("x-team-id")?.trim();
  const userHeader = req.headers.get("x-user-id")?.trim();
  if (teamHeader || userHeader) {
    return { teamId: teamHeader, userId: userHeader };
  }

  const principal = req.headers.get("x-ms-client-principal");
  if (!principal) return null;
  try {
    const decoded = Buffer.from(principal, "base64").toString("utf8");
    const data = JSON.parse(decoded) as {
      userId?: string;
      tenantId?: string;
      claims?: Array<{ typ?: string; val?: string }>;
    };
    const claims = Array.isArray(data.claims) ? data.claims : [];
    const claimValue = (typ: string) => claims.find((c) => c.typ === typ)?.val;
    return {
      userId:
        data.userId ??
        claimValue("oid") ??
        claimValue(
          "http://schemas.microsoft.com/identity/claims/objectidentifier",
        ),
      teamId:
        data.tenantId ??
        claimValue("tid") ??
        claimValue("http://schemas.microsoft.com/identity/claims/tenantid"),
    };
  } catch {
    return null;
  }
}

export async function sasHandler(
  req: HttpRequest,
  ctx: InvocationContext,
): Promise<HttpResponseInit> {
  try {
    const body = (await req.json()) as {
      blobName?: string;
      contentType?: string;
    };
    const blobName = String(body?.blobName || "").trim();
    const contentType = String(body?.contentType || "image/jpeg");

    if (!blobName) {
      return { status: 400, jsonBody: { error: "blobName is required" } };
    }

    const prefix = parseBlobNamePrefix(blobName);
    if (!prefix) {
      return { status: 400, jsonBody: { error: "Invalid blobName format" } };
    }
    const caller = getCallerIdentity(req);
    if (!caller?.teamId || !caller?.userId) {
      return { status: 401, jsonBody: { error: "Unauthorized" } };
    }
    if (caller.teamId !== prefix.teamId || caller.userId !== prefix.userId) {
      return { status: 403, jsonBody: { error: "Forbidden" } };
    }
    const account = process.env["STORAGE_ACCOUNT_NAME"]!;
    const accountKey = process.env["STORAGE_ACCOUNT_KEY"]!;
    const container = process.env["CONTAINER_NAME"] || "receipts";
    const expiry = Number(process.env["SAS_EXPIRY_MINUTES"] || "5");

    if (!account || !accountKey || !container) {
      return {
        status: 500,
        jsonBody: { error: "Storage credentials or container not configured" },
      };
    }

    const sas = buildBlobSasUrl({
      account,
      accountKey,
      container,
      blobName,
      contentType,
      expiryMinutes: expiry,
    });
    return { status: 200, jsonBody: sas };
  } catch (err: any) {
    ctx.error("sas error", err);
    return { status: 500, jsonBody: { error: err?.message ?? "server error" } };
  }
}

app.http("getSas", {
  route: "sas",
  methods: ["POST"],
  authLevel: "anonymous",
  handler: sasHandler,
});
