// Cloudflare Stream integration scaffold.
//
// M0.3: Provides helpers for video upload (TUS + direct creator upload),
// playback URL generation, and webhook signature verification.
// Full implementation lands when video memory type is wired end-to-end.

import { ENV } from "./env";

// --- Types ---

export interface StreamUploadResult {
  ok: true;
  uid: string;
  playbackUrl: string;
  thumbnailUrl: string;
}

export interface StreamUnavailable {
  ok: false;
  error: "STREAM_NOT_CONFIGURED";
  reason: string;
}

export interface StreamError {
  ok: false;
  error: "STREAM_ERROR";
  reason: string;
}

export type StreamResult = StreamUploadResult | StreamUnavailable | StreamError;

// --- Helpers ---

function isConfigured(): boolean {
  return !!(ENV.cfStreamApiToken && ENV.cfStreamAccountId);
}

const UNAVAILABLE_REASON =
  "Cloudflare Stream credentials not configured. Set CF_STREAM_API_TOKEN and CF_STREAM_ACCOUNT_ID.";

/**
 * Request a direct creator upload URL from Cloudflare Stream.
 * The client uploads directly to Stream via TUS protocol using the returned URL.
 *
 * @param maxDurationSeconds - Maximum allowed video duration (default: 300 = 5 min)
 * @param meta - Optional metadata to attach to the video
 */
export async function getDirectUploadUrl(
  maxDurationSeconds = 300,
  meta?: Record<string, string>,
): Promise<StreamResult | { ok: true; uploadUrl: string; uid: string }> {
  if (!isConfigured()) {
    return { ok: false, error: "STREAM_NOT_CONFIGURED", reason: UNAVAILABLE_REASON };
  }

  try {
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${ENV.cfStreamAccountId}/stream/direct_upload`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${ENV.cfStreamApiToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          maxDurationSeconds,
          meta: meta ?? {},
        }),
      },
    );

    if (!response.ok) {
      const text = await response.text();
      return { ok: false, error: "STREAM_ERROR", reason: `HTTP ${response.status}: ${text}` };
    }

    const json = (await response.json()) as any;
    const result = json.result;
    return {
      ok: true,
      uploadUrl: result.uploadURL,
      uid: result.uid,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, error: "STREAM_ERROR", reason: message };
  }
}

/**
 * Get the playback URL for a video by its Stream UID.
 * Uses the customer subdomain if configured, otherwise falls back to the default.
 */
export function getPlaybackUrl(uid: string): string {
  if (ENV.cfStreamCustomerSubdomain) {
    return `https://${ENV.cfStreamCustomerSubdomain}/${uid}/manifest/video.m3u8`;
  }
  // Fallback to iframe embed URL
  return `https://customer-${ENV.cfStreamAccountId}.cloudflarestream.com/${uid}/manifest/video.m3u8`;
}

/**
 * Get the thumbnail URL for a video by its Stream UID.
 */
export function getThumbnailUrl(uid: string, time = "1s"): string {
  if (ENV.cfStreamCustomerSubdomain) {
    return `https://${ENV.cfStreamCustomerSubdomain}/${uid}/thumbnails/thumbnail.jpg?time=${time}`;
  }
  return `https://customer-${ENV.cfStreamAccountId}.cloudflarestream.com/${uid}/thumbnails/thumbnail.jpg?time=${time}`;
}

/**
 * Delete a video from Cloudflare Stream.
 */
export async function deleteVideo(uid: string): Promise<{ ok: boolean; error?: string }> {
  if (!isConfigured()) {
    return { ok: false, error: UNAVAILABLE_REASON };
  }

  try {
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${ENV.cfStreamAccountId}/stream/${uid}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${ENV.cfStreamApiToken}`,
        },
      },
    );

    if (!response.ok && response.status !== 404) {
      const text = await response.text();
      return { ok: false, error: `HTTP ${response.status}: ${text}` };
    }

    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, error: message };
  }
}

/**
 * Verify a Cloudflare Stream webhook signature.
 * Used to validate that incoming webhook requests are genuinely from Cloudflare.
 *
 * @param body - Raw request body as string
 * @param signature - Value of the `Webhook-Signature` header
 * @param secret - The webhook signing secret from Stream dashboard
 */
export function verifyWebhookSignature(
  _body: string,
  _signature: string,
  _secret: string,
): boolean {
  // TODO: Implement HMAC-SHA256 verification when webhooks are wired
  console.warn("[stream] Webhook signature verification not yet implemented");
  return false;
}
