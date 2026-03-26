import { z } from "zod";

export const OpenRouterModelEnum = z.enum([
  "deepseek/deepseek-chat-v3-0324:free",
  "deepseek/deepseek-chat-v3.1:free",
  "deepseek/deepseek-r1-0528:free",
  "deepseek/deepseek-r1-0528-qwen3-8b:free",
  "tngtech/deepseek-r1t2-chimera:free",
  "moonshotai/kimi-k2:free",
  "z-ai/glm-4.5-air:free",
  "kwaipilot/kat-coder-pro:free",
  "meituan/longcat-flash-chat:free",
  "tngtech/tng-r1t-chimera:allenai/olmo-3-32b-think:free",
  "tngtech/tng-r1t-chimera:free",
  "arcee-ai/trinity-mini:free",
  "amazon/nova-2-lite-v1:free",
]);
