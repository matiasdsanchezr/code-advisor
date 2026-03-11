import { ChatCompletionAgent } from "@/services/chat-completion/chat-completion.service";

export type ChatAgentState = {
  model: string;
  isBusy: boolean;
  provider: string;
};

export async function getChatAgentState() {
  const agent = await ChatCompletionAgent.getInstance();
  return { model: agent.model, isBusy: agent.isBusy, provider: agent.provider };
}
