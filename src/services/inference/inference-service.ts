import { config } from "@/lib/config";
import { GeminiCliClient } from "./api/google-gemini-cli/google-gemini-cli-client";
import { GoogleGenAiClient } from "./api/google-genai/google-genai-client";
import { GoogleVertexClient } from "./api/google-vertex/google-vertex-client";
import { NvidiaNimClient } from "./api/nvidia-nim/nvidia-nim-client";
import { OpenRouterClient } from "./api/open-router/open-router-client";
import { InferenceProvider } from "./schemas/provider-schema";
import { InferenceClient } from "./types/inference-client";
import { InferenceRequestOptions } from "./types/inference-request-options";

const clientCache = new Map<string, InferenceClient>();

function createClient(provider: InferenceProvider) {
  switch (provider) {
    case "genai":
      return new GoogleGenAiClient();
    case "geminiCli":
      return new GeminiCliClient();
    case "openRouter":
      return new OpenRouterClient();
    case "nvidiaNim":
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
  const client = getClient(requestOptions.provider);
  if (!client.generateResponseStream)
    throw new Error("Modo streaming no disponible");

  const modelResponse = await client.generateResponseStream(requestOptions);
  return modelResponse;
}

export async function getAiProviderState() {
  return { model: config.MODEL, provider: config.AI_PROVIDER };
}
