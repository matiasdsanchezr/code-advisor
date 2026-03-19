import { Message } from "../schemas/message.schema";
import { ChatHistoryBase } from "../types/chat-history-base";

export class ChatHistory implements ChatHistoryBase<Message, string> {
  private messages: Message[] = [];

  constructor(messages: Message[] = []) {
    this.messages = messages;
  }

  public clone = () => {
    return new ChatHistory([...this.messages]);
  };

  public setMessages = (messages: Message[]) => {
    this.messages = messages.map((message) => ({
      role: message.role === "user" ? "user" : "assistant",
      content: message.content,
    }));
  };

  public getMessages = () => {
    return this.messages;
  };

  public addMessage = (message: Message) => {
    this.messages.push(message);
  };

  public addUserMessage = (message: string) => {
    this.messages.push({ role: "user", content: message });
  };

  public addAssistantMessage = (message: string) => {
    this.messages.push({ role: "assistant", content: message });
  };

  public addSystemMessage = (message: string) => {
    this.messages.push({ role: "system", content: message });
  };
}
