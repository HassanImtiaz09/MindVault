import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * Tests for the cookie bridge mechanism.
 * Verifies that verifyMagicLink produces a valid JWT token
 * that the native app can use for session authentication.
 */

// Mock ENV
vi.mock("../../server/_core/env", () => ({
  ENV: {
    databaseUrl: "mysql://test:test@localhost:3306/test",
    resendApiKey: "re_test_key",
    webAppUrl: "https://app.docvault.uk",
    authFromEmail: "DocVault <noreply@docvault.uk>",
    betterAuthSecret: "test-secret-32-chars-long-enough",
  },
}));

// Mock Resend
vi.mock("resend", () => ({
  Resend: vi.fn().mockImplementation(() => ({
    emails: { send: vi.fn().mockResolvedValue({ data: { id: "id" }, error: null }) },
  })),
}));

// Mock drizzle
const mockInsert = vi.fn();
const mockSelect = vi.fn();
const mockUpdate = vi.fn();

vi.mock("drizzle-orm/mysql2", () => ({
  drizzle: vi.fn(() => ({
    insert: mockInsert,
    select: mockSelect,
    update: mockUpdate,
  })),
}));

// Mock sdk with a spy on createSessionToken
const mockCreateSessionToken = vi.fn();
vi.mock("../../server/_core/sdk", () => ({
  sdk: {
    createSessionToken: mockCreateSessionToken,
  },
}));

// Mock db module
const mockUpsertUser = vi.fn();
const mockGetUserByOpenId = vi.fn();
vi.mock("../../server/db", () => ({
  upsertUser: (...args: unknown[]) => mockUpsertUser(...args),
  getUserByOpenId: (...args: unknown[]) => mockGetUserByOpenId(...args),
}));

describe("Cookie Bridge — verifyMagicLink JWT generation", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default: valid token in DB
    const validRecord = {
      id: 1,
      token: "bridge-test-token",
      email: "bridge@nhs.net",
      expiresAt: new Date(Date.now() + 60000),
      usedAt: null,
      createdAt: new Date(),
    };

    mockSelect.mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([validRecord]),
        }),
      }),
    });

    mockUpdate.mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue(undefined),
      }),
    });

    mockInsert.mockReturnValue({
      values: vi.fn().mockResolvedValue([{ insertId: 1 }]),
    });

    mockUpsertUser.mockResolvedValue(undefined);
    mockGetUserByOpenId.mockResolvedValue({
      id: 42,
      openId: "email:bridge@nhs.net",
      email: "bridge@nhs.net",
      name: "bridge",
    });

    mockCreateSessionToken.mockResolvedValue("jwt-bridge-token-123");
  });

  it("should call sdk.createSessionToken with the correct openId", async () => {
    const { verifyMagicLink } = await import("../../server/_core/better_auth");
    await verifyMagicLink("bridge-test-token");

    expect(mockCreateSessionToken).toHaveBeenCalledWith(
      "email:bridge@nhs.net",
      expect.objectContaining({ name: "bridge" })
    );
  });

  it("should return the JWT token in the response for native app cookie bridge", async () => {
    const { verifyMagicLink } = await import("../../server/_core/better_auth");
    const result = await verifyMagicLink("bridge-test-token");

    expect(result.success).toBe(true);
    expect(result.jwtToken).toBe("jwt-bridge-token-123");
  });

  it("should create a Better-Auth session alongside the JWT bridge token", async () => {
    const { verifyMagicLink } = await import("../../server/_core/better_auth");
    const result = await verifyMagicLink("bridge-test-token");

    expect(result.sessionId).toBeDefined();
    expect(typeof result.sessionId).toBe("string");
    expect(result.sessionId!.length).toBeGreaterThan(0);
    // Session insert should have been called
    expect(mockInsert).toHaveBeenCalled();
  });

  it("should upsert user with magic-link login method", async () => {
    const { verifyMagicLink } = await import("../../server/_core/better_auth");
    await verifyMagicLink("bridge-test-token");

    expect(mockUpsertUser).toHaveBeenCalledWith(
      expect.objectContaining({
        openId: "email:bridge@nhs.net",
        email: "bridge@nhs.net",
        loginMethod: "magic-link",
      })
    );
  });

  it("should return user data from the database", async () => {
    const { verifyMagicLink } = await import("../../server/_core/better_auth");
    const result = await verifyMagicLink("bridge-test-token");

    expect(result.user).toEqual({
      id: 42,
      email: "bridge@nhs.net",
      name: "bridge",
    });
  });

  it("should fail gracefully if user creation fails", async () => {
    mockGetUserByOpenId.mockResolvedValue(null);

    const { verifyMagicLink } = await import("../../server/_core/better_auth");
    const result = await verifyMagicLink("bridge-test-token");

    expect(result.success).toBe(false);
    expect(result.error).toBe("Failed to create user");
  });
});
