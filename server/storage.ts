// File storage helpers.
//
// M0.1 status: Manus forge proxy removed. Cloudflare R2 wiring lands in M0.3.
// Until then, these helpers return a structured `STORAGE_NOT_CONFIGURED` response
// so callers can surface a useful message instead of crashing.

export type StorageUnavailable = {
  ok: false;
  error: "STORAGE_NOT_CONFIGURED";
  reason: string;
};

const UNAVAILABLE_REASON =
  "File storage is being migrated to Cloudflare R2 in M0.3. Re-enable after that milestone merges.";

export async function storagePut(
  _relKey: string,
  _data: Buffer | Uint8Array | string,
  _contentType = "application/octet-stream",
): Promise<StorageUnavailable> {
  console.warn("[storage] R2 migration pending — uploads disabled until M0.3");
  return { ok: false, error: "STORAGE_NOT_CONFIGURED", reason: UNAVAILABLE_REASON };
}

export async function storageGet(_relKey: string): Promise<StorageUnavailable> {
  console.warn("[storage] R2 migration pending — downloads disabled until M0.3");
  return { ok: false, error: "STORAGE_NOT_CONFIGURED", reason: UNAVAILABLE_REASON };
}
