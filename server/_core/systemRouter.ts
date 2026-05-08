import { z } from "zod";
import { notifyOwner } from "./notification";
import { adminProcedure, publicProcedure, router } from "./trpc";
import { inngest } from "./inngest";

export const systemRouter = router({
  health: publicProcedure
    .input(
      z.object({
        timestamp: z.number().min(0, "timestamp cannot be negative"),
      }),
    )
    .query(() => ({
      ok: true,
    })),

  notifyOwner: adminProcedure
    .input(
      z.object({
        title: z.string().min(1, "title is required"),
        content: z.string().min(1, "content is required"),
      }),
    )
    .mutation(async ({ input }) => {
      const result = await notifyOwner(input);
      return {
        success: false,
        error: result.error,
        reason: result.reason,
      } as const;
    }),

  triggerHello: adminProcedure
    .input(
      z.object({
        name: z.string().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const { ids } = await inngest.send({
        name: "docvault/hello",
        data: { name: input.name ?? "DocVault" },
      });
      return { eventIds: ids, message: `Triggered hello-world job for "${input.name ?? "DocVault"}"` };
    }),
});
