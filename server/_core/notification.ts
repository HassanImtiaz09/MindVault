// Owner push notifications.
//
// M0.1 status: Manus forge proxy removed. The owner-push transport will be
// re-wired in a later milestone (TBD; likely M5 or later). Until then this
// helper returns a structured `NOTIFICATION_NOT_CONFIGURED` response.
//
// User-facing push (expo-notifications) is unaffected — that path does not
// go through this file.

import { TRPCError } from "@trpc/server";

export type NotificationPayload = {
  title: string;
  content: string;
};

export type NotificationUnavailable = {
  ok: false;
  error: "NOTIFICATION_NOT_CONFIGURED";
  reason: string;
};

const TITLE_MAX_LENGTH = 1200;
const CONTENT_MAX_LENGTH = 20000;

const trimValue = (value: string): string => value.trim();
const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

const validatePayload = (input: NotificationPayload): NotificationPayload => {
  if (!isNonEmptyString(input.title)) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "Notification title is required." });
  }
  if (!isNonEmptyString(input.content)) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "Notification content is required." });
  }
  const title = trimValue(input.title);
  const content = trimValue(input.content);
  if (title.length > TITLE_MAX_LENGTH) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Notification title must be at most ${TITLE_MAX_LENGTH} characters.`,
    });
  }
  if (content.length > CONTENT_MAX_LENGTH) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Notification content must be at most ${CONTENT_MAX_LENGTH} characters.`,
    });
  }
  return { title, content };
};

export async function notifyOwner(payload: NotificationPayload): Promise<NotificationUnavailable> {
  // Validate so admin tooling still gets payload-shape errors even while transport is stubbed.
  validatePayload(payload);
  console.warn("[notification] Owner-push transport pending re-wiring; no-op");
  return {
    ok: false,
    error: "NOTIFICATION_NOT_CONFIGURED",
    reason: "Owner push is awaiting transport re-wiring (TBD, likely M5 or later).",
  };
}
