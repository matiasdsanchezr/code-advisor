import "server-only";

import { spawn } from "child_process";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { AIClient } from "../../types/ai-client";
import { ModelResponse } from "../../types/model-response";
import { GenerateResponseParams } from "../../types/response-options";

export class GeminiCliClient implements AIClient {
  public generateResponse = async (
    params: GenerateResponseParams
  ): Promise<ModelResponse> => {
    const model = params.model;
    const storageDir = path.join(process.cwd(), "storage");
    const filePath = path.join(storageDir, "input.md");
    const fullPrompt = params.messages[params.messages.length - 1].content;

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

  public generateResponseStream(): Promise<ModelResponse> {
    throw new Error("Modo streaming no disponible");
  }
}
