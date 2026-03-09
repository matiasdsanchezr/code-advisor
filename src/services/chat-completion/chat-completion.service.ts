import { config } from "@/lib/utils/config";
import { GeminiCliClient } from "./api/gemini-cli/client";
import { GenAIClient } from "./api/genai/client";
import { NvidiaNimClient } from "./api/nvidia-nim/client";
import { OpenRouterClient } from "./api/open-router/client";
import { VertexClient } from "./api/vertex/client";

type Client =
  | VertexClient
  | GenAIClient
  | GeminiCliClient
  | OpenRouterClient
  | NvidiaNimClient;

export class ChatCompletionAgent {
  private static _instance: ChatCompletionAgent;

  private _model: string = config.MODEL;
  private _locked: boolean = false;
  private _client: Client;

  private constructor() {
    console.log(`Inicializando agente con proveedor: ${config.AI_PROVIDER}`);
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

  public static async getInstance(): Promise<ChatCompletionAgent> {
    if (!ChatCompletionAgent._instance) {
      ChatCompletionAgent._instance = new ChatCompletionAgent();
    }
    return ChatCompletionAgent._instance;
  }

  public async generateContent(systemPrompt: string, userInput: string) {
    if (this._locked)
      throw new Error(
        "El LLM está ocupado. Esperá a que finalice la tarea actual."
      );

    this._locked = true;
    try {
      const modelResponse = await this._client.generateResponse({
        systemPrompt,
        messages: [{ role: "user", content: userInput }],
        config: {
          // abortSignal: AbortSignal.timeout(120 * 1000),
          // maxOutputTokens: 30000,
          temperature: 1,
        },
        model: this._model,
      });
      return modelResponse;
    } finally {
      this._locked = false;
    }
  }
}
