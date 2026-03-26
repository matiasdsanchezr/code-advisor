import "server-only";

import { config } from "@/lib/config";
import { OpenAiClient } from "../open-ai/open-ai-client";

export class NvidiaNimClient extends OpenAiClient {
  constructor() {
    if (!config.NVIDIA_NIM_API_KEY)
      throw new Error("NVIDIA_NIM_API_KEY no fue configurada");
    super("https://integrate.api.nvidia.com/v1", config.NVIDIA_NIM_API_KEY);
  }
}
