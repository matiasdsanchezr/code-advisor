import { config } from "@/lib/config";
import { FileContent } from "@/types/file-content";
import fs from "node:fs/promises";
import path from "node:path";

const IMPORT_PATH_REGEX = /import\s+(?:[^'"]*?from\s+)?["']([^"']+)["'];?/g;

const CODE_EXTENSIONS = new Set([".ts", ".tsx", ".js", ".mjs", ".jsx"]);

function isCodeFile(ext: string) {
  return CODE_EXTENSIONS.has(ext);
}

// Normaliza módulos tipo "next/font/google", "react", etc.
// Aquí solo nos interesan rutas que empiezan con ./, ../, @/ o /
function shouldResolveImport(specifier: string) {
  return (
    specifier.startsWith("./") ||
    specifier.startsWith("../") ||
    specifier.startsWith("@/") ||
    specifier.startsWith("/")
  );
}

function resolveImportPath(
  baseFilePath: string,
  specifier: string,
  projectRoot: string,
) {
  if (specifier.startsWith("./") || specifier.startsWith("../")) {
    // relativo al archivo actual
    return path.resolve(path.dirname(baseFilePath), specifier);
  }

  if (specifier.startsWith("@/")) {
    // alias "@/": lo mapeamos a la raíz del proyecto
    const relative = specifier.slice(2); // quita "@/"
    return path.resolve(projectRoot, relative);
  }

  if (specifier.startsWith("/")) {
    // relativo a la raíz del proyecto
    const relative = specifier.slice(1); // quita "/"
    return path.resolve(projectRoot, relative);
  }

  // Otros casos (paquetes de node_modules, etc.) no se resuelven aquí
  return null;
}

function extractImportSpecifiers(source: string): string[] {
  const matches: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = IMPORT_PATH_REGEX.exec(source)) !== null) {
    const specifier = m[1];
    if (specifier) matches.push(specifier);
  }
  return matches;
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

const DEFAULT_ALLOWED_EXTENSIONS = new Set([
  ".tsx",
  ".ts",
  ".js",
  ".md",
  ".json",
]);

function isPathInsideBase(basePath: string, candidatePath: string) {
  const relative = path.relative(basePath, candidatePath);
  return (
    relative === "" ||
    (!relative.startsWith("..") && !path.isAbsolute(relative))
  );
}

export async function getFileContentsWithDeps(
  paths: string[],
): Promise<FileContent[]> {
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
          dependencies: [],
        };
      }

      if (!DEFAULT_ALLOWED_EXTENSIONS.has(ext)) {
        return {
          path: candidatePath,
          content: "",
          error: `Extensión no permitida: ${ext || "(sin extensión)"}`,
          dependencies: [],
        };
      }

      try {
        const content = await fs.readFile(candidatePath, "utf-8");
        const sourceCode = getFileSourceCode({
          path: candidatePath,
          content,
        });

        let dependencies: string[] = [];

        if (isCodeFile(ext)) {
          const specifiers = extractImportSpecifiers(content);
          const resolved = await Promise.all(
            specifiers.filter(shouldResolveImport).map(async (s) => {
              const baseResolved = resolveImportPath(
                candidatePath,
                s,
                basePath,
              );
              if (!baseResolved) return null;
              const finalPath = await resolveWithExtensions(baseResolved);
              return finalPath;
            }),
          );

          dependencies = [
            ...new Set(resolved.filter((p): p is string => Boolean(p))),
          ];
        }

        return {
          path: candidatePath,
          content,
          sourceCode,
          dependencies,
        };
      } catch (error) {
        return {
          path: candidatePath,
          content: "",
          error: String(error),
          dependencies: [],
        };
      }
    }),
  );
}

async function resolveWithExtensions(
  basePathWithoutExt: string,
  allowedExtensions = CODE_EXTENSIONS,
): Promise<string | null> {
  // 1) Si ya viene con extensión permitida, úsalo directamente
  const ext = path.extname(basePathWithoutExt);
  if (ext && allowedExtensions.has(ext)) {
    try {
      await fs.access(basePathWithoutExt);
      return basePathWithoutExt;
    } catch {
      return null;
    }
  }

  // 2) Probar base + cada extensión
  for (const candidateExt of allowedExtensions.values()) {
    const candidate = basePathWithoutExt + candidateExt;
    try {
      await fs.access(candidate);
      return candidate;
    } catch {
      // ignorar y seguir probando
    }
  }

  // 3) Probar index.* dentro de carpeta (./foo → ./foo/index.ts, etc.)
  for (const candidateExt of allowedExtensions.values()) {
    const candidate = path.join(basePathWithoutExt, "index" + candidateExt);
    try {
      await fs.access(candidate);
      return candidate;
    } catch {
      // ignorar
    }
  }

  return null;
}

export async function loadProjectGraph(entryPoints: string[]) {
  const visited = new Set<string>();
  const queue = [...entryPoints];
  const results: FileContent[] = [];

  while (queue.length > 0) {
    const batch = queue.splice(0, queue.length);
    const toFetch = batch.filter((p) => !visited.has(path.resolve(p)));

    if (toFetch.length === 0) continue;

    const files = await getFileContentsWithDeps(toFetch);
    for (const file of files) {
      const absPath = path.resolve(file.path);
      if (visited.has(absPath)) continue;
      visited.add(absPath);
      results.push(file);

      if (file.dependencies?.length) {
        for (const dep of file.dependencies) {
          if (!visited.has(path.resolve(dep))) {
            queue.push(dep);
          }
        }
      }
    }
  }

  return results;
}
