import { create } from "zustand";
import { persist } from "zustand/middleware";
import { GeneratePromptResponse } from "@/lib/actions/get-source-code";
import { AgentResponse } from "@/types/agent-response";

const DEFAULT_SYSTEM_PROMPT =
  "Eres un asistente experto en análisis de código fuente. Analiza el código proporcionado y responde de forma clara y concisa.";

const INITIAL_PROMPT_RESPONSE: GeneratePromptResponse = {
  files: [],
};

interface ChatState {
  selectedFiles: string[];
  userQuery: string;
  systemPrompt: string;
  promptData: GeneratePromptResponse;
  agentResponse: AgentResponse;
}

interface ChatActions {
  setSelectedFiles: (files: string[]) => void;
  setUserQuery: (query: string) => void;
  setSystemPrompt: (prompt: string) => void;
  setPromptData: (data: GeneratePromptResponse) => void;
  setAgentResponse: (response: AgentResponse) => void;
  resetSystemPrompt: () => void;
  resetChatResult: () => void;
  resetAll: () => void;
}

const initialState: ChatState = {
  selectedFiles: [],
  userQuery: "",
  systemPrompt: DEFAULT_SYSTEM_PROMPT,
  promptData: INITIAL_PROMPT_RESPONSE,
  agentResponse: { response: "" },
};

export const useChatStore = create<ChatState & ChatActions>()(
  persist(
    (set) => ({
      ...initialState,

      setSelectedFiles: (files) => set({ selectedFiles: files }),
      setUserQuery: (query) => set({ userQuery: query }),
      setSystemPrompt: (prompt) => set({ systemPrompt: prompt }),
      setPromptData: (data) => set({ promptData: data }),
      setAgentResponse: (response) => set({ agentResponse: response }),

      resetSystemPrompt: () => set({ systemPrompt: DEFAULT_SYSTEM_PROMPT }),

      resetChatResult: () =>
        set({
          promptData: INITIAL_PROMPT_RESPONSE,
          agentResponse: { response: "" },
        }),

      resetAll: () => set(initialState),
    }),
    {
      name: "chat-state",
      partialize: (state) => ({
        selectedFiles: state.selectedFiles,
        userQuery: state.userQuery,
        systemPrompt: state.systemPrompt,
        agentResponse: state.agentResponse,
      }),
    },
  ),
);
