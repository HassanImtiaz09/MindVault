import { describe, it, expect } from "vitest";

describe("Inngest Integration", () => {
  describe("client and function registration", () => {
    it("should export the inngest client with correct id", async () => {
      const { inngest } = await import("../../server/_core/inngest");
      expect(inngest).toBeDefined();
      expect(inngest.id).toBe("docvault");
    });

    it("should export the helloWorld function", async () => {
      const { helloWorld } = await import("../../server/_core/inngest");
      expect(helloWorld).toBeDefined();
    });

    it("should export inngestFunctions array with at least one function", async () => {
      const { inngestFunctions } = await import("../../server/_core/inngest");
      expect(Array.isArray(inngestFunctions)).toBe(true);
      expect(inngestFunctions.length).toBeGreaterThanOrEqual(1);
    });

    it("should export registerInngest function", async () => {
      const { registerInngest } = await import("../../server/_core/inngest");
      expect(typeof registerInngest).toBe("function");
    });
  });

  describe("stream module", () => {
    it("should export all stream helper functions", async () => {
      const stream = await import("../../server/_core/stream");
      expect(typeof stream.getDirectUploadUrl).toBe("function");
      expect(typeof stream.getPlaybackUrl).toBe("function");
      expect(typeof stream.getThumbnailUrl).toBe("function");
      expect(typeof stream.deleteVideo).toBe("function");
      expect(typeof stream.verifyWebhookSignature).toBe("function");
    });

    it("getPlaybackUrl should return a valid URL format", async () => {
      const { getPlaybackUrl } = await import("../../server/_core/stream");
      const url = getPlaybackUrl("test-uid-123");
      expect(url).toContain("test-uid-123");
      expect(url).toContain("manifest/video.m3u8");
    });

    it("getThumbnailUrl should return a valid URL format", async () => {
      const { getThumbnailUrl } = await import("../../server/_core/stream");
      const url = getThumbnailUrl("test-uid-456", "3s");
      expect(url).toContain("test-uid-456");
      expect(url).toContain("thumbnail.jpg");
      expect(url).toContain("time=3s");
    });
  });

  describe("env configuration", () => {
    it("should have R2 env vars in ENV export", async () => {
      const { ENV } = await import("../../server/_core/env");
      expect("r2AccountId" in ENV).toBe(true);
      expect("r2AccessKeyId" in ENV).toBe(true);
      expect("r2SecretAccessKey" in ENV).toBe(true);
      expect("r2BucketVault" in ENV).toBe(true);
      expect("r2BucketCache" in ENV).toBe(true);
      expect("r2Endpoint" in ENV).toBe(true);
    });

    it("should have Inngest env vars in ENV export", async () => {
      const { ENV } = await import("../../server/_core/env");
      expect("inngestEventKey" in ENV).toBe(true);
      expect("inngestSigningKey" in ENV).toBe(true);
    });

    it("should have Stream env vars in ENV export", async () => {
      const { ENV } = await import("../../server/_core/env");
      expect("cfStreamApiToken" in ENV).toBe(true);
      expect("cfStreamAccountId" in ENV).toBe(true);
      expect("cfStreamCustomerSubdomain" in ENV).toBe(true);
    });

    it("R2 bucket defaults should be correct", async () => {
      const { ENV } = await import("../../server/_core/env");
      expect(ENV.r2BucketVault).toBe("docvault-vault");
      expect(ENV.r2BucketCache).toBe("docvault-cache");
    });
  });
});
