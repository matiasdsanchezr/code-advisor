import { config } from "@/lib/config";
import { GeminiCliClient } from "./api/gemini-cli/client";
import { GenAIClient } from "./api/genai/client";
import { NvidiaNimClient } from "./api/nvidia-nim/client";
import { OpenRouterClient } from "./api/open-router/client";
import { VertexClient } from "./api/vertex/client";
import { AIClient } from "./types/ai-client";
import { GenerateResponseParams } from "./types/response-options";

export type AiProviderState = {
  model: string;
  isBusy: boolean;
  provider: string;
};

export type Provider =
  | "genai"
  | "gemini-cli"
  | "open-router"
  | "nvidia-nim"
  | "vertex";

const clientCache = new Map<string, AIClient>();

function createClient(provider: Provider) {
  switch (provider) {
    case "genai":
      return new GenAIClient();
    case "gemini-cli":
      return new GeminiCliClient();
    case "open-router":
      return new OpenRouterClient();
    case "nvidia-nim":
      return new NvidiaNimClient();
    case "vertex":
      return new VertexClient();
    default:
      return new VertexClient();
  }
}

function getClient(provider: Provider): AIClient {
  const client = clientCache.get(provider);
  if (client) return client;

  const newClient = createClient(provider);
  clientCache.set(provider, newClient);
  return newClient;
}

export async function generateContent(params: GenerateResponseParams) {
  const provider = config.AI_PROVIDER as Provider;
  const client = getClient(provider);
  if (!client.generateResponseStream)
    throw new Error("Modo streaming no disponible");

  const modelResponse = await client.generateResponseStream({
    systemPrompt: params.systemPrompt,
    messages: params.messages,
    config: params.config,
    model: params.model,
    debug: true,
  });
  return modelResponse;
}

export async function getAiProviderState() {
  return { model: config.MODEL, provider: config.AI_PROVIDER };
}
