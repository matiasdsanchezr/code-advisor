import "server-only";

import { config } from "@/lib/utils/config";
import OpenAI from "openai";
import {
  ChatCompletionCreateParamsNonStreaming,
  ChatCompletionMessageParam,
} from "openai/resources/chat/completions";
import z from "zod/v4";
import { type Message } from "../../schemas/message.schema";

type NvidiaNimModel =
  | "qwen/qwen3.5-122b-a10b"
  | "minimaxai/minimax-m2.5"
  | "z-ai/glm5"
  | "z-ai/glm4.6"
  | "moonshotai/kimi-k2.5"
  | "deepseek-ai/deepseek-v3.2"
  | "qwen/qwen3.5-397b-a17b"
  | string;

export type GenerateResponseOptions = {
  systemPrompt: string;
  messages: Message[];
  contextInfo?: string;
  responseJsonSchema?: z.ZodObject;
  config: Partial<ChatCompletionCreateParamsNonStreaming>;
  debug?: boolean;
  model: NvidiaNimModel;
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

export class NvidiaNimClient {
  private _client = new OpenAI({
    baseURL: "https://integrate.api.nvidia.com/v1",
    apiKey: config.NVIDIA_NIM_API_KEY,
    defaultHeaders: {},
  });

  public generateResponse = async (
    args: GenerateResponseOptions
  ): Promise<ModelResponse> => {
    const client = this._client;
    const model: NvidiaNimModel =
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
