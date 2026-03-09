import "server-only";

import { config } from "@/lib/utils/config";
import OpenAI from "openai";
import {
  ChatCompletionCreateParamsNonStreaming,
  ChatCompletionMessageParam,
} from "openai/resources/chat/completions";
import z from "zod/v4";
import { Message } from "../../schemas/message.schema";

type OpenRouterModel =
  | "deepseek/deepseek-chat-v3-0324:free"
  | "deepseek/deepseek-chat-v3.1:free"
  | "deepseek/deepseek-r1-0528:free"
  | "deepseek/deepseek-r1-0528-qwen3-8b:free"
  | "tngtech/deepseek-r1t2-chimera:free"
  | "z-ai/glm-4.5-air:free"
  | "moonshotai/kimi-k2:free"
  | "x-ai/grok-4.1-fast:free"
  | "kwaipilot/kat-coder-pro:free"
  | "meituan/longcat-flash-chat:free"
  | "tngtech/tng-r1t-chimera:allenai/olmo-3-32b-think:free"
  | "tngtech/tng-r1t-chimera:free"
  | "arcee-ai/trinity-mini:free"
  | "amazon/nova-2-lite-v1:free"
  | string;

export type GenerateResponseOptions = {
  systemPrompt: string;
  messages: Message[];
  contextInfo?: string;
  responseJsonSchema?: z.ZodObject;
  config: Partial<ChatCompletionCreateParamsNonStreaming>;
  debug?: boolean;
  model: OpenRouterModel;
};

type ModelResponse = {
  response: string;
  thoughts?: string;
};

const defaultConfig: Partial<ChatCompletionCreateParamsNonStreaming> = {
  temperature: 1,
  top_p: 0.96,
  // @ts-expect-error: Property doesn't exist
  reasoning: { enabled: true },
};

export class OpenRouterClient {
  private _client = new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: config.OPEN_ROUTER_API_KEY,
    defaultHeaders: {},
  });

  public generateResponse = async (
    args: GenerateResponseOptions
  ): Promise<ModelResponse> => {
    const client = this._client;
    const model: OpenRouterModel =
      args.model ?? "deepseek/deepseek-chat-v3.1:free";
    const messages: ChatCompletionMessageParam[] = [
      {
        role: "system",
        content: [
          {
            type: "text",
            text: args.systemPrompt,
            // @ts-expect-error: Property doesn't exist
            cache_control: {
              type: "ephemeral",
            },
          },
        ],
      },
      ...args.messages,
    ];
    const completion = await client.chat.completions.create({
      ...defaultConfig,
      ...args.config,
      model,
      messages,
      response_format: args.responseJsonSchema
        ? {
            type: "json_object",
            // json_schema: {
            //   name: 'response',
            //   schema: z.toJSONSchema(args.responseJsonSchema),
            //   strict: true
            // }
          }
        : undefined,
    });
    console.log(JSON.stringify(completion.choices[0], null, 2));
    const response = completion.choices[0].message.content;
    if (!response) {
      throw new Error("Empty response");
    }
    const reasoning =
      // @ts-expect-error: Property doesn't exist
      (completion.choices[0].message.reasoning as string) ??
      // @ts-expect-error: Property doesn't exist
      (completion.choices[0].message.reasoning_content as string) ??
      "No disponible";
    const result = {
      reasoning,
      response,
    };
    if (args.debug) {
      console.log("thoughts:", result.reasoning);
      console.log("response:", result.response);
    }
    return result;
  };
}
