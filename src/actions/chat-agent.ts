"use server";

import { config } from "@/lib/config";
import { generateContent } from "@/services/inference/inference-service";
import { ActionState } from "@/types/action-state";
import { AgentResponse } from "@/types/agent-response";
import fs from "node:fs/promises";
import path from "node:path";

export async function generateAiAnswer(
  _prevState: ActionState<AgentResponse>,
  formData: FormData,
): Promise<ActionState<AgentResponse>> {
  try {
    const instruction = formData.get("instruction") as string;
    const input = formData.get("input") as string;
    const modelResponse = await generateContent({
      systemPrompt: instruction,
      config: { temperature: 1 },
      messages: [{ role: "user", content: input }],
      model: config.MODEL,
    });
    await fs.writeFile(
      path.join(process.cwd(), "storage", "outputs", "response.md"),
      modelResponse.response,
      "utf-8",
    );

    return { data: modelResponse };
  } catch (e: unknown) {
    const error = e as { status?: number };
    if (error.status == 429) {
      return { error: "No hay capacidad para el modelo establecido" };
    }
    return {
      error: "Se produjo un error desconocido al generar la respuesta",
    };
  }
}
