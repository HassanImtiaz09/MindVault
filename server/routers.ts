import { z } from "zod";
import { COOKIE_NAME } from "../shared/const.js";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { invokeLLM } from "./_core/llm";
import { transcribeAudio } from "./_core/voiceTranscription";
import * as db from "./db";
import { storagePut } from "./storage";

function getContentString(content: string | Array<any> | undefined | null): string {
  if (!content) return "";
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content.filter((c: any) => c.type === "text").map((c: any) => c.text).join("\n");
  }
  return String(content);
}

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  memories: router({
    list: protectedProcedure
      .input(z.object({
        type: z.string().optional(),
        search: z.string().optional(),
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
      }).optional())
      .query(({ ctx, input }) => {
        return db.getUserMemories(ctx.user.id, {
          type: input?.type,
          search: input?.search,
          limit: input?.limit ?? 50,
          offset: input?.offset ?? 0,
        });
      }),

    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(({ input }) => db.getMemoryById(input.id)),

    recent: protectedProcedure
      .input(z.object({ limit: z.number().min(1).max(20).default(5) }).optional())
      .query(({ ctx, input }) => db.getRecentMemories(ctx.user.id, input?.limit ?? 5)),

    stats: protectedProcedure.query(({ ctx }) => db.getMemoryStats(ctx.user.id)),

    create: protectedProcedure
      .input(z.object({
        type: z.enum(["text", "image", "voice", "document", "link"]),
        title: z.string().min(1).max(500),
        content: z.string().optional(),
        sourceUrl: z.string().optional(),
        fileBase64: z.string().optional(),
        fileName: z.string().optional(),
        fileMimeType: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        let fileUrl: string | undefined;
        if (input.fileBase64 && input.fileName) {
          const buffer = Buffer.from(input.fileBase64, "base64");
          const key = `memories/${ctx.user.id}/${Date.now()}-${input.fileName}`;
          const result = await storagePut(key, buffer, input.fileMimeType || "application/octet-stream");
          fileUrl = result.url;
        }
        const memoryId = await db.createMemory({
          userId: ctx.user.id,
          type: input.type,
          title: input.title,
          content: input.content,
          sourceUrl: input.sourceUrl,
          fileUrl,
          processed: false,
        });
        processMemory(memoryId, input.type, input.content, fileUrl, input.sourceUrl).catch(
          (err) => console.error("[AI Processing] Error:", err)
        );
        return { id: memoryId };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ input }) => db.deleteMemory(input.id)),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().optional(),
        content: z.string().optional(),
      }))
      .mutation(({ input }) => {
        const { id, ...data } = input;
        return db.updateMemory(id, data);
      }),
  }),

  ai: router({
    query: protectedProcedure
      .input(z.object({ question: z.string().min(1) }))
      .mutation(async ({ ctx, input }) => {
        const allMemories = await db.getUserMemories(ctx.user.id, { limit: 100 });
        const relevantMemories = allMemories.filter((m) => m.processed);
        const knowledgeContext = relevantMemories
          .map((m) => {
            const parts = [`[Memory #${m.id}] Type: ${m.type}, Title: "${m.title}"`];
            if (m.aiSummary) parts.push(`Summary: ${m.aiSummary}`);
            if (m.content) parts.push(`Content: ${m.content.substring(0, 500)}`);
            if (m.aiTopics?.length) parts.push(`Topics: ${m.aiTopics.join(", ")}`);
            if (m.aiExtractedText) parts.push(`Extracted: ${m.aiExtractedText.substring(0, 300)}`);
            if (m.aiTranscription) parts.push(`Transcription: ${m.aiTranscription.substring(0, 300)}`);
            return parts.join("\n");
          })
          .join("\n---\n");
        const response = await invokeLLM({
          messages: [
            {
              role: "system",
              content: `You are MindVault AI, a personal knowledge assistant. Answer questions based ONLY on the user's stored knowledge below. If you reference specific memories, cite them as [Memory #ID]. Format your response with clear structure using markdown.\n\nUSER'S KNOWLEDGE BASE:\n${knowledgeContext}`,
            },
            { role: "user", content: input.question },
          ],
        });
        const answer = getContentString(response.choices[0]?.message?.content) || "I couldn't find relevant information in your knowledge base.";
        const sourceIds = relevantMemories.filter((m) => answer.includes(`#${m.id}`)).map((m) => m.id);
        await db.saveChatMessage({ userId: ctx.user.id, role: "user", content: input.question });
        await db.saveChatMessage({ userId: ctx.user.id, role: "assistant", content: String(answer), sourcesJson: sourceIds });
        return { answer, sourceIds };
      }),

    weeklySummary: protectedProcedure.query(async ({ ctx }) => {
      const allMemories = await db.getUserMemories(ctx.user.id, { limit: 100 });
      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const recentMemories = allMemories.filter(
        (m) => m.processed && new Date(m.createdAt) >= oneWeekAgo
      );
      if (recentMemories.length === 0) {
        return {
          summary: "No new memories this week. Start capturing ideas, notes, and content to build your knowledge base!",
          newInsights: [],
          recurringThemes: [],
          knowledgeGaps: [],
          memoryCount: 0,
        };
      }
      const memoryContext = recentMemories
        .map((m) => {
          const parts = [`Title: "${m.title}", Type: ${m.type}`];
          if (m.aiSummary) parts.push(`Summary: ${m.aiSummary}`);
          if (m.aiTopics?.length) parts.push(`Topics: ${m.aiTopics.join(", ")}`);
          if (m.aiKeyInsights?.length) parts.push(`Insights: ${m.aiKeyInsights.join("; ")}`);
          return parts.join(" | ");
        })
        .join("\n");
      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `You are MindVault AI. Generate a weekly knowledge summary. Return JSON:\n{\n  "summary": "A 2-3 sentence overview",\n  "newInsights": ["insight1", "insight2"],\n  "recurringThemes": ["theme1", "theme2"],\n  "knowledgeGaps": ["gap1", "gap2"]\n}`,
          },
          { role: "user", content: `Here are the memories saved this week:\n${memoryContext}` },
        ],
        response_format: { type: "json_object" },
      });
      try {
        const parsed = JSON.parse(getContentString(response.choices[0]?.message?.content) || "{}");
        return {
          summary: parsed.summary || "Weekly summary generated.",
          newInsights: parsed.newInsights || [],
          recurringThemes: parsed.recurringThemes || [],
          knowledgeGaps: parsed.knowledgeGaps || [],
          memoryCount: recentMemories.length,
        };
      } catch {
        return {
          summary: getContentString(response.choices[0]?.message?.content) || "Weekly summary generated.",
          newInsights: [],
          recurringThemes: [],
          knowledgeGaps: [],
          memoryCount: recentMemories.length,
        };
      }
    }),

    generateIdeas: protectedProcedure
      .input(z.object({ prompt: z.string().min(1) }))
      .mutation(async ({ ctx, input }) => {
        const allMemories = await db.getUserMemories(ctx.user.id, { limit: 100 });
        const processedMemories = allMemories.filter((m) => m.processed);
        const knowledgeContext = processedMemories
          .map((m) => {
            const parts = [`"${m.title}" (${m.type})`];
            if (m.aiSummary) parts.push(m.aiSummary);
            if (m.aiTopics?.length) parts.push(`Topics: ${m.aiTopics.join(", ")}`);
            return parts.join(" - ");
          })
          .join("\n");
        const response = await invokeLLM({
          messages: [
            {
              role: "system",
              content: `You are MindVault AI, a creative idea generator. Based on the user's stored knowledge, generate innovative and actionable ideas. Return JSON:\n{\n  "ideas": [\n    { "title": "Idea title", "description": "Detailed description", "relatedTopics": ["topic1", "topic2"] }\n  ]\n}\n\nUSER'S KNOWLEDGE BASE:\n${knowledgeContext}`,
            },
            { role: "user", content: input.prompt },
          ],
          response_format: { type: "json_object" },
        });
        try {
          const parsed = JSON.parse(getContentString(response.choices[0]?.message?.content) || "{}");
          return { ideas: parsed.ideas || [] };
        } catch {
          return { ideas: [{ title: "Generated Idea", description: getContentString(response.choices[0]?.message?.content) || "", relatedTopics: [] }] };
        }
      }),

    chatHistory: protectedProcedure
      .input(z.object({ limit: z.number().min(1).max(100).default(50) }).optional())
      .query(({ ctx, input }) => db.getChatHistory(ctx.user.id, input?.limit ?? 50)),
  }),

  knowledge: router({
    graph: protectedProcedure.query(({ ctx }) => db.getKnowledgeGraphData(ctx.user.id)),
  }),
});

async function processMemory(
  memoryId: number,
  type: string,
  content?: string,
  fileUrl?: string,
  sourceUrl?: string
) {
  try {
    let textToProcess = content || "";
    let transcription: string | undefined;
    let extractedText: string | undefined;

    if (type === "voice" && fileUrl) {
      try {
        const result = await transcribeAudio({ audioUrl: fileUrl });
        if ("text" in result) {
          transcription = result.text;
          textToProcess = transcription;
        } else {
          transcription = "Transcription failed";
        }
      } catch (err) {
        console.error("[Transcription] Error:", err);
        transcription = "Transcription failed";
      }
    }

    if (type === "image" && fileUrl) {
      try {
        const response = await invokeLLM({
          messages: [
            {
              role: "user",
              content: [
                { type: "text", text: "Extract all text and describe the key information in this image. Be thorough and include any data, numbers, names, or important details." },
                { type: "image_url", image_url: { url: fileUrl } },
              ],
            },
          ],
        });
        extractedText = getContentString(response.choices[0]?.message?.content);
        textToProcess = extractedText;
      } catch (err) {
        console.error("[Image Extraction] Error:", err);
      }
    }

    if (type === "document" && fileUrl) {
      try {
        const response = await invokeLLM({
          messages: [
            {
              role: "user",
              content: [
                { type: "text", text: "Read and extract the key information from this document. Provide a comprehensive summary of the content." },
                { type: "file_url", file_url: { url: fileUrl, mime_type: "application/pdf" } },
              ],
            },
          ],
        });
        extractedText = getContentString(response.choices[0]?.message?.content);
        textToProcess = extractedText;
      } catch (err) {
        console.error("[Document Extraction] Error:", err);
      }
    }

    if (type === "link" && sourceUrl) {
      textToProcess = `Web article from: ${sourceUrl}\n${content || ""}`;
    }

    if (textToProcess) {
      const analysisResponse = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `Analyze the following content and return JSON:\n{\n  "summary": "A concise 2-3 sentence summary",\n  "topics": ["topic1", "topic2", "topic3"],\n  "keyInsights": ["insight1", "insight2"]\n}`,
          },
          { role: "user", content: textToProcess.substring(0, 4000) },
        ],
        response_format: { type: "json_object" },
      });
      try {
        const analysis = JSON.parse(getContentString(analysisResponse.choices[0]?.message?.content) || "{}");
        await db.updateMemory(memoryId, {
          aiSummary: analysis.summary || "Processed",
          aiTopics: analysis.topics || [],
          aiKeyInsights: analysis.keyInsights || [],
          aiTranscription: transcription,
          aiExtractedText: extractedText,
          processed: true,
        });
      } catch {
        await db.updateMemory(memoryId, {
          aiSummary: "Content saved",
          aiTopics: [],
          aiKeyInsights: [],
          aiTranscription: transcription,
          aiExtractedText: extractedText,
          processed: true,
        });
      }
    } else {
      await db.updateMemory(memoryId, {
        aiSummary: "Content saved",
        aiTopics: [],
        aiKeyInsights: [],
        processed: true,
      });
    }
  } catch (error) {
    console.error("[AI Processing] Failed for memory", memoryId, error);
    await db.updateMemory(memoryId, { processed: true, aiSummary: "Processing failed" });
  }
}

export type AppRouter = typeof appRouter;
