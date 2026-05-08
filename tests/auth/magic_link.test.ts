import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * Unit tests for the Better-Auth magic-link flow.
 * These mock external dependencies (Resend, DB) to test logic in isolation.
 */

// Mock the ENV module
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
const mockSend = vi.fn();
vi.mock("resend", () => ({
  Resend: vi.fn().mockImplementation(() => ({
    emails: { send: mockSend },
  })),
}));

// Mock drizzle
const mockInsert = vi.fn();
const mockSelect = vi.fn();
const mockUpdate = vi.fn();
const mockDelete = vi.fn();

vi.mock("drizzle-orm/mysql2", () => ({
  drizzle: vi.fn(() => ({
    insert: mockInsert,
    select: mockSelect,
    update: mockUpdate,
    delete: mockDelete,
  })),
}));

// Mock the sdk
vi.mock("../../server/_core/sdk", () => ({
  sdk: {
    createSessionToken: vi.fn().mockResolvedValue("jwt-token-mock"),
  },
}));

// Mock the db module
vi.mock("../../server/db", () => ({
  upsertUser: vi.fn().mockResolvedValue(undefined),
  getUserByOpenId: vi.fn().mockResolvedValue({
    id: 1,
    openId: "email:test@example.com",
    email: "test@example.com",
    name: "test",
  }),
}));

describe("sendMagicLink", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset module cache to get fresh instances
    mockInsert.mockReturnValue({
      values: vi.fn().mockResolvedValue([{ insertId: 1 }]),
    });
    mockSend.mockResolvedValue({ data: { id: "email-id" }, error: null });
  });

  it("should generate a token and send an email via Resend", async () => {
    const { sendMagicLink } = await import("../../server/_core/better_auth");

    const result = await sendMagicLink("test@example.com");

    expect(result.sent).toBe(true);
    expect(result.error).toBeUndefined();
    expect(mockInsert).toHaveBeenCalled();
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        from: "DocVault <noreply@docvault.uk>",
        to: "test@example.com",
        subject: "Sign in to DocVault",
      })
    );
  });

  it("should include the magic link URL in the email HTML", async () => {
    const { sendMagicLink } = await import("../../server/_core/better_auth");

    await sendMagicLink("doctor@nhs.net");

    const sendCall = mockSend.mock.calls[0][0];
    expect(sendCall.html).toContain("https://app.docvault.uk/auth/verify?token=");
  });

  it("should return error when Resend fails", async () => {
    mockSend.mockResolvedValue({
      data: null,
      error: { message: "Rate limit exceeded", name: "rate_limit" },
    });

    const { sendMagicLink } = await import("../../server/_core/better_auth");
    const result = await sendMagicLink("test@example.com");

    expect(result.sent).toBe(false);
    expect(result.error).toContain("Rate limit exceeded");
  });

  it("should normalise email to lowercase and trim", async () => {
    const { sendMagicLink } = await import("../../server/_core/better_auth");

    await sendMagicLink("  Doctor@NHS.Net  ");

    const sendCall = mockSend.mock.calls[0][0];
    expect(sendCall.to).toBe("doctor@nhs.net");
  });
});

describe("verifyMagicLink", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return error for invalid token", async () => {
    mockSelect.mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([]),
        }),
      }),
    });

    const { verifyMagicLink } = await import("../../server/_core/better_auth");
    const result = await verifyMagicLink("invalid-token");

    expect(result.success).toBe(false);
    expect(result.error).toBe("Invalid or expired token");
  });

  it("should return error for expired token", async () => {
    const expiredRecord = {
      id: 1,
      token: "valid-token",
      email: "test@example.com",
      expiresAt: new Date(Date.now() - 1000), // expired 1 second ago
      usedAt: null,
      createdAt: new Date(),
    };

    mockSelect.mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([expiredRecord]),
        }),
      }),
    });

    const { verifyMagicLink } = await import("../../server/_core/better_auth");
    const result = await verifyMagicLink("valid-token");

    expect(result.success).toBe(false);
    expect(result.error).toBe("Token has expired");
  });

  it("should return error for already-used token", async () => {
    const usedRecord = {
      id: 1,
      token: "used-token",
      email: "test@example.com",
      expiresAt: new Date(Date.now() + 60000), // still valid
      usedAt: new Date(), // already used
      createdAt: new Date(),
    };

    mockSelect.mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([usedRecord]),
        }),
      }),
    });

    const { verifyMagicLink } = await import("../../server/_core/better_auth");
    const result = await verifyMagicLink("used-token");

    expect(result.success).toBe(false);
    expect(result.error).toBe("Token has already been used");
  });

  it("should succeed for valid token and return user + session + JWT", async () => {
    const validRecord = {
      id: 1,
      token: "valid-token",
      email: "test@example.com",
      expiresAt: new Date(Date.now() + 60000),
      usedAt: null,
      createdAt: new Date(),
    };

    // First select: find verification token
    // Second select: find user (from getSessionByToken path not used here)
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

    const { verifyMagicLink } = await import("../../server/_core/better_auth");
    const result = await verifyMagicLink("valid-token");

    expect(result.success).toBe(true);
    expect(result.user).toBeDefined();
    expect(result.user?.email).toBe("test@example.com");
    expect(result.jwtToken).toBe("jwt-token-mock");
    expect(result.sessionId).toBeDefined();
  });
});

describe("getSessionByToken", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return null for non-existent session", async () => {
    mockSelect.mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([]),
        }),
      }),
    });

    const { getSessionByToken } = await import("../../server/_core/better_auth");
    const result = await getSessionByToken("non-existent-session");

    expect(result).toBeNull();
  });

  it("should return null for expired session", async () => {
    const expiredSession = {
      id: "session-id",
      userId: 1,
      expiresAt: new Date(Date.now() - 1000),
      createdAt: new Date(),
    };

    mockSelect.mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([expiredSession]),
        }),
      }),
    });

    const { getSessionByToken } = await import("../../server/_core/better_auth");
    const result = await getSessionByToken("session-id");

    expect(result).toBeNull();
  });
});
