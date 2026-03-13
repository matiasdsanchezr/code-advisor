import { AgentResponse } from "@/types/agent-response";
import { FileContent } from "@/types/file-content";
import { create } from "zustand";
import { persist } from "zustand/middleware";

const DEFAULT_SYSTEM_PROMPT =
  "Eres un asistente experto en análisis de código fuente. Analiza el código proporcionado y responde de forma clara y concisa.";

interface ChatState {
  selectedFiles: string[];
  userQuery: string;
  systemPrompt: string;
  fileContents: FileContent[];
  agentResponse: AgentResponse;
}

interface ChatActions {
  setSelectedFiles: (files: string[]) => void;
  setUserQuery: (query: string) => void;
  setSystemPrompt: (prompt: string) => void;
  setFileContents: (data: FileContent[]) => void;
  setAgentResponse: (response: AgentResponse) => void;
  resetSystemPrompt: () => void;
  resetChatResult: () => void;
  resetAll: () => void;
}

const initialState: ChatState = {
  selectedFiles: [],
  userQuery: "",
  systemPrompt: DEFAULT_SYSTEM_PROMPT,
  fileContents: [],
  agentResponse: { response: "" },
};

export const useChatStore = create<ChatState & ChatActions>()(
  persist(
    (set) => ({
      ...initialState,

      setSelectedFiles: (files) => set({ selectedFiles: files }),
      setUserQuery: (query) => set({ userQuery: query }),
      setSystemPrompt: (prompt) => set({ systemPrompt: prompt }),
      setFileContents: (data) => set({ fileContents: data }),
      setAgentResponse: (response) => set({ agentResponse: response }),

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
        selectedFiles: state.selectedFiles,
        userQuery: state.userQuery,
        systemPrompt: state.systemPrompt,
        agentResponse: state.agentResponse,
      }),
    }
  )
);
