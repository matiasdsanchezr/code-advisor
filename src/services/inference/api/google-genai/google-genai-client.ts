import "server-only";

import { config } from "@/lib/config";
import { type GenerateContentResponse, GoogleGenAI } from "@google/genai";
import { z } from "zod";
import { type InferenceRequestOptions } from "../../types/inference-request-options";
import { InferenceResponse } from "../../types/inference-response";
import { defaultConfig } from "./google-genai-constants";
import { mapMessagesToGenAI } from "./google-genai-mapper";

export class GoogleGenAiClient {
  protected _client = new GoogleGenAI({ apiKey: config.GENAI_API_KEY });

  public generateResponse = async (
    params: InferenceRequestOptions,
  ): Promise<InferenceResponse> => {
    const model = params.model;
    const client = this._client;
    const contents = mapMessagesToGenAI({
      messages: params.messages,
      contextInfo: params.contextInfo,
    });
    const genAiResponse = await client.models.generateContent({
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
    if (!genAiResponse.text) {
      throw new Error(JSON.stringify(genAiResponse));
    }
    const inference = {
      reasoning: genAiResponse.candidates?.[0].content?.parts?.[0].thought
        ? genAiResponse.candidates?.[0].content?.parts?.[0].text
        : undefined,
      response: genAiResponse.text,
    };
    if (params.debug) {
      console.log("reasoning", inference.reasoning);
      console.log("response", inference.response);
    }
    return inference;
  };

  private async getStreamResult(
    modelResponse: AsyncGenerator<GenerateContentResponse, unknown, unknown>,
    debug: boolean,
  ) {
    let response = "";
    let reasoning = "";
    for await (const chunk of modelResponse) {
      const chunkText = chunk.text;
      if (!chunkText && chunk.candidates?.[0].content?.parts?.[0].thought) {
        reasoning += chunk.candidates?.[0].content?.parts?.[0].text;
        if (debug)
          process.stdout.write(
            chunk.candidates?.[0].content?.parts?.[0].text ||
              "Razonamiento no encontrado",
          );
        continue;
      }
      if (debug) process.stdout.write(chunkText || "");
      response += chunkText || "";
    }
    process.stdout.write("\nFIN DE LA RESPUESTA\n\n");
    return { response, reasoning };
  }

  public generateResponseStream = async (
    params: InferenceRequestOptions,
  ): Promise<InferenceResponse> => {
    const model = params.model;
    const client = this._client;
    const contents = mapMessagesToGenAI({
      messages: params.messages,
      contextInfo: params.contextInfo,
    });
    const responseStream = await client.models.generateContentStream({
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
    const result = await this.getStreamResult(
      responseStream,
      params.debug || false,
    );
    if (!result) throw new Error("Error al producir una respuesta");
    return { ...result, response: result.response };
  };

  public generateStreamingResponse = async (
    params: InferenceRequestOptions,
  ): Promise<ReadableStream<Uint8Array>> => {
    const contents = mapMessagesToGenAI({
      messages: params.messages,
      contextInfo: params.contextInfo,
    });

    const responseStream = await this._client.models.generateContentStream({
      model: params.model,
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
        abortSignal: params.signal,
      },
    });

    const encoder = new TextEncoder();

    return new ReadableStream<Uint8Array>({
      async start(controller) {
        const sendEvent = (
          prefix: "data" | "reasoning" | "error",
          content: string,
        ) => {
          try {
            const payload =
              prefix === "error" ? content : JSON.stringify(content);
            controller.enqueue(encoder.encode(`${prefix}: ${payload}\n`));
          } catch (e) {
            console.error("Error en enqueueing:", e);
          }
        };

        try {
          for await (const chunk of responseStream) {
            const parts = chunk.candidates?.[0]?.content?.parts || [];
            const thought = parts[0]?.thought;

            if (thought && parts[0]?.text) {
              sendEvent("reasoning", parts[0].text);
              process.stdout.write(parts[0].text);
            }

            if (chunk.text) {
              sendEvent("data", chunk.text);
              process.stdout.write(chunk.text);
            }
          }

          controller.enqueue(encoder.encode("data: [DONE]"));
          controller.close();
        } catch (err) {
          if (err instanceof Error) {
            if (err.name === "AbortError") {
              console.log("Generación abortada por el usuario.");
              return;
            }
            sendEvent("error", err.message);
            controller.error(err);
            return;
          }

          const errorMessage = "Error desconocido en el stream";
          sendEvent("error", errorMessage);
          controller.error(err);
        }
      },
    });
  };
}
