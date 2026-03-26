import z from "zod";

export const NvidiaNimModelEnum = z.enum([
  "qwen/qwen3.5-122b-a10b",
  "minimaxai/minimax-m2.5",
  "z-ai/glm5",
  "z-ai/glm4.7",
  "moonshotai/kimi-k2.5",
  "deepseek-ai/deepseek-v3.2",
  "qwen/qwen3.5-397b-a17b",
]);
