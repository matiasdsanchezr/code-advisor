import { GenerateContentConfig } from "@google/genai";
import { ZodObject } from "zod";
import { Message } from "../schemas/message.schema";
import { InferenceProvider } from "../schemas/provider-schema";

export type InferenceRequestOptions = {
  provider: InferenceProvider;
  systemPrompt: string;
  messages: Message[];
  model: string;
  contextInfo?: string;
  debug?: boolean;
  responseJsonSchema?: ZodObject;
  config:
    | { temperature?: number; topP?: number; topK?: number }
    | GenerateContentConfig;
};
