import { z } from 'zod/v4';

export const MessageContentSchema = z.object({
  functionCall: z
    .object({
      name: z.string().describe('Name of the function to call'),
      args: z
        .record(z.string(), z.unknown())
        .describe('Arguments for the function'),
    })
    .optional(),
  functionResponse: z
    .object({
      name: z.string().describe('Name of the function to call'),
      response: z.record(z.string(), z.unknown()).describe('Function Response'),
    })
    .optional(),
  text: z.string().optional().describe('Message content'),
});

export const MessageSchema = z
  .object({
    role: z
      .enum(['user', 'assistant', 'system'])
      .describe('Role of the message sender'),
    content: z.string(),
  })
  .required();

export type Message = z.infer<typeof MessageSchema>;
export type MessageContent = z.infer<typeof MessageContentSchema>;
