export async function getSasUrl(
  blobName: string,
  contentType: string,
  extraHeaders?: Record<string, string>
): Promise<{ uploadUrl: string; blobUrl: string }> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (extraHeaders) {
    for (const [k, v] of Object.entries(extraHeaders)) {
      if (v) headers[k] = v;
    }
  }
  const res = await fetch("/api/sas", {
    method: "POST",
    headers,
    body: JSON.stringify({ blobName, contentType }),
  });
  if (!res.ok) throw new Error(`SAS request failed: ${res.status}`);
  return res.json();
}

export function toISO(d: Date) {
  return d.toISOString();
}

export function ymd(d: Date) {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return { y, m, day };
}

export function buildBlobName(params: {
  teamId: string;
  userId: string;
  source: "iphone" | "android" | "web";
  ext: string;
  now?: Date;
}) {
  const now = params.now ?? new Date();
  const { y, m, day } = ymd(now);
  const uuid = crypto.randomUUID();
  return `org/${params.teamId}/user/${params.userId}/${y}/${m}/${day}/${uuid}-${params.source}.${params.ext}`;
}

export async function compressIfPossible(
  file: File,
  maxWidth = 2000
): Promise<Blob> {
  const bmp =
    "createImageBitmap" in window
      ? await (window as any).createImageBitmap(file)
      : null;
  if (!bmp) return file;
  const scale = Math.min(1, maxWidth / bmp.width);
  const w = Math.round(bmp.width * scale);
  const h = Math.round(bmp.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return file;
  ctx.drawImage(bmp, 0, 0, w, h);
  const blob: Blob | null = await new Promise((resolve) =>
    canvas.toBlob(
      (b) => resolve(b),
      file.type.includes("png") ? "image/png" : "image/jpeg",
      0.9
    )
  );
  return blob || file;
}

export async function setBlobTags(
  uploadUrlWithSas: string,
  tags: Record<string, string>
) {
  const url = new URL(uploadUrlWithSas);
  url.searchParams.set("comp", "tags");
  const xml = `<Tags>${Object.entries(tags)
    .map(
      ([k, v]) =>
        `<Tag><Key>${encodeXML(k)}</Key><Value>${encodeXML(v)}</Value></Tag>`
    )
    .join("")}</Tags>`;
  const res = await fetch(url.toString(), {
    method: "PUT",
    headers: {
      "Content-Type": "application/xml",
      "x-ms-version": "2021-08-06",
    },
    body: xml,
  });
  if (!res.ok) throw new Error(`Failed to set blob tags: ${res.status}`);
}

function encodeXML(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
