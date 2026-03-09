export interface ChatHistoryBase<T, U> {
  getCopy(): ChatHistoryBase<T, U>;

  setMessages(messages: T[]): void;

  getMessages(): T[];

  addMessage(message: T): void;

  addUserMessage(content: U): void;

  addAssistantMessage(content: U): void;

  addSystemMessage(content: string): void;
}
