import "server-only";

import { spawn } from "child_process";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { InferenceClient } from "../../types/inference-client";
import { InferenceRequestOptions } from "../../types/inference-request-options";
import { InferenceResponse } from "../../types/inference-response";

/**
 * Cliente que usa una instancia de Gemini Cli local para generar una respuesta usando un comando de consola
 */
export class GeminiCliClient implements InferenceClient {
  public generateResponse = async (
    params: InferenceRequestOptions
  ): Promise<InferenceResponse> => {
    const model = params.model;
    const storageDir = path.join(process.cwd(), "storage");
    const filePath = path.join(storageDir, "input.md");

    const message = params.messages[params.messages.length - 1];
    if (message.parts.some((part) => part.type === "image"))
      throw new Error("Cant process image");

    const fullPrompt = message.parts.map((part) => part.content).join("\n\n");

    await mkdir(storageDir, { recursive: true });
    await writeFile(filePath, fullPrompt, "utf8");

    return new Promise((resolve, reject) => {
      const child = spawn("gemini", [
        `@${filePath}`,
        "--model",
        model,
        "--output-format",
        "text",
      ]);

      let stdoutData = "";
      let stderrData = "";

      child.stdout.on("data", (data) => {
        stdoutData += data.toString();
      });

      child.stderr.on("data", (data) => {
        stderrData += data.toString();
      });

      child.on("close", (code) => {
        if (code !== 0) {
          console.error("Error en Gemini CLI:", stderrData);
          return reject(new Error(`El CLI falló con código ${code}`));
        }

        try {
          resolve({
            response: stdoutData,
          });
        } catch (err) {
          console.error(err);
          reject(new Error("Error al parsear la salida del CLI"));
        }
      });

      if (params.debug) {
        console.log(
          `Ejecutando comando Gemini CLI para el archivo: ${filePath}`
        );
      }
    });
  };

  public generateResponseStream(): Promise<InferenceResponse> {
    throw new Error("Modo streaming no disponible");
  }
}
