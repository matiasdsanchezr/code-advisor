import z from "zod";

export const InferenceProviderSchema = z.enum([
  "gemini-cli",
  "genai",
  "vertex",
  "nvidia-nim",
  "open-router",
]);

export type InferenceProvider = z.infer<typeof InferenceProviderSchema>;
