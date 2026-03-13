import "server-only";

import { config } from "@/lib/config";
import { GoogleGenAI } from "@google/genai";
import { GenAIClient } from "../genai/client";

export class VertexClient extends GenAIClient {
  protected _client = new GoogleGenAI({
    vertexai: true,
    httpOptions: { apiVersion: "v1" },
    apiKey: config.VERTEX_API_KEY,
  });
}
