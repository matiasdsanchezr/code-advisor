import { z } from "zod";
import { GeminiModelEnum } from "../api/google-genai/google-genai-models";
import { NvidiaNimModelEnum } from "../api/nvidia-nim/nvidia-nim-model";
import { OpenRouterModelEnum } from "../api/open-router/open-router-model";
import {
  InferenceProvider,
  InferenceProviderEnum,
} from "../schemas/provider-schema";

export const getModelsForProvider = (provider: InferenceProvider): string[] => {
  const schemas = {
    genai: GeminiModelEnum,
    vertex: GeminiModelEnum,
    nvidiaNim: NvidiaNimModelEnum,
    openRouter: OpenRouterModelEnum,
    geminiCli: GeminiModelEnum,
  };
  return schemas[provider].options;
};

export const NvidiaNimModelSchema = z
  .object({
    provider: z.literal(InferenceProviderEnum.enum.nvidiaNim),
    model: NvidiaNimModelEnum,
  })
  .required();
export type NvidiaNimModel = z.infer<typeof NvidiaNimModelSchema>;

export const OpenRouterModelSchema = z
  .object({
    provider: z.literal(InferenceProviderEnum.enum.openRouter),
    model: OpenRouterModelEnum,
  })
  .required();
export type OpenRouterModel = z.infer<typeof OpenRouterModelSchema>;

export const GenAiModelSchema = z
  .object({
    provider: z.literal(InferenceProviderEnum.enum.genai),
    model: GeminiModelEnum,
  })
  .required();
export type GenAiModel = z.infer<typeof GenAiModelSchema>;

export const VertexModelSchema = z
  .object({
    provider: z.literal(InferenceProviderEnum.enum.vertex),
    model: GeminiModelEnum,
  })
  .required();
export type VertexModel = z.infer<typeof VertexModelSchema>;

export const GeminiCliModelSchema = z
  .object({
    provider: z.literal(InferenceProviderEnum.enum.geminiCli),
    model: GeminiModelEnum,
  })
  .required();
export type GeminiCliModel = z.infer<typeof GeminiCliModelSchema>;

export const InferenceModelSchema = z
  .discriminatedUnion("provider", [
    NvidiaNimModelSchema,
    OpenRouterModelSchema,
    GenAiModelSchema,
    VertexModelSchema,
    GeminiCliModelSchema,
  ])
  .describe("Contenido del mensaje");

export type InferenceModel = z.infer<typeof InferenceModelSchema>;
