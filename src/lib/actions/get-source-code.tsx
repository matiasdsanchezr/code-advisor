"use server";

import { FileContent } from "@/types/file-content";
import fs from "fs/promises";
import path from "path";
import { z } from "zod";
import { config } from "../utils/config";
import { ActionState } from "@/types/action-state";

const ALLOWED_EXTENSIONS = new Set([".tsx", ".ts", ".js", ".md", ".json"]);

const FilePathsSchema = z.object({
  filePaths: z.array(z.string().trim().min(1)).min(1).max(200),
});

const GeneratePromptSchema = z.object({
  filePaths: z.array(z.string().trim().min(1)).min(1).max(200),
});

const getFileSourceCode = (fileContent: FileContent): string => {
  if (fileContent.error) return "";

  const fileName = path.basename(fileContent.path);
  const ext = path.extname(fileName).slice(1) || "txt";

  return `\
[${fileName}](${fileContent.path})

\`\`\`${ext}
${fileContent.content}
\`\`\``;
};

function isPathInsideBase(basePath: string, candidatePath: string) {
  const relative = path.relative(basePath, candidatePath);
  return (
    relative === "" ||
    (!relative.startsWith("..") && !path.isAbsolute(relative))
  );
}

async function readSelectedFiles(paths: string[]): Promise<FileContent[]> {
  const basePath = path.resolve(config.TARGET_PROJECT_PATH);
  const uniquePaths = [...new Set(paths)].map((p) => path.resolve(p));

  return Promise.all(
    uniquePaths.map(async (candidatePath) => {
      const ext = path.extname(candidatePath).toLowerCase();

      if (!isPathInsideBase(basePath, candidatePath)) {
        return {
          path: candidatePath,
          content: "",
          error: "Ruta inválida: el archivo está fuera del proyecto permitido",
        };
      }

      if (!ALLOWED_EXTENSIONS.has(ext)) {
        return {
          path: candidatePath,
          content: "",
          error: `Extensión no permitida: ${ext || "(sin extensión)"}`,
        };
      }

      try {
        const content = await fs.readFile(candidatePath, "utf-8");
        const sourceCode = getFileSourceCode({ path: candidatePath, content });
        return { path: candidatePath, content, sourceCode };
      } catch (error) {
        return {
          path: candidatePath,
          content: "",
          error: String(error),
        };
      }
    }),
  );
}

export async function analyzeFiles(
  _prev: FileContent[],
  formData: FormData,
): Promise<FileContent[]> {
  const parsed = FilePathsSchema.safeParse({
    filePaths: formData.getAll("filePath"),
  });

  if (!parsed.success) return [];

  return readSelectedFiles(parsed.data.filePaths);
}

export type GeneratePromptResponse = {
  files: FileContent[];
};

export async function generatePrompt(
  _prev: GeneratePromptResponse,
  formData: FormData,
): Promise<ActionState<GeneratePromptResponse>> {
  const parsed = GeneratePromptSchema.safeParse({
    filePaths: formData.getAll("filePath"),
  });

  if (!parsed.success) {
    return {
      success: false,
      message: parsed.error.issues[0]?.message ?? "Datos inválidos",
      timestamp: Date.now(),
    };
  }

  const files = await readSelectedFiles(parsed.data.filePaths);

  return {
    success: true,
    message: "Archivos cargados correctamente",
    timestamp: Date.now(),
    data: { files },
  };
}
