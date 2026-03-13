import { config } from "@/lib/config";
import { GeminiCliClient } from "./api/gemini-cli/client";
import { GenAIClient } from "./api/genai/client";
import { NvidiaNimClient } from "./api/nvidia-nim/client";
import { OpenRouterClient } from "./api/open-router/client";
import { VertexClient } from "./api/vertex/client";
import { AIClient } from "./types/ai-client";

export type AiProviderState = {
  model: string;
  isBusy: boolean;
  provider: string;
};

const clientCache = new Map<string, AIClient>();

function createClient() {
  switch (config.AI_PROVIDER) {
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

function getClient(): AIClient {
  const client = clientCache.get(config.AI_PROVIDER);
  if (client) return client;

  const newClient = createClient();
  clientCache.set(config.AI_PROVIDER, newClient);
  return newClient;
}

export async function generateContent(systemPrompt: string, userInput: string) {
  const client = getClient();
  if (!client.generateResponseStream)
    throw new Error("Modo streaming no disponible");

  const modelResponse = await client.generateResponseStream({
    systemPrompt,
    messages: [{ role: "user", content: userInput }],
    config: { temperature: 1 },
    model: config.MODEL,
    debug: true,
  });
  return modelResponse;
}

export async function getAiProviderState() {
  return { model: config.MODEL, provider: config.AI_PROVIDER };
}
