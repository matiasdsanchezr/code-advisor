import z from "zod";

export const InferenceProviderEnum = z.enum([
  "geminiCli",
  "genai",
  "vertex",
  "nvidiaNim",
  "openRouter",
]);

export type InferenceProvider = z.infer<typeof InferenceProviderEnum>;
