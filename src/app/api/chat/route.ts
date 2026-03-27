import { generateContentStreaming } from "@/services/inference/inference-service";
import { ChatHistory } from "@/services/inference/models/chat-history";
import { Message } from "@/services/inference/schemas/message.schema";
import { InferenceProviderEnum } from "@/services/inference/schemas/provider-schema";
import { NextRequest } from "next/server";
import { z } from "zod";

const ChatCompletionRequestSchema = z.object({
  input: z.string().trim().min(1, "El input no puede estar vacío"),
  instruction: z.string().default(""),
  provider: InferenceProviderEnum,
  model: z.string().trim().min(1),
  imageUrls: z.string().default(""),
});

type ChatCompletionRequest = z.infer<typeof ChatCompletionRequestSchema>;

async function fetchImageAsBase64(
  url: string,
): Promise<{ mimeType: string; data: string } | null> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(10_000) });
    if (!res.ok) return null;

    const contentType = res.headers.get("content-type") ?? "image/png";
    const buffer = await res.arrayBuffer();
    const data = Buffer.from(buffer).toString("base64");
    return { mimeType: contentType.split(";")[0], data };
  } catch {
    return null;
  }
}

async function buildUserMessage(body: ChatCompletionRequest): Promise<Message> {
  const textPart: Message["parts"][number] = {
    type: "text",
    content: body.input,
  };

  const urls = body.imageUrls
    .split("\n")
    .map((u) => u.trim())
    .filter(Boolean);

  if (urls.length === 0) {
    return { role: "user", parts: [textPart] };
  }

  const imageResults = await Promise.all(urls.map(fetchImageAsBase64));

  const imageParts: Message["parts"] = imageResults
    .filter((r): r is NonNullable<typeof r> => r !== null)
    .map((img) => ({
      type: "image" as const,
      content: img.data,
      mimeType: img.mimeType,
    }));

  return { role: "user", parts: [textPart, ...imageParts] };
}

const SSE_HEADERS = {
  "Content-Type": "text/event-stream; charset=utf-8",
  "Cache-Control": "no-cache, no-transform",
  Connection: "keep-alive",
  "X-Accel-Buffering": "no", // desactiva buffering en Nginx/Vercel
} as const;

export async function POST(req: NextRequest): Promise<Response> {
  let body: ChatCompletionRequest;
  try {
    const raw = await req.json();
    const parsed = ChatCompletionRequestSchema.safeParse(raw);

    if (!parsed.success) {
      return Response.json(
        { error: z.prettifyError(parsed.error) },
        { status: 400 },
      );
    }
    body = parsed.data;
  } catch {
    return Response.json({ error: "Request body inválido" }, { status: 400 });
  }

  const userMessage = await buildUserMessage(body);
  const history = new ChatHistory([userMessage]);

  let readableStream: ReadableStream<Uint8Array>;

  try {
    readableStream = await generateContentStreaming({
      provider: body.provider,
      model: body.model,
      systemPrompt: body.instruction,
      messages: history.getMessages(),
      config: {},
      signal: req.signal,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error desconocido";
    return Response.json({ error: message }, { status: 500 });
  }

  return new Response(readableStream, { headers: SSE_HEADERS });
}

// import { GoogleGenAiClient } from "@/services/inference/api/google-gemini-cli/google-gemini-cli-client";
// import { InferenceProvider } from "@/services/inference/schemas/provider-schema";
// import { convertToModelMessages, UIMessage } from "ai";
// // import { streamText, UIMessage, convertToModelMessages } from "ai";

// export async function POST(req: Request) {
//   const {
//     messages,
//     provider,
//     model,
//     systemPrompt,
//   }: {
//     messages: UIMessage[];
//     provider: InferenceProvider;
//     model: string;
//     systemPrompt: string;
//   } = await req.json();
//   console.log(provider, model, systemPrompt);
//   console.log(JSON.stringify(messages));
//   const client = new GoogleGenAiClient();
//   const result = client.generateResponse({
//     config: {},
//     messages: await convertToModelMessages(messages),
//     model,
//     provider,
//     systemPrompt,
//   });

//   return result.toUIMessageStreamResponse({ sendReasoning: true });
// }
