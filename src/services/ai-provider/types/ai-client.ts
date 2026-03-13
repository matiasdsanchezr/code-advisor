import { ModelResponse } from "./model-response";
import { GenerateResponseParams } from "./response-options";

export type AIClient = {
  generateResponse: (params: GenerateResponseParams) => Promise<ModelResponse>;
  generateResponseStream: (
    params: GenerateResponseParams
  ) => Promise<ModelResponse>;
};
