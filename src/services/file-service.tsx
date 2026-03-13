import fs from "fs/promises";
import path from "path";
import { config } from "../lib/config";
import { FileContent } from "@/types/file-content";

const DEFAULT_ALLOWED_EXTENSIONS = new Set([
  ".tsx",
  ".ts",
  ".js",
  ".md",
  ".json",
]);

const DEFAULT_IGNORE = [
  "node_modules",
  ".git",
  ".next",
  "dist",
  "build",
  ".cache",
  ".yalc",
  "__tests__",
];

async function walkDir(
  dir: string,
  extensions: Set<string>,
  ignore: string[]
): Promise<string[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    if (entry.isDirectory() && ignore.includes(entry.name)) continue;

    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      files.push(...(await walkDir(fullPath, extensions, ignore)));
    } else if (
      entry.isFile() &&
      extensions.has(path.extname(entry.name).toLowerCase())
    ) {
      files.push(fullPath.replace(/\\/g, "/"));
    }
  }

  return files;
}

export async function getFilePaths(
  folder: string = config.TARGET_PROJECT_PATH,
  extensions: Set<string> = DEFAULT_ALLOWED_EXTENSIONS,
  ignore: string[] = DEFAULT_IGNORE
): Promise<string[]> {
  const stat = await fs.stat(folder).catch(() => null);

  if (!stat) {
    throw new Error(`La carpeta "${folder}" no existe.`);
  }

  if (!stat.isDirectory()) {
    throw new Error(`"${folder}" no es una carpeta.`);
  }

  return walkDir(folder, extensions, ignore);
}

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

export async function getFileContents(paths: string[]): Promise<FileContent[]> {
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

      if (!DEFAULT_ALLOWED_EXTENSIONS.has(ext)) {
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
    })
  );
}
