import "server-only";

import logger from "@/lib/logger";
import OpenAI from "openai";
import {
  ChatCompletionCreateParamsNonStreaming,
  ChatCompletionCreateParamsStreaming,
  ChatCompletionMessageParam,
} from "openai/resources/chat/completions";
import { InferenceClient } from "../../types/inference-client";
import { InferenceRequestOptions } from "../../types/inference-request-options";
import { InferenceResponse } from "../../types/inference-response";
import { mapMessagesToOpenAi } from "./open-ai-mapper";

type OpenAIChatCompletionParamsNonStreaming =
  ChatCompletionCreateParamsNonStreaming & {
    chat_template_kwargs?: { thinking: boolean };
  };

type OpenAIChatCompletionParamsStreaming =
  ChatCompletionCreateParamsStreaming & {
    chat_template_kwargs?: { thinking: boolean };
  };

type OpenAIReasoningMessage = OpenAI.Chat.ChatCompletionMessage & {
  reasoning_content?: string;
  reasoning?: string;
};

type OpenAIChoiceDelta =
  OpenAI.Chat.Completions.ChatCompletionChunk.Choice.Delta & {
    reasoning_content?: string;
    reasoning?: string;
  };

export class OpenAiClient implements InferenceClient {
  private _client;

  constructor(baseURL: string, apiKey: string) {
    this._client = new OpenAI({
      baseURL,
      apiKey,
      defaultHeaders: {},
    });
  }

  public generateResponse = async (
    params: InferenceRequestOptions
  ): Promise<InferenceResponse> => {
    const client = this._client;
    const model = params.model;
    const messages: ChatCompletionMessageParam[] = [
      {
        role: "system",
        content: [
          {
            type: "text",
            text: params.systemPrompt,
          },
        ],
      },
      ...mapMessagesToOpenAi({ messages: params.messages }),
    ];
    const chatCompletion = await client.chat.completions.create({
      top_p: params.config.topP,
      temperature: params.config.temperature,
      response_format: params.responseJsonSchema
        ? { type: "json_object" }
        : undefined,
      chat_template_kwargs: { thinking: true },
      model,
      messages,
    } as OpenAIChatCompletionParamsNonStreaming);
    logger.debug(JSON.stringify(chatCompletion, null, 2));

    const message = chatCompletion.choices[0].message as OpenAIReasoningMessage;
    if (!message.content) throw new Error("Empty response");

    return {
      response: message.content,
      reasoning: message.reasoning ?? message.reasoning_content,
    };
  };

  public generateResponseStream = async (
    params: InferenceRequestOptions
  ): Promise<InferenceResponse> => {
    const client = this._client;
    const model = params.model;
    const messages: ChatCompletionMessageParam[] = [
      {
        role: "system",
        content: [
          {
            type: "text",
            text: params.systemPrompt,
          },
        ],
      },
      ...mapMessagesToOpenAi({ messages: params.messages }),
    ];
    const chatCompletion = await client.chat.completions.create({
      response_format: params.responseJsonSchema
        ? { type: "json_object" }
        : undefined,
      top_p: params.config.topP,
      temperature: params.config.temperature,
      model,
      messages,
      chat_template_kwargs: { thinking: true },
      stream: true,
    } as OpenAIChatCompletionParamsStreaming);

    let response = "";
    let reasoning = "";

    for await (const chunk of chatCompletion) {
      const delta = chunk.choices[0]?.delta as OpenAIChoiceDelta;
      if (delta?.reasoning_content || delta?.reasoning) {
        reasoning += delta.reasoning_content ?? delta.reasoning;
        process.stdout.write(delta.reasoning_content ?? delta.reasoning ?? "");
      }
      response += chunk.choices[0]?.delta?.content || "";

      process.stdout.write(chunk.choices[0]?.delta?.content || "");
    }

    logger.debug(JSON.stringify(chatCompletion, null, 2));

    return {
      response,
      reasoning,
    };
  };
}
