import {
  app,
  HttpRequest,
  HttpResponseInit,
  InvocationContext,
} from "@azure/functions";
import { buildBlobSasUrl } from "../shared/storage.js";

export async function sasHandler(
  req: HttpRequest,
  ctx: InvocationContext
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

    // TODO: validate blobName prefix (teamId/userId/date) against the caller's identity once auth is wired.
    const account = process.env["STORAGE_ACCOUNT_NAME"]!;
    const accountKey = process.env["STORAGE_ACCOUNT_KEY"]!;
    const container = process.env["CONTAINER_NAME"] || "receipts";
    const expiry = Number(process.env["SAS_EXPIRY_MINUTES"] || "5");

    if (!account || !accountKey) {
      return {
        status: 500,
        jsonBody: { error: "Storage credentials not configured" },
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
