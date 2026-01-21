import {
  StorageSharedKeyCredential,
  BlobSASPermissions,
  SASProtocol,
  generateBlobSASQueryParameters,
} from "@azure/storage-blob";

export function buildBlobSasUrl(params: {
  account: string;
  accountKey: string;
  container: string;
  blobName: string;
  contentType: string;
  expiryMinutes?: number;
}) {
  const { account, accountKey, container, blobName, contentType } = params;
  const expiresOn = new Date(
    Date.now() + (params.expiryMinutes ?? 5) * 60 * 1000
  );
  const startsOn = new Date(Date.now() - 60 * 1000); // 1 minute clock skew

  const perms = BlobSASPermissions.parse("cwt"); // create, write, set tags
  const sas = generateBlobSASQueryParameters(
    {
      containerName: container,
      blobName,
      permissions: perms,
      startsOn,
      expiresOn,
      contentType,
      protocol: SASProtocol.Https,
    },
    new StorageSharedKeyCredential(account, accountKey)
  ).toString();

  const base = `https://${account}.blob.core.windows.net/${container}/${encodeURI(
    blobName
  )}`;
  return { uploadUrl: `${base}?${sas}`, blobUrl: base };
}
