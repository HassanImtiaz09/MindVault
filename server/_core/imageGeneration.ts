// AI image generation helper.
//
// M0.1 status: Manus forge proxy removed. No in-repo callers exist today.
// When image generation is needed (likely M3 video tutor pipeline), wire to a
// real provider (Gemini Imagen, OpenAI gpt-image-1, or Replicate).

export type GenerateImageOptions = {
  prompt: string;
  originalImages?: Array<{
    url?: string;
    b64Json?: string;
    mimeType?: string;
  }>;
};

export type GenerateImageUnavailable = {
  ok: false;
  error: "IMAGE_GENERATION_NOT_CONFIGURED";
  reason: string;
};

export async function generateImage(_options: GenerateImageOptions): Promise<GenerateImageUnavailable> {
  console.warn("[imageGeneration] forge proxy removed in M0.1; provider pending (likely M3)");
  return {
    ok: false,
    error: "IMAGE_GENERATION_NOT_CONFIGURED",
    reason: "Image generation provider not yet wired. Pending M3 video tutor pipeline.",
  };
}
