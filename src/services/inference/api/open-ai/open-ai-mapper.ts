import {
  ChatCompletionContentPart,
  ChatCompletionContentPartImage,
  ChatCompletionContentPartText,
  ChatCompletionMessageParam,
} from "openai/resources";
import { Message, MessagePart } from "../../schemas/message.schema";

type TransformMessagesParams = {
  messages: Message[];
};

const transformToOpenAiPart = (
  part: MessagePart
): ChatCompletionContentPart => {
  if (part.type === "image") {
    return {
      type: "image_url",
      image_url: {
        url: `data:${part.mimeType};base64,${part.content}`,
        detail: "auto",
      },
    } as ChatCompletionContentPartImage;
  }

  return { type: "text", text: part.content } as ChatCompletionContentPartText;
};

export const mapMessagesToOpenAi = ({
  messages,
}: TransformMessagesParams): ChatCompletionMessageParam[] => {
  const transformedMessages: ChatCompletionMessageParam[] = messages.map(
    (message) => {
      if (message.role === "user") {
        const parts = message.parts.map((part) => transformToOpenAiPart(part));
        return {
          role: "user",
          content: parts,
        };
      }

      if (message.role === "assistant") {
        const parts: Array<ChatCompletionContentPartText> | null =
          message.parts.map((part) => {
            if (part.type !== "text") {
              throw new Error("Invalid part type");
            }
            return transformToOpenAiPart(part) as ChatCompletionContentPartText;
          });
        return {
          role: "assistant",
          content: parts,
        };
      }

      if (message.role === "system") {
        const parts: Array<ChatCompletionContentPartText> | null =
          message.parts.map((part) => {
            if (part.type !== "text") {
              throw new Error("Invalid part type");
            }
            return transformToOpenAiPart(part) as ChatCompletionContentPartText;
          });
        return {
          role: "system",
          content: parts,
        };
      }

      throw new Error("Invalid message type");
    }
  );
  return transformedMessages;
};
