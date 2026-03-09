import { spawn } from "child_process";
import { mkdirSync, writeFileSync } from "fs";
import path from "path";
import "server-only";
import { Message } from "../../schemas/message.schema";
import { type GeminiModel } from "../genai/default-config";

export type GenerateResponseOptions = {
  systemPrompt: string;
  messages: Message[];
  contextInfo?: string;
  debug?: boolean;
  model?: GeminiModel | string;
  config?: {
    signal?: AbortSignal;
    temperature?: number;
    topP?: number;
    topK?: number;
  };
};

type ModelResponse = {
  response: string;
  thoughts?: string;
};

export class GeminiCliClient {
  public generateResponse = async (
    args: GenerateResponseOptions
  ): Promise<ModelResponse> => {
    const model = args.model ?? "gemini-2.0-flash";
    const signal = args.config?.signal;

    const storageDir = path.join(process.cwd(), "storage");
    const filePath = path.join(storageDir, "input.md");

    // Construcción del Prompt
    const fullPrompt = args.messages[args.messages.length - 1].content;

    mkdirSync(storageDir, { recursive: true });
    writeFileSync(filePath, fullPrompt, "utf8");

    return new Promise((resolve, reject) => {
      // Argumentos para el comando gemini
      const child = spawn("gemini", [
        `@${filePath}`,
        "--model",
        model,
        "--output-format",
        "text",
      ]);

      let stdoutData = "";
      let stderrData = "";

      if (signal) {
        if (signal.aborted) {
          child.kill();
          return reject(new Error("Operación abortada prematuramente"));
        }
        signal.addEventListener("abort", () => {
          child.kill("SIGTERM");
          reject(new Error("Operación abortada por el usuario"));
        });
      }

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

      if (args.debug) {
        console.log(
          `Ejecutando comando Gemini CLI para el archivo: ${filePath}`
        );
      }
    });
  };
}
