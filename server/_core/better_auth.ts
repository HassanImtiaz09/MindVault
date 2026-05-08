/**
 * Better-Auth integration for DocVault.
 *
 * Provides magic-link email authentication via Resend.
 * After successful verification, also sets the legacy JWT cookie
 * so the native app's existing cookie-reader keeps working.
 */
import crypto from "crypto";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { Resend } from "resend";
import { ENV } from "./env";
import { sdk } from "./sdk";
import { betterAuthSessions, verificationTokens } from "../../drizzle/schema/better_auth";
import { users } from "../../drizzle/schema";
import * as db from "../db";

// ─── Resend transport ────────────────────────────────────────────────────────

let _resend: Resend | null = null;

function getResend(): Resend | null {
  if (!_resend && ENV.resendApiKey) {
    _resend = new Resend(ENV.resendApiKey);
  }
  return _resend;
}

// ─── Database helper ─────────────────────────────────────────────────────────

function getAuthDb() {
  if (!ENV.databaseUrl) return null;
  return drizzle(ENV.databaseUrl);
}

// ─── Magic-link flow ─────────────────────────────────────────────────────────

const MAGIC_LINK_EXPIRY_MS = 15 * 60 * 1000; // 15 minutes

/**
 * Generate a magic-link token and send it via Resend.
 * Returns { sent: true } on success or throws on failure.
 */
export async function sendMagicLink(email: string): Promise<{ sent: boolean; error?: string }> {
  const authDb = getAuthDb();
  if (!authDb) {
    return { sent: false, error: "Database not available" };
  }

  const resend = getResend();
  if (!resend) {
    return { sent: false, error: "Email service not configured (RESEND_API_KEY missing)" };
  }

  // Generate a secure random token
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + MAGIC_LINK_EXPIRY_MS);

  // Store the verification token
  await authDb.insert(verificationTokens).values({
    token,
    email: email.toLowerCase().trim(),
    expiresAt,
  });

  // Build the magic link URL
  const baseUrl = ENV.webAppUrl;
  const magicLinkUrl = `${baseUrl}/auth/verify?token=${token}`;

  // Send the email via Resend
  const fromEmail = ENV.authFromEmail || "DocVault <onboarding@resend.dev>";
  const { error } = await resend.emails.send({
    from: fromEmail,
    to: email.toLowerCase().trim(),
    subject: "Sign in to DocVault",
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px;">
        <h1 style="font-size: 24px; font-weight: 600; color: #1a1a1a; margin-bottom: 16px;">Sign in to DocVault</h1>
        <p style="font-size: 16px; color: #4a4a4a; line-height: 1.5; margin-bottom: 24px;">
          Click the button below to sign in. This link expires in 15 minutes.
        </p>
        <a href="${magicLinkUrl}" style="display: inline-block; background-color: #0a7ea4; color: white; font-size: 16px; font-weight: 500; text-decoration: none; padding: 12px 32px; border-radius: 8px;">
          Sign in to DocVault
        </a>
        <p style="font-size: 14px; color: #8a8a8a; margin-top: 32px; line-height: 1.4;">
          If you didn't request this email, you can safely ignore it.
        </p>
      </div>
    `,
  });

  if (error) {
    console.error("[BetterAuth] Resend error:", error);
    return { sent: false, error: `Email send failed: ${error.message}` };
  }

  return { sent: true };
}

/**
 * Verify a magic-link token.
 * On success: creates a session, sets the legacy JWT cookie, and returns the user.
 */
export async function verifyMagicLink(token: string): Promise<{
  success: boolean;
  user?: { id: number; email: string; name: string | null };
  sessionId?: string;
  jwtToken?: string;
  error?: string;
}> {
  const authDb = getAuthDb();
  if (!authDb) {
    return { success: false, error: "Database not available" };
  }

  // Find the verification token
  const [record] = await authDb
    .select()
    .from(verificationTokens)
    .where(eq(verificationTokens.token, token))
    .limit(1);

  if (!record) {
    return { success: false, error: "Invalid or expired token" };
  }

  // Check expiry
  if (new Date() > record.expiresAt) {
    return { success: false, error: "Token has expired" };
  }

  // Check if already used
  if (record.usedAt) {
    return { success: false, error: "Token has already been used" };
  }

  // Mark token as used
  await authDb
    .update(verificationTokens)
    .set({ usedAt: new Date() })
    .where(eq(verificationTokens.id, record.id));

  const email = record.email;

  // Find or create the user in the main users table
  // Use email as the openId for magic-link users (prefixed to distinguish from OAuth)
  const openId = `email:${email}`;

  await db.upsertUser({
    openId,
    email,
    name: email.split("@")[0], // Default name from email
    loginMethod: "magic-link",
    lastSignedIn: new Date(),
  });

  const user = await db.getUserByOpenId(openId);
  if (!user) {
    return { success: false, error: "Failed to create user" };
  }

  // Create a Better-Auth session
  const sessionId = crypto.randomBytes(32).toString("hex");
  const sessionExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

  await authDb.insert(betterAuthSessions).values({
    id: sessionId,
    userId: user.id,
    expiresAt: sessionExpiry,
  });

  // Bridge: also create a legacy JWT token so the native app keeps working
  const jwtToken = await sdk.createSessionToken(openId, { name: user.name || "" });

  return {
    success: true,
    user: { id: user.id, email: user.email || email, name: user.name },
    sessionId,
    jwtToken,
  };
}

/**
 * Get the current session from a Better-Auth session ID.
 */
export async function getSessionByToken(sessionId: string) {
  const authDb = getAuthDb();
  if (!authDb) return null;

  const [session] = await authDb
    .select()
    .from(betterAuthSessions)
    .where(eq(betterAuthSessions.id, sessionId))
    .limit(1);

  if (!session) return null;
  if (new Date() > session.expiresAt) return null;

  // Get the user
  const [user] = await authDb
    .select()
    .from(users)
    .where(eq(users.id, session.userId))
    .limit(1);

  return user || null;
}
