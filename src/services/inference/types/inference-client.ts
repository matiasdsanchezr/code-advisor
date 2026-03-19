import { InferenceRequestOptions } from "./inference-request-options";
import { InferenceResponse } from "./inference-response";

export type InferenceClient = {
  generateResponse: (
    params: InferenceRequestOptions,
  ) => Promise<InferenceResponse>;
  generateResponseStream: (
    params: InferenceRequestOptions,
  ) => Promise<InferenceResponse>;
};
