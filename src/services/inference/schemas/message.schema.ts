import { z } from "zod/v4";

export const MessagePartType = ["text", "image"];

export const TextPartSchema = z.object({
  type: z.literal("text"),
  content: z.string().describe("Message content"),
});

export const ImagePartSchema = z.object({
  type: z.literal("image"),
  content: z.string().describe("Base64 encoded image data"),
  mimeType: z.string().describe("MIME type of the image"),
});

export const MessagePartSchema = z
  .discriminatedUnion("type", [TextPartSchema, ImagePartSchema])
  .describe("Parte de un mensaje");

export const MessageSchema = z
  .object({
    role: z
      .enum(["user", "assistant", "system"])
      .describe("Role of the message sender"),
    parts: z.array(MessagePartSchema).describe("Message content"),
  })
  .required();

export type Message = z.infer<typeof MessageSchema>;
export type MessagePart = z.infer<typeof MessagePartSchema>;
