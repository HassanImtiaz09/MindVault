// File storage helpers — Cloudflare R2 via S3-compatible API.
//
// M0.3: Real implementation using @aws-sdk/client-s3.
// Falls back to STORAGE_NOT_CONFIGURED when R2 credentials are missing.

import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { ENV } from "./_core/env";

// --- Types ---

export type StorageSuccess<T = undefined> = {
  ok: true;
  data: T;
};

export type StorageUnavailable = {
  ok: false;
  error: "STORAGE_NOT_CONFIGURED";
  reason: string;
};

export type StorageError = {
  ok: false;
  error: "STORAGE_ERROR";
  reason: string;
};

export type StorageResult<T = undefined> =
  | StorageSuccess<T>
  | StorageUnavailable
  | StorageError;

// --- Client singleton ---

let _client: S3Client | null = null;

function getClient(): S3Client | null {
  if (_client) return _client;
  if (!ENV.r2AccountId || !ENV.r2AccessKeyId || !ENV.r2SecretAccessKey) {
    return null;
  }
  _client = new S3Client({
    region: "auto",
    endpoint: ENV.r2Endpoint!,
    credentials: {
      accessKeyId: ENV.r2AccessKeyId,
      secretAccessKey: ENV.r2SecretAccessKey,
    },
  });
  return _client;
}

const UNAVAILABLE_REASON =
  "R2 credentials not configured. Set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY.";

// --- Public API ---

/**
 * Upload an object to the vault bucket.
 * @param relKey - Object key (path) within the bucket, e.g. "users/123/photo.jpg"
 * @param data - File content as Buffer, Uint8Array, or string
 * @param contentType - MIME type (defaults to application/octet-stream)
 * @param bucket - Override bucket name (defaults to R2_BUCKET_VAULT)
 */
export async function storagePut(
  relKey: string,
  data: Buffer | Uint8Array | string,
  contentType = "application/octet-stream",
  bucket?: string,
): Promise<StorageResult> {
  const client = getClient();
  if (!client) {
    console.warn("[storage] R2 not configured — upload skipped");
    return { ok: false, error: "STORAGE_NOT_CONFIGURED", reason: UNAVAILABLE_REASON };
  }

  try {
    await client.send(
      new PutObjectCommand({
        Bucket: bucket ?? ENV.r2BucketVault,
        Key: relKey,
        Body: typeof data === "string" ? Buffer.from(data) : data,
        ContentType: contentType,
      }),
    );
    return { ok: true, data: undefined };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[storage] PUT failed for key="${relKey}":`, message);
    return { ok: false, error: "STORAGE_ERROR", reason: message };
  }
}

/**
 * Download an object from the vault bucket.
 * @param relKey - Object key within the bucket
 * @param bucket - Override bucket name (defaults to R2_BUCKET_VAULT)
 * @returns The object body as a Buffer
 */
export async function storageGet(
  relKey: string,
  bucket?: string,
): Promise<StorageResult<Buffer>> {
  const client = getClient();
  if (!client) {
    console.warn("[storage] R2 not configured — download skipped");
    return { ok: false, error: "STORAGE_NOT_CONFIGURED", reason: UNAVAILABLE_REASON };
  }

  try {
    const response = await client.send(
      new GetObjectCommand({
        Bucket: bucket ?? ENV.r2BucketVault,
        Key: relKey,
      }),
    );

    const stream = response.Body;
    if (!stream) {
      return { ok: false, error: "STORAGE_ERROR", reason: "Empty response body" };
    }

    // Convert readable stream to Buffer
    const chunks: Uint8Array[] = [];
    for await (const chunk of stream as AsyncIterable<Uint8Array>) {
      chunks.push(chunk);
    }
    return { ok: true, data: Buffer.concat(chunks) };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[storage] GET failed for key="${relKey}":`, message);
    return { ok: false, error: "STORAGE_ERROR", reason: message };
  }
}

/**
 * Delete an object from the vault bucket.
 * @param relKey - Object key within the bucket
 * @param bucket - Override bucket name (defaults to R2_BUCKET_VAULT)
 */
export async function storageDelete(
  relKey: string,
  bucket?: string,
): Promise<StorageResult> {
  const client = getClient();
  if (!client) {
    return { ok: false, error: "STORAGE_NOT_CONFIGURED", reason: UNAVAILABLE_REASON };
  }

  try {
    await client.send(
      new DeleteObjectCommand({
        Bucket: bucket ?? ENV.r2BucketVault,
        Key: relKey,
      }),
    );
    return { ok: true, data: undefined };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[storage] DELETE failed for key="${relKey}":`, message);
    return { ok: false, error: "STORAGE_ERROR", reason: message };
  }
}

/**
 * Check if an object exists in the vault bucket.
 * @param relKey - Object key within the bucket
 * @param bucket - Override bucket name (defaults to R2_BUCKET_VAULT)
 */
export async function storageExists(
  relKey: string,
  bucket?: string,
): Promise<StorageResult<boolean>> {
  const client = getClient();
  if (!client) {
    return { ok: false, error: "STORAGE_NOT_CONFIGURED", reason: UNAVAILABLE_REASON };
  }

  try {
    await client.send(
      new HeadObjectCommand({
        Bucket: bucket ?? ENV.r2BucketVault,
        Key: relKey,
      }),
    );
    return { ok: true, data: true };
  } catch (err: any) {
    if (err?.name === "NotFound" || err?.$metadata?.httpStatusCode === 404) {
      return { ok: true, data: false };
    }
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, error: "STORAGE_ERROR", reason: message };
  }
}

/**
 * Generate a pre-signed URL for direct upload (PUT) or download (GET).
 * @param relKey - Object key within the bucket
 * @param operation - "put" for upload, "get" for download
 * @param expiresIn - URL validity in seconds (default 3600 = 1 hour)
 * @param contentType - Required for PUT operations
 * @param bucket - Override bucket name (defaults to R2_BUCKET_VAULT)
 */
export async function storagePresignedUrl(
  relKey: string,
  operation: "put" | "get",
  expiresIn = 3600,
  contentType?: string,
  bucket?: string,
): Promise<StorageResult<string>> {
  const client = getClient();
  if (!client) {
    return { ok: false, error: "STORAGE_NOT_CONFIGURED", reason: UNAVAILABLE_REASON };
  }

  try {
    const command =
      operation === "put"
        ? new PutObjectCommand({
            Bucket: bucket ?? ENV.r2BucketVault,
            Key: relKey,
            ContentType: contentType,
          })
        : new GetObjectCommand({
            Bucket: bucket ?? ENV.r2BucketVault,
            Key: relKey,
          });

    const url = await getSignedUrl(client, command, { expiresIn });
    return { ok: true, data: url };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[storage] presign failed for key="${relKey}":`, message);
    return { ok: false, error: "STORAGE_ERROR", reason: message };
  }
}
