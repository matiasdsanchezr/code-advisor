import "server-only";

import { config } from "@/lib/config";
import { OpenAiClient } from "../open-ai/client";

export type OpenRouterModel =
  | "deepseek/deepseek-chat-v3-0324:free"
  | "deepseek/deepseek-chat-v3.1:free"
  | "deepseek/deepseek-r1-0528:free"
  | "deepseek/deepseek-r1-0528-qwen3-8b:free"
  | "tngtech/deepseek-r1t2-chimera:free"
  | "moonshotai/kimi-k2:free"
  | "z-ai/glm-4.5-air:free"
  | "x-ai/grok-4.1-fast:free"
  | "kwaipilot/kat-coder-pro:free"
  | "meituan/longcat-flash-chat:free"
  | "tngtech/tng-r1t-chimera:allenai/olmo-3-32b-think:free"
  | "tngtech/tng-r1t-chimera:free"
  | "arcee-ai/trinity-mini:free"
  | "amazon/nova-2-lite-v1:free"
  | string;

export class OpenRouterClient extends OpenAiClient {
  constructor() {
    if (!config.OPEN_ROUTER_API_KEY)
      throw new Error("OPEN_ROUTER_API_KEY no fue configurada");
    super("https://openrouter.ai/api/v1", config.OPEN_ROUTER_API_KEY);
  }
}
