/**
 * DocVault Edge Cache Worker
 *
 * Serves R2 objects at the edge with caching, access control, and
 * on-the-fly image transformations (future).
 *
 * Routes:
 *   GET /file/:key*  → Serve object from VAULT_BUCKET with cache headers
 *   GET /thumb/:key* → Serve thumbnail (future: resize on-the-fly)
 *   GET /health      → Health check
 */

export interface Env {
  VAULT_BUCKET: R2Bucket;
  CACHE_BUCKET: R2Bucket;
  ENVIRONMENT: string;
}

const CACHE_CONTROL_DEFAULT = "public, max-age=3600, s-maxage=86400";
const CACHE_CONTROL_IMMUTABLE = "public, max-age=31536000, immutable";

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    // Health check
    if (path === "/health") {
      return new Response(
        JSON.stringify({ ok: true, env: env.ENVIRONMENT, ts: Date.now() }),
        { headers: { "Content-Type": "application/json" } },
      );
    }

    // Serve file from vault bucket
    if (path.startsWith("/file/")) {
      const key = decodeURIComponent(path.slice("/file/".length));
      return serveObject(env.VAULT_BUCKET, key, request);
    }

    // Serve from cache bucket (thumbnails, processed assets)
    if (path.startsWith("/cache/")) {
      const key = decodeURIComponent(path.slice("/cache/".length));
      return serveObject(env.CACHE_BUCKET, key, request, CACHE_CONTROL_IMMUTABLE);
    }

    return new Response("Not Found", { status: 404 });
  },
};

async function serveObject(
  bucket: R2Bucket,
  key: string,
  request: Request,
  cacheControl = CACHE_CONTROL_DEFAULT,
): Promise<Response> {
  // Handle conditional requests (If-None-Match)
  const ifNoneMatch = request.headers.get("If-None-Match");

  const object = await bucket.get(key, {
    onlyIf: ifNoneMatch ? { etagDoesNotMatch: ifNoneMatch } : undefined,
  });

  if (!object) {
    return new Response("Not Found", { status: 404 });
  }

  // 304 Not Modified
  if (!("body" in object) || !object.body) {
    return new Response(null, {
      status: 304,
      headers: {
        ETag: object.etag,
        "Cache-Control": cacheControl,
      },
    });
  }

  const headers = new Headers();
  headers.set("ETag", object.etag);
  headers.set("Cache-Control", cacheControl);
  headers.set("Content-Type", object.httpMetadata?.contentType ?? "application/octet-stream");

  if (object.httpMetadata?.contentDisposition) {
    headers.set("Content-Disposition", object.httpMetadata.contentDisposition);
  }

  if (object.size) {
    headers.set("Content-Length", String(object.size));
  }

  // Security headers
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("X-Frame-Options", "DENY");

  return new Response(object.body, { headers });
}
