"use server";

import { generateContent as generateContentService } from "@/services/inference/inference-service";
import { MessagePart } from "@/services/inference/schemas/message.schema";
import { InferenceProvider } from "@/services/inference/schemas/provider-schema";
import { ActionState } from "@/types/action-state";
import { AgentResponse } from "@/types/agent-response";
import fs from "node:fs/promises";
import path from "node:path";

export async function generateContent(
  _prevState: ActionState<AgentResponse>,
  formData: FormData
): Promise<ActionState<AgentResponse>> {
  try {
    const instruction = formData.get("instruction") as string;
    const input = formData.get("input") as string;
    const imageUrls = (formData.get("imageUrls") as string) || "";
    const provider = formData.get("provider") as InferenceProvider;
    const model = formData.get("model") as string;

    if (!provider) return { error: "Proveedor no especificado" };

    if (!model) return { error: "Modelo no especificado" };

    const parts: MessagePart[] = [];

    if (imageUrls) {
      const urls = imageUrls
        .split("\n")
        .map((src) => src.trim())
        .filter((src) => src.length > 0);

      const base64Images = await Promise.all(
        urls.map((src) => fetchImage(src))
      );

      parts.push(
        ...base64Images.map(
          (img) =>
            ({
              type: "image",
              content: img.content,
              mimeType: img.mimeType,
            } as MessagePart)
        )
      );
    }

    parts.push({ type: "text", content: input });

    const modelResponse = await generateContentService({
      provider,
      systemPrompt: instruction,
      config: { temperature: 1 },
      messages: [{ role: "user", parts }],
      model,
    });

    await fs.writeFile(
      path.join(process.cwd(), "storage", "outputs", "response.md"),
      modelResponse.response,
      "utf-8"
    );

    return {
      data: modelResponse,
    };
  } catch (e: unknown) {
    const error = e as { status?: number };
    if (error.status == 429) {
      return {
        error: "No hay capacidad para el modelo establecido",
      };
    }
    console.error(e);
    return {
      error: "Se produjo un error desconocido al generar la respuesta",
    };
  }
}

export type ImageFile = {
  mimeType: string;
  content: string;
};

const fetchImage = async (src: string): Promise<ImageFile> => {
  const response = await fetch(src);
  if (!response.ok) throw new Error(`Error al cargar la imagen con url ${src}`);

  const mime =
    response.headers.get("content-type") ||
    response.headers.get("Content-Type");

  if (!mime || !mime.startsWith("image/"))
    throw new Error(`Error al cargar la imagen, MIME invalido. Url: ${src}`);

  const imageArrayBuffer = await response.arrayBuffer();
  const base64ImageData = Buffer.from(imageArrayBuffer).toString("base64");
  return { mimeType: mime, content: base64ImageData };
};

export async function analyzeImages(
  _prevState: ActionState<string[]>,
  formData: FormData
): Promise<ActionState<ImageFile[]>> {
  try {
    const imgSrcs = formData.get("image-urls") as string;
    if (!imgSrcs || imgSrcs.trim() === "") {
      return {};
    }

    const urls = imgSrcs
      .split(",")
      .map((src) => src.trim())
      .filter((src) => src.length > 0);

    const base64Images = await Promise.all(urls.map((src) => fetchImage(src)));

    return { data: base64Images };
  } catch (e: unknown) {
    console.error("Error al procesar imágenes:", e);
    return {
      error: "Error al obtener o procesar las imágenes proporcionadas",
    };
  }
}
