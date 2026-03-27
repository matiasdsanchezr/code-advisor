import { InferenceProvider } from "@/services/inference/schemas/provider-schema";
import { InferenceModel } from "@/services/inference/types/inference-model";
import { AgentResponse } from "@/types/agent-response";
import { FileContent } from "@/types/file-content";
import { create } from "zustand";
import { persist } from "zustand/middleware";

const DEFAULT_SYSTEM_PROMPT =
  "Eres un asistente experto en análisis de código fuente. Analiza el código proporcionado y responde de forma clara y concisa.";
const DEFAULT_PROVIDER: InferenceProvider = "vertex";
const DEFAULT_MODEL = "gemini-2.5-flash";

interface ChatState {
  config: InferenceModel;
  selectedFiles: string[];
  userQuery: string;
  systemPrompt: string;
  fileContents: FileContent[];
  agentResponse: AgentResponse;
  includeDependencies: boolean;
  imageUrls: string;
}

interface ChatActions {
  setConfig: (config: InferenceModel) => void;
  setSelectedFiles: (files: string[]) => void;
  setUserQuery: (query: string) => void;
  setImageUrls: (urls: string) => void;
  setSystemPrompt: (prompt: string) => void;
  setFileContents: (data: FileContent[]) => void;
  setAgentResponse: (response: AgentResponse) => void;
  setIncludeDependencies: (val: boolean) => void;
  resetSystemPrompt: () => void;
  resetChatResult: () => void;
  resetAll: () => void;
}

const initialState: ChatState = {
  config: {
    provider: DEFAULT_PROVIDER,
    model: DEFAULT_MODEL,
  },
  selectedFiles: [],
  userQuery: "",
  systemPrompt: DEFAULT_SYSTEM_PROMPT,
  fileContents: [],
  agentResponse: { response: "" },
  includeDependencies: true,
  imageUrls: "",
};

export const useChatStore = create<ChatState & ChatActions>()(
  persist(
    (set) => ({
      ...initialState,

      setConfig: (config) => set({ config }),
      setSelectedFiles: (files) => set({ selectedFiles: files }),
      setUserQuery: (query) => set({ userQuery: query }),
      setImageUrls: (urls) => set({ imageUrls: urls }),
      setSystemPrompt: (prompt) => set({ systemPrompt: prompt }),
      setFileContents: (data) => set({ fileContents: data }),
      setAgentResponse: (response) => set({ agentResponse: response }),
      setIncludeDependencies: (val) => set({ includeDependencies: val }),

      resetSystemPrompt: () => set({ systemPrompt: DEFAULT_SYSTEM_PROMPT }),
      resetChatResult: () =>
        set({
          fileContents: [],
          agentResponse: { response: "" },
        }),

      resetAll: () => set(initialState),
    }),
    {
      name: "chat-state",
      partialize: (state) => ({
        config: state.config,
        selectedFiles: state.selectedFiles,
        userQuery: state.userQuery,
        systemPrompt: state.systemPrompt,
        agentResponse: state.agentResponse,
        includeDependencies: state.includeDependencies,
      }),
    },
  ),
);
