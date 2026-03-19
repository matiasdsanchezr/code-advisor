import "server-only";

import { config } from "@/lib/config";
import { GoogleGenAI } from "@google/genai";
import { GoogleGenAiClient } from "../google-genai/google-genai-client";

export class GoogleVertexClient extends GoogleGenAiClient {
  protected _client = new GoogleGenAI({
    vertexai: true,
    httpOptions: { apiVersion: "v1" },
    apiKey: config.VERTEX_API_KEY,
  });
}
