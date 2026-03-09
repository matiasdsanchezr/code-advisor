import { Message } from '../schemas/message.schema';
import { ChatHistoryBase } from '../types';

export class ChatHistory implements ChatHistoryBase<Message, string> {
  private history: Message[] = [];

  constructor(messages: Message[] = []) {
    this.history = messages;
  }

  public getCopy = () => {
    return new ChatHistory([...this.history]);
  };

  public setMessages = (messages: Message[]) => {
    this.history = messages.map((message) => ({
      role: message.role === 'user' ? 'user' : 'assistant',
      content: message.content
    }));
  };

  public getMessages = () => {
    return this.history;
  };

  public addMessage = (message: Message) => {
    this.history.push(message);
  };

  public addUserMessage = (message: string) => {
    this.history.push({ role: 'user', content: message });
  };

  public addAssistantMessage = (message: string) => {
    this.history.push({ role: 'assistant', content: message });
  };

  public addSystemMessage = (message: string) => {
    this.history.push({ role: 'system', content: message });
  };
}
