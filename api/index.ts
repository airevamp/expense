import {
  app,
  HttpRequest,
  HttpResponseInit,
  InvocationContext,
} from "@azure/functions";
import {
  BlobSASPermissions,
  BlobServiceClient,
  SASProtocol,
  StorageSharedKeyCredential,
  generateBlobSASQueryParameters,
} from "@azure/storage-blob";
import { buildBlobSasUrl } from "./shared/storage.js";

type CallerIdentity = {
  teamId?: string;
  userId?: string;
};

function parseBlobNamePrefix(blobName: string) {
  const parts = blobName.split("/");
  if (parts.length < 8) return null;
  const [orgMarker, teamId, userMarker, userId, y, m, d] = parts;
  if (!orgMarker || userMarker !== "user") return null;
  if (!teamId || !userId) return null;
  if (!isValidDateParts(y, m, d)) return null;
  return { org: orgMarker, teamId, userId, y, m, d };
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
    const orgHeader = req.headers.get("x-org")?.trim();
    if (orgHeader && prefix.org !== orgHeader) {
      return { status: 403, jsonBody: { error: "Forbidden" } };
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
    const container = "receipts";
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

export async function receiptsHandler(
  req: HttpRequest,
  ctx: InvocationContext,
): Promise<HttpResponseInit> {
  try {
    const caller = getCallerIdentity(req);
    if (!caller?.teamId || !caller?.userId) {
      return { status: 401, jsonBody: { error: "Unauthorized" } };
    }

    const account = process.env["STORAGE_ACCOUNT_NAME"]!;
    const accountKey = process.env["STORAGE_ACCOUNT_KEY"]!;
    const container = "receipts";
    const expiry = Number(process.env["SAS_EXPIRY_MINUTES"] || "5");

    if (!account || !accountKey) {
      return {
        status: 500,
        jsonBody: { error: "Storage credentials not configured" },
      };
    }

    const credential = new StorageSharedKeyCredential(account, accountKey);
    const service = new BlobServiceClient(
      `https://${account}.blob.core.windows.net`,
      credential,
    );
    const containerClient = service.getContainerClient(container);
    const org = req.headers.get("x-org")?.trim() || "org";
    const prefix = `${org}/${caller.teamId}/user/${caller.userId}/`;
    const startsOn = new Date(Date.now() - 60 * 1000);
    const expiresOn = new Date(Date.now() + expiry * 60 * 1000);

    const items: Array<{
      name: string;
      url: string;
      deleteUrl: string;
    }> = [];
    for await (const blob of containerClient.listBlobsFlat({ prefix })) {
      const blobName = blob.name;
      const sas = generateBlobSASQueryParameters(
        {
          containerName: container,
          blobName,
          permissions: BlobSASPermissions.parse("r"),
          startsOn,
          expiresOn,
          protocol: SASProtocol.Https,
        },
        credential,
      ).toString();
      const encodedPath = blobName
        .split("/")
        .map((segment) => encodeURIComponent(segment))
        .join("/");
      const base = `https://${account}.blob.core.windows.net/${container}/${encodedPath}`;
      items.push({
        name: blobName.split("/").pop() ?? blobName,
        url: `${base}?${sas}`,
        deleteUrl: `/api/receipts?blobName=${encodeURIComponent(blobName)}`,
      });
    }

    return { status: 200, jsonBody: items };
  } catch (err: any) {
    ctx.error("receipts error", err);
    return { status: 500, jsonBody: { error: err?.message ?? "server error" } };
  }
}

export async function deleteReceiptHandler(
  req: HttpRequest,
  ctx: InvocationContext,
): Promise<HttpResponseInit> {
  try {
    const queryBlobName = req.query.get("blobName");
    let bodyBlobName: string | undefined;
    if (!queryBlobName) {
      try {
        const body = (await req.json()) as { blobName?: string };
        bodyBlobName = body?.blobName;
      } catch {
        // Ignore parse errors when no body is sent.
      }
    }
    const blobName = String(bodyBlobName || queryBlobName || "").trim();
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
    const orgHeader = req.headers.get("x-org")?.trim();
    if (orgHeader && prefix.org !== orgHeader) {
      return { status: 403, jsonBody: { error: "Forbidden" } };
    }

    const account = process.env["STORAGE_ACCOUNT_NAME"]!;
    const accountKey = process.env["STORAGE_ACCOUNT_KEY"]!;
    const container = "receipts";

    if (!account || !accountKey) {
      return {
        status: 500,
        jsonBody: { error: "Storage credentials not configured" },
      };
    }

    const credential = new StorageSharedKeyCredential(account, accountKey);
    const service = new BlobServiceClient(
      `https://${account}.blob.core.windows.net`,
      credential,
    );
    const containerClient = service.getContainerClient(container);
    const blobClient = containerClient.getBlobClient(blobName);
    await blobClient.deleteIfExists();
    return { status: 200, jsonBody: { ok: true } };
  } catch (err: any) {
    ctx.error("delete receipts error", err);
    return { status: 500, jsonBody: { error: err?.message ?? "server error" } };
  }
}

app.http("getSas", {
  route: "sas",
  methods: ["POST"],
  authLevel: "anonymous",
  handler: sasHandler,
});

app.http("getReceipts", {
  route: "receipts",
  methods: ["GET"],
  authLevel: "anonymous",
  handler: receiptsHandler,
});

app.http("deleteReceipt", {
  route: "receipts",
  methods: ["DELETE"],
  authLevel: "anonymous",
  handler: deleteReceiptHandler,
});
