import { ZodObject } from "zod";
import { Message } from "../schemas/message.schema";
import { GenerateContentConfig } from "@google/genai";

export type InferenceRequestOptions = {
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
