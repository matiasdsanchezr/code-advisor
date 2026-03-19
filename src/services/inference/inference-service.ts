import { config } from "@/lib/config";
import { GeminiCliClient } from "./api/google-gemini-cli/google-gemini-cli-client";
import { GoogleGenAiClient } from "./api/google-genai/google-genai-client";
import { NvidiaNimClient } from "./api/nvidia-nim/nvidia-nim-client";
import { OpenRouterClient } from "./api/open-router/open-router-client";
import { GoogleVertexClient } from "./api/google-vertex/google-vertex-client";
import { InferenceClient } from "./types/inference-client";
import { InferenceRequestOptions } from "./types/inference-request-options";

export type InferenceProvider =
  | "genai"
  | "gemini-cli"
  | "open-router"
  | "nvidia-nim"
  | "vertex";

const clientCache = new Map<string, InferenceClient>();

function createClient(provider: InferenceProvider) {
  switch (provider) {
    case "genai":
      return new GoogleGenAiClient();
    case "gemini-cli":
      return new GeminiCliClient();
    case "open-router":
      return new OpenRouterClient();
    case "nvidia-nim":
      return new NvidiaNimClient();
    case "vertex":
      return new GoogleVertexClient();
    default:
      return new GoogleVertexClient();
  }
}

function getClient(provider: InferenceProvider): InferenceClient {
  const client = clientCache.get(provider);
  if (client) return client;

  const newClient = createClient(provider);
  clientCache.set(provider, newClient);
  return newClient;
}

export async function generateContent(requestOptions: InferenceRequestOptions) {
  const provider = config.AI_PROVIDER as InferenceProvider;
  const client = getClient(provider);
  if (!client.generateResponseStream)
    throw new Error("Modo streaming no disponible");

  const modelResponse = await client.generateResponseStream({
    systemPrompt: requestOptions.systemPrompt,
    messages: requestOptions.messages,
    config: requestOptions.config,
    model: requestOptions.model,
    debug: true,
  });
  return modelResponse;
}

export async function getAiProviderState() {
  return { model: config.MODEL, provider: config.AI_PROVIDER };
}
