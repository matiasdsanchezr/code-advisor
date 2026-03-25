import { Part, type Content } from "@google/genai";
import { MessagePart, type Message } from "../../schemas/message.schema";

type TransformMessagesParams = {
  messages: Message[];
  contextInfo?: string;
};

const transformToGenAiPart = (part: MessagePart): Part => {
  if (part.type === "image") {
    return { inlineData: { mimeType: part.mimeType, data: part.content } };
  }

  return { text: part.content };
};

export const mapMessagesToGenAI = ({
  messages,
  contextInfo,
}: TransformMessagesParams): Content[] => {
  const genAiContents: Content[] = messages.map((message) => ({
    role: message.role === "user" ? "user" : "model",
    parts: message.parts.map((part) => transformToGenAiPart(part)),
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
      }
    );
  return genAiContents;
};
