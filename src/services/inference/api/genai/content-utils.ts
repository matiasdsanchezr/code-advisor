import { type Content } from "@google/genai";
import { type Message } from "../../schemas/message.schema";
type TransformMessagesParams = {
  messages: Message[];
  contextInfo?: string;
};

export const transformMessages = ({
  messages,
  contextInfo,
}: TransformMessagesParams): Content[] => {
  const contents: Content[] = messages.map((message) => ({
    role: message.role === "user" ? "user" : "model",
    parts: [{ text: message.content }],
  }));

  if (contextInfo)
    contents.push(
      {
        role: "model",
        parts: [
          {
            functionCall: {
              name: "get_context_info",
              args: { location: "current_location" },
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
      }
    );
  return contents;
};
