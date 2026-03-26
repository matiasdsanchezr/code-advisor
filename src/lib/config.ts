import "server-only";

import {
  InferenceProvider,
  InferenceProviderEnum,
} from "@/services/inference/schemas/provider-schema";

const loadAiProvider = (): InferenceProvider => {
  const aiProvider = InferenceProviderEnum.safeParse(process.env.AI_PROVIDER);
  if (!aiProvider.success) {
    console.warn("AI_PROVIDER no definido, usando vertex");
    return "vertex";
  }
  return aiProvider.data;
};

const TARGET_PROJECT_PATH = process.env.TARGET_PROJECT_PATH;
const GENAI_API_KEY = process.env.GENAI_API_KEY;
const VERTEX_API_KEY = process.env.VERTEX_API_KEY;
const OPEN_ROUTER_API_KEY = process.env.OPEN_ROUTER_API_KEY;
const NVIDIA_NIM_API_KEY = process.env.NVIDIA_NIM_API_KEY;
const AI_PROVIDER = loadAiProvider();
const MODEL = process.env.MODEL;

if (!TARGET_PROJECT_PATH)
  throw new Error("Se necesita el path del proyecto a analizar");
if (!AI_PROVIDER) throw new Error("Provedor no especificado");
if (!MODEL) throw new Error("Modelo no especificado");

export const config = {
  TARGET_PROJECT_PATH,
  GENAI_API_KEY,
  VERTEX_API_KEY,
  OPEN_ROUTER_API_KEY,
  NVIDIA_NIM_API_KEY,
  AI_PROVIDER,
  MODEL,
};
