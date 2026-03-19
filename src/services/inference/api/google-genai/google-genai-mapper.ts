import { type Content } from "@google/genai";
import { type Message } from "../../schemas/message.schema";

type TransformMessagesParams = {
  messages: Message[];
  contextInfo?: string;
};

export const mapMessagesToGenAI = ({
  messages,
  contextInfo,
}: TransformMessagesParams): Content[] => {
  const genAiContents: Content[] = messages.map((message) => ({
    role: message.role === "user" ? "user" : "model",
    parts: [{ text: message.content }],
  }));

  if (contextInfo)
    genAiContents.push(
      {
        role: "model",
        parts: [
          {
            functionCall: {
              name: "get_context_info",
              args: { location: "context_placeholder" },
            },
          },
        ],
      },
      {
        role: "user",
        parts: [
          {
            functionResponse: {
              name: "get_context_info",
              response: { contextInfo },
            },
          },
        ],
      },
    );
  return genAiContents;
};
