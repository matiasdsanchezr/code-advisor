import "server-only";

import OpenAI from "openai";
import {
  ChatCompletionCreateParamsNonStreaming,
  ChatCompletionCreateParamsStreaming,
  ChatCompletionMessageParam,
} from "openai/resources/chat/completions";
import { GenerateResponseParams } from "../../types/response-options";
import { ModelResponse } from "../../types/model-response";
import { AIClient } from "../../types/ai-client";

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

export class OpenAiClient implements AIClient {
  private _client;

  constructor(baseURL: string, apiKey: string) {
    this._client = new OpenAI({
      baseURL,
      apiKey,
      defaultHeaders: {},
    });
  }

  public generateResponse = async (
    params: GenerateResponseParams
  ): Promise<ModelResponse> => {
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
      ...params.messages,
    ];
    const body: OpenAIChatCompletionParamsNonStreaming = {
      top_p: params.config.topP,
      temperature: params.config.temperature,
      response_format: params.responseJsonSchema
        ? { type: "json_object" }
        : undefined,
      chat_template_kwargs: { thinking: true },
      model,
      messages,
    };
    const chatCompletion = await client.chat.completions.create(body);
    if (params.debug) console.log(JSON.stringify(chatCompletion, null, 2));

    const message = chatCompletion.choices[0].message as OpenAIReasoningMessage;
    if (!message.content) throw new Error("Empty response");

    return {
      response: message.content,
      thoughts: message.reasoning ?? message.reasoning_content,
    };
  };

  public generateResponseStream = async (
    params: GenerateResponseParams
  ): Promise<ModelResponse> => {
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
      ...params.messages,
    ];
    const body: OpenAIChatCompletionParamsStreaming = {
      response_format: params.responseJsonSchema
        ? { type: "json_object" }
        : undefined,
      top_p: params.config.topP,
      temperature: params.config.temperature,
      model,
      messages,
      chat_template_kwargs: { thinking: true },
      stream: true,
    };
    const chatCompletion = await client.chat.completions.create(body);

    let response = "";
    let reasoning = "";

    for await (const chunk of chatCompletion) {
      const delta = chunk.choices[0]?.delta as OpenAIChoiceDelta;
      if (delta?.reasoning_content || delta?.reasoning) {
        reasoning += delta.reasoning_content ?? delta.reasoning;
        if (params.debug)
          process.stdout.write(
            delta.reasoning_content ?? delta.reasoning ?? ""
          );
      }
      response += chunk.choices[0]?.delta?.content || "";
      if (params.debug) {
        process.stdout.write(chunk.choices[0]?.delta?.content || "");
      }
    }

    if (params.debug) console.log(reasoning, response);

    return {
      response,
      thoughts: reasoning,
    };
  };
}
