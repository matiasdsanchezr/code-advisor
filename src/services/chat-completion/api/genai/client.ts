import "server-only";

import {
  GenerateContentConfig,
  GenerateContentResponse,
  GoogleGenAI,
} from "@google/genai";
import z, { ZodObject } from "zod/v4";
import { config } from "@/lib/utils/config";
import { Message } from "../../schemas/message.schema";
import { transformMessages } from "./content-utils";
import { defaultConfig, type GeminiModel } from "./default-config";

export type GenerateResponseOptions = {
  systemPrompt: string;
  messages: Message[];
  contextInfo?: string;
  responseJsonSchema?: ZodObject;
  config?: GenerateContentConfig;
  debug?: boolean;
  model?: GeminiModel | string;
  account?: "dsr1" | "anon" | "md" | "disoire";
};

type ModelResponse = {
  response: string;
  thoughts?: string;
};

export class GenAIClient {
  private _client = new GoogleGenAI({ apiKey: config.GENAI_API_KEY });

  public generateResponse = async (
    args: GenerateResponseOptions,
  ): Promise<ModelResponse> => {
    const model = args.model ?? "gemini-flash-latest";
    const client = this._client;
    const contents = transformMessages({
      messages: args.messages,
      contextInfo: args.contextInfo,
    });
    const modelResponse = await client.models.generateContent({
      model,
      contents,
      config: {
        ...defaultConfig,
        ...args.config,
        systemInstruction: args.systemPrompt,
        responseMimeType: args.responseJsonSchema
          ? "application/json"
          : "text/plain",
        responseJsonSchema: args.responseJsonSchema
          ? z.toJSONSchema(args.responseJsonSchema)
          : undefined,
      },
    });
    if (!modelResponse.text) {
      throw new Error(JSON.stringify(modelResponse));
    }
    const result = {
      thoughts: modelResponse.candidates?.[0].content?.parts?.[0].thought
        ? modelResponse.candidates?.[0].content?.parts?.[0].text
        : undefined,
      response: modelResponse.text,
    };
    if (args.debug) {
      console.log("thoughts", result.thoughts ?? "Desactivado");
      console.log("response", result.response);
    }
    return result;
  };

  private async getStreamResult(
    modelResponse: AsyncGenerator<GenerateContentResponse, unknown, unknown>,
    debug: boolean,
  ) {
    let response = "";
    let thoughts = "";
    for await (const chunk of modelResponse) {
      if (!chunk.text && chunk.candidates?.[0].content?.parts?.[0].thought) {
        thoughts += chunk.candidates?.[0].content?.parts?.[0].text;
        if (debug)
          process.stdout.write(
            chunk.candidates?.[0].content?.parts?.[0].text ||
              "Razonamiento no encontrado",
          );
        continue;
      }
      if (debug) process.stdout.write(chunk.text || "");
      response += chunk.text || "";
    }
    process.stdout.write("\nFIN DE LA RESPUESTA\n\n");
    return { response, thoughts };
  }

  public generateResponseStream = async (
    args: GenerateResponseOptions,
  ): Promise<ModelResponse> => {
    const model = args.model ?? "gemini-flash-latest";
    const client = this._client;
    const contents = transformMessages({
      messages: args.messages,
      contextInfo: args.contextInfo,
    });
    const modelResponse = await client.models.generateContentStream({
      model,
      contents,
      config: {
        ...defaultConfig,
        ...args.config,
        systemInstruction: args.systemPrompt,
        responseMimeType: args.responseJsonSchema
          ? "application/json"
          : "text/plain",
        responseJsonSchema: args.responseJsonSchema
          ? z.toJSONSchema(args.responseJsonSchema)
          : undefined,
      },
    });
    const result = await this.getStreamResult(
      modelResponse,
      args.debug || false,
    );
    if (!result) throw new Error("Error al producir una respuesta");
    return { ...result, response: result.response };
  };
}
