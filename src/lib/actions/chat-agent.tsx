"use server";
import { ChatCompletionAgent } from "@/services/chat-completion/chat-completion.service";
import { FormState } from "@/types/form-state";
import fs from "node:fs/promises";
import path from "node:path";

export async function getChatAgentState() {
  const agent = await ChatCompletionAgent.getInstance();
  return { model: agent.model, isBusy: agent.isBusy, provider: agent.provider };
}

export async function generateResponse(
  prevState: FormState,
  formData: FormData
): Promise<FormState> {
  try {
    const instruction = formData.get("instruction") as string;
    const input = formData.get("input") as string;

    const agent = await ChatCompletionAgent.getInstance();
    const modelResponse = await agent.generateContent(instruction, input);

    await fs.writeFile(
      path.join(process.cwd(), "response.txt"),
      modelResponse.response,
      "utf-8"
    );

    return {
      success: true,
      message: "Respuesta generada correctamente",
      fieldErrors: {},
      timestamp: Date.now(),
      data: {
        response: modelResponse.response,
        thoughts: modelResponse.thoughts,
      },
    };
  } catch (error: unknown) {
    const status = (error as { status?: number })?.status;
    console.error("Error en generateResponse:", error);
    if (status == 429)
      return {
        success: false,
        message:
          "Error al generar la respuesta. No hay capacidad para el modelo establecido",
        fieldErrors: {},
        timestamp: Date.now(),
      };

    return {
      success: false,
      message: "Se produjo un error desconocido al generar la respuesta",
      fieldErrors: {},
      timestamp: Date.now(),
    };
  }
}
