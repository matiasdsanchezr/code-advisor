import "server-only";

import { config } from "@/lib/config";
import { OpenAiClient } from "../open-ai/open-ai-client";

export class OpenRouterClient extends OpenAiClient {
  constructor() {
    if (!config.OPEN_ROUTER_API_KEY)
      throw new Error("OPEN_ROUTER_API_KEY no fue configurada");
    super("https://openrouter.ai/api/v1", config.OPEN_ROUTER_API_KEY);
  }
}
