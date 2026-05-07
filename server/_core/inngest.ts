// Inngest background job framework.
//
// M0.3: Sets up the Inngest client, registers the serve handler on Express,
// and defines a hello-world function to verify the integration.

import { Inngest } from "inngest";
import { serve } from "inngest/express";
import type { Express } from "express";
import { ENV } from "./env";

// --- Client ---

export const inngest = new Inngest({
  id: "docvault",
  eventKey: ENV.inngestEventKey,
  signingKey: ENV.inngestSigningKey,
});

// --- Functions ---

/**
 * Hello-world function to verify Inngest integration.
 * Triggered by "docvault/hello" event.
 * Logs a message and returns a greeting.
 *
 * Inngest v4 API: createFunction(config, handler)
 * Triggers are specified in the config object.
 */
export const helloWorld = inngest.createFunction(
  {
    id: "hello-world",
    name: "Hello World",
    triggers: [{ event: "docvault/hello" }],
  },
  async ({ event, step }) => {
    const greeting = await step.run("generate-greeting", () => {
      const name = (event.data as any)?.name ?? "World";
      const message = `Hello, ${name}! DocVault Inngest integration is working. Timestamp: ${new Date().toISOString()}`;
      console.log(`[inngest] ${message}`);
      return message;
    });

    return { greeting };
  },
);

// --- All registered functions ---

export const inngestFunctions = [helloWorld];

// --- Express registration ---

/**
 * Register the Inngest serve handler on the Express app.
 * Mounts at /api/inngest by default.
 *
 * @param app - Express application instance
 * @param path - Mount path (default: "/api/inngest")
 */
export function registerInngest(app: Express, path = "/api/inngest"): void {
  if (!ENV.inngestEventKey || !ENV.inngestSigningKey) {
    console.warn("[inngest] Event key or signing key not configured — skipping registration");
    return;
  }

  const handler = serve({
    client: inngest,
    functions: inngestFunctions,
  });

  app.use(path, handler);
  console.log(`[inngest] Serve handler registered at ${path}`);
}
