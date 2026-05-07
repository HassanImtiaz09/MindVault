/**
 * Voice transcription via OpenAI Whisper, proxied through Helicone for telemetry.
 *
 * Note: the locked stack lists Whisper-Large-v3, but OpenAI's API exposes only the
 * `whisper-1` alias. If exact Large-v3 weights are required (vs OpenAI's hosted
 * version), open a separate ticket to migrate to Replicate or self-hosted Whisper.
 */
import OpenAI from "openai";
import { ENV } from "./env";

export type TranscribeOptions = {
  audioUrl: string;
  language?: string;
  prompt?: string;
};

export type WhisperSegment = {
  id: number;
  seek: number;
  start: number;
  end: number;
  text: string;
  tokens: number[];
  temperature: number;
  avg_logprob: number;
  compression_ratio: number;
  no_speech_prob: number;
};

export type WhisperResponse = {
  task: "transcribe";
  language: string;
  duration: number;
  text: string;
  segments: WhisperSegment[];
};

export type TranscriptionResponse = WhisperResponse;

export type TranscriptionError = {
  error: string;
  code:
    | "FILE_TOO_LARGE"
    | "INVALID_FORMAT"
    | "TRANSCRIPTION_FAILED"
    | "UPLOAD_FAILED"
    | "SERVICE_ERROR";
  details?: string;
};

const HELICONE_BASE_OPENAI = "https://oai.helicone.ai/v1";
const MAX_AUDIO_MB = 25; // OpenAI Whisper API hard limit
let _client: OpenAI | undefined;

function getClient(): OpenAI {
  if (!_client) {
    if (!ENV.openaiApiKey) throw new Error("OPENAI_API_KEY is not configured");
    _client = new OpenAI({
      apiKey: ENV.openaiApiKey,
      baseURL: ENV.heliconeApiKey ? HELICONE_BASE_OPENAI : undefined,
      defaultHeaders: ENV.heliconeApiKey
        ? { "Helicone-Auth": `Bearer ${ENV.heliconeApiKey}` }
        : undefined,
    });
  }
  return _client;
}

export async function transcribeAudio(
  options: TranscribeOptions,
): Promise<TranscriptionResponse | TranscriptionError> {
  if (!ENV.openaiApiKey) {
    return {
      error: "Voice transcription service is not configured",
      code: "SERVICE_ERROR",
      details: "OPENAI_API_KEY is not set",
    };
  }

  let audioBuffer: Buffer;
  let mimeType: string;
  try {
    const dl = await fetch(options.audioUrl);
    if (!dl.ok) {
      return {
        error: "Failed to download audio file",
        code: "INVALID_FORMAT",
        details: `HTTP ${dl.status}: ${dl.statusText}`,
      };
    }
    audioBuffer = Buffer.from(await dl.arrayBuffer());
    mimeType = dl.headers.get("content-type") || "audio/mpeg";
  } catch (error) {
    return {
      error: "Failed to fetch audio file",
      code: "SERVICE_ERROR",
      details: error instanceof Error ? error.message : "Unknown error",
    };
  }

  const sizeMB = audioBuffer.length / (1024 * 1024);
  if (sizeMB > MAX_AUDIO_MB) {
    return {
      error: "Audio file exceeds maximum size limit",
      code: "FILE_TOO_LARGE",
      details: `File size is ${sizeMB.toFixed(2)}MB, maximum allowed is ${MAX_AUDIO_MB}MB`,
    };
  }

  try {
    const filename = `audio.${getFileExtension(mimeType)}`;
    const file = new File([new Uint8Array(audioBuffer)], filename, { type: mimeType });
    const prompt =
      options.prompt ||
      (options.language
        ? `Transcribe the user's voice to text, the user's working language is ${getLanguageName(options.language)}`
        : "Transcribe the user's voice to text");
    const response = await getClient().audio.transcriptions.create({
      file,
      model: "whisper-1",
      response_format: "verbose_json",
      language: options.language,
      prompt,
    });
    const result = response as unknown as WhisperResponse;
    if (!result.text || typeof result.text !== "string") {
      return {
        error: "Invalid transcription response",
        code: "SERVICE_ERROR",
        details: "Transcription service returned an invalid response format",
      };
    }
    return result;
  } catch (error) {
    return {
      error: "Transcription service request failed",
      code: "TRANSCRIPTION_FAILED",
      details: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

function getFileExtension(mimeType: string): string {
  const mimeToExt: Record<string, string> = {
    "audio/webm": "webm",
    "audio/mp3": "mp3",
    "audio/mpeg": "mp3",
    "audio/wav": "wav",
    "audio/wave": "wav",
    "audio/ogg": "ogg",
    "audio/m4a": "m4a",
    "audio/mp4": "m4a",
  };
  return mimeToExt[mimeType] || "audio";
}

function getLanguageName(langCode: string): string {
  const langMap: Record<string, string> = {
    en: "English",
    es: "Spanish",
    fr: "French",
    de: "German",
    it: "Italian",
    pt: "Portuguese",
    ru: "Russian",
    ja: "Japanese",
    ko: "Korean",
    zh: "Chinese",
    ar: "Arabic",
    hi: "Hindi",
    nl: "Dutch",
    pl: "Polish",
    tr: "Turkish",
    sv: "Swedish",
    da: "Danish",
    no: "Norwegian",
    fi: "Finnish",
  };
  return langMap[langCode] || langCode;
}

// Test-only hook
export function __resetClientForTests(): void {
  _client = undefined;
}
