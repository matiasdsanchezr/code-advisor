import "server-only";

import { config } from "@/lib/config";
import { OpenAiClient } from "../open-ai/client";

export type NvidiaNimModel =
  | "qwen/qwen3.5-122b-a10b"
  | "minimaxai/minimax-m2.5"
  | "z-ai/glm5"
  | "z-ai/glm4.6"
  | "moonshotai/kimi-k2.5"
  | "deepseek-ai/deepseek-v3.2"
  | "qwen/qwen3.5-397b-a17b"
  | string;

export class NvidiaNimClient extends OpenAiClient {
  constructor() {
    if (!config.NVIDIA_NIM_API_KEY)
      throw new Error("NVIDIA_NIM_API_KEY no fue configurada");
    super("https://integrate.api.nvidia.com/v1", config.NVIDIA_NIM_API_KEY);
  }
}
