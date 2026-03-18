import "server-only";

import { config } from "@/lib/config";
import {
  GenerateContentConfig,
  GenerateContentResponse,
  GoogleGenAI,
} from "@google/genai";
import z from "zod/v4";
import { ModelResponse } from "../../types/model-response";
import { GenerateResponseParams } from "../../types/response-options";
import { transformMessages } from "./content-utils";
import { defaultConfig } from "./default-config";
import { AIClient } from "../../types/ai-client";
import logger from "@/lib/logger";

export type GenAIGenerateResponseParams = GenerateResponseParams & {
  config: GenerateContentConfig;
};

export class GenAIClient implements AIClient {
  protected _client = new GoogleGenAI({ apiKey: config.GENAI_API_KEY });

  public generateResponse = async (
    params: GenAIGenerateResponseParams
  ): Promise<ModelResponse> => {
    const model = params.model;
    const client = this._client;
    const contents = transformMessages({
      messages: params.messages,
      contextInfo: params.contextInfo,
    });
    const generatedContent = await client.models.generateContent({
      model,
      contents,
      config: {
        ...defaultConfig,
        ...params.config,
        systemInstruction: params.systemPrompt,
        responseMimeType: params.responseJsonSchema
          ? "application/json"
          : "text/plain",
        responseJsonSchema: params.responseJsonSchema
          ? z.toJSONSchema(params.responseJsonSchema)
          : undefined,
      },
    });
    logger.debug(generatedContent);
    if (!generatedContent.text) {
      throw new Error(JSON.stringify(generatedContent));
    }
    const result = {
      thoughts: generatedContent.candidates?.[0].content?.parts?.[0].thought
        ? generatedContent.candidates?.[0].content?.parts?.[0].text
        : undefined,
      response: generatedContent.text,
    };
    return result;
  };

  private async getStreamResult(
    modelResponse: AsyncGenerator<GenerateContentResponse, unknown, unknown>
  ) {
    logger.debug("INICIO DE STREAMING DE RESPUESTA");
    let response = "";
    let thoughts = "";
    const debug = logger.isLevelEnabled("debug");
    for await (const chunk of modelResponse) {
      if (!chunk.text && chunk.candidates?.[0].content?.parts?.[0].thought) {
        thoughts += chunk.candidates?.[0].content?.parts?.[0].text;
        if (debug) {
          process.stdout.write(
            chunk.candidates?.[0].content?.parts?.[0].text || ""
          );
        }
        continue;
      }
      if (debug) {
        process.stdout.write(chunk.text || "");
      }
      response += chunk.text || "";
    }
    logger.debug("FIN DE STREAMING DE RESPUESTA");
    return { response, thoughts };
  }

  public generateResponseStream = async (
    args: GenAIGenerateResponseParams
  ): Promise<ModelResponse> => {
    const model = args.model;
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
    const result = await this.getStreamResult(modelResponse);
    if (!result) throw new Error("Error al producir una respuesta");
    return { ...result, response: result.response };
  };
}
