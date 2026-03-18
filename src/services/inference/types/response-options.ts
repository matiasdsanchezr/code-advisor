import { ZodObject } from "zod/v4";
import { Message } from "../schemas/message.schema";

export type GenerateResponseParams = {
  systemPrompt: string;
  messages: Message[];
  model: string;
  contextInfo?: string;
  debug?: boolean;
  responseJsonSchema?: ZodObject;
  config: { temperature?: number; topP?: number; topK?: number };
};
