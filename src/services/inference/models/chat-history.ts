import { Message } from "../schemas/message.schema";
import { ChatHistoryBase } from "../types/chat-history-base";

export class ChatHistory implements ChatHistoryBase<Message, string> {
  private _messages: Message[] = [];

  constructor(messages: Message[] = []) {
    this._messages = messages;
  }

  public clone = () => {
    return new ChatHistory([...this._messages]);
  };

  public setMessages = (messages: Message[]) => {
    this._messages = messages.map((message) => ({
      role: message.role === "user" ? "user" : "assistant",
      parts: message.parts,
    }));
  };

  public getMessages = () => {
    return this._messages;
  };

  public addMessage = (message: Message) => {
    this._messages.push(message);
  };

  public addUserMessage = (message: string) => {
    this._messages.push({
      role: "user",
      parts: [{ type: "text", content: message }],
    });
  };

  public addAssistantMessage = (message: string) => {
    this._messages.push({
      role: "assistant",
      parts: [{ type: "text", content: message }],
    });
  };

  public addSystemMessage = (message: string) => {
    this._messages.push({
      role: "system",
      parts: [{ type: "text", content: message }],
    });
  };
}
