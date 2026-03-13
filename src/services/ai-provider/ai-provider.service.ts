import { config } from "@/lib/config";
import { GeminiCliClient } from "./api/gemini-cli/client";
import { GenAIClient } from "./api/genai/client";
import { NvidiaNimClient } from "./api/nvidia-nim/client";
import { OpenRouterClient } from "./api/open-router/client";
import { VertexClient } from "./api/vertex/client";
import { AIClient } from "./types/ai-client";

export class AiProviderService {
  private static _instance: AiProviderService;

  private _model: string = config.MODEL;
  private _locked: boolean = false;
  private _client: AIClient;

  private constructor() {
    switch (config.AI_PROVIDER) {
      case "genai":
        this._client = new GenAIClient();
        break;
      case "gemini-cli":
        this._client = new GeminiCliClient();
        break;
      case "open-router":
        this._client = new OpenRouterClient();
        break;
      case "nvidia-nim":
        this._client = new NvidiaNimClient();
        break;
      case "vertex":
        this._client = new VertexClient();
        break;
      default:
        this._client = new VertexClient();
        break;
    }
  }

  public get provider() {
    return config.AI_PROVIDER;
  }

  public get isBusy() {
    return this._locked;
  }

  public get model() {
    return this._model;
  }

  public static async getInstance(): Promise<AiProviderService> {
    if (!AiProviderService._instance) {
      AiProviderService._instance = new AiProviderService();
    }
    return AiProviderService._instance;
  }

  public async generateContent(systemPrompt: string, userInput: string) {
    if (this._locked) {
      throw new Error(
        "El LLM está ocupado. Esperá a que finalice la tarea actual."
      );
    }
    this._locked = true;
    try {
      if (!this._client.generateResponseStream)
        throw new Error("Modo streaming no disponible");
      const modelResponse = await this._client.generateResponseStream({
        systemPrompt,
        messages: [{ role: "user", content: userInput }],
        config: { temperature: 1 },
        model: this._model,
        debug: true,
      });
      return modelResponse;
    } catch (e) {
      throw e;
    } finally {
      this._locked = false;
    }
  }
}
