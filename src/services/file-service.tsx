/**
 * @file file-service-new.tsx
 * @description Servicio optimizado para análisis de grafos con soporte de concurrencia,
 * mejor resolución de módulos y gestión de estado mediante clase.
 */

import { config } from "@/lib/config";
import { FileContent } from "@/types/file-content";
import fs from "node:fs/promises";
import path from "node:path";
import { cache } from "react";

type AbsolutePath = string & { readonly __brand: unique symbol };
type Extension = `.${string}`;

export const DEFAULT_IGNORE = new Set([
  "node_modules",
  ".git",
  ".next",
  "dist",
  "build",
  ".cache",
  ".yalc",
  "__tests__",
]);

const CODE_EXTENSIONS: ReadonlySet<Extension> = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".mjs",
  ".jsx",
]);
const ALLOWED_EXTENSIONS: ReadonlySet<Extension> = new Set([
  ...CODE_EXTENSIONS,
  ".md",
  ".json",
  ".css",
]);

const IMPORT_REGEX =
  /(?:import|export)\s+(?:[\w*\s{},]*\s+from\s+)?["']([^"']+)["']|import\s*\(\s*["']([^"']+)["']\s*\)/g;

export class FileService {
  private projectRoot: AbsolutePath;
  private resolutionCache = new Map<string, AbsolutePath | null>();
  private readonly CONCURRENCY_LIMIT = 20;

  constructor(projectRoot: string = config.TARGET_PROJECT_PATH) {
    this.projectRoot = path.resolve(projectRoot) as AbsolutePath;
  }

  private resolveImportPath(
    baseFile: AbsolutePath,
    modulePath: string,
  ): AbsolutePath | null {
    if (modulePath.startsWith("./") || modulePath.startsWith("../")) {
      return path.resolve(path.dirname(baseFile), modulePath) as AbsolutePath;
    }
    if (modulePath.startsWith("@/")) {
      return path.resolve(
        this.projectRoot,
        "src",
        modulePath.slice(2),
      ) as AbsolutePath;
    }
    if (modulePath.startsWith("/")) {
      return path.resolve(
        this.projectRoot,
        modulePath.slice(1),
      ) as AbsolutePath;
    }
    return null;
  }

  private async resolveWithExtensions(
    basePath: AbsolutePath,
  ): Promise<AbsolutePath | null> {
    if (this.resolutionCache.has(basePath))
      return this.resolutionCache.get(basePath)!;

    const ext = path.extname(basePath) as Extension;
    const candidates: string[] = CODE_EXTENSIONS.has(ext)
      ? [basePath]
      : Array.from(CODE_EXTENSIONS).flatMap((ext) => [
          `${basePath}${ext}`,
          path.join(basePath, `index${ext}`),
        ]);

    for (const candidate of candidates) {
      try {
        await fs.access(candidate);
        const resolved = candidate as AbsolutePath;
        this.resolutionCache.set(basePath, resolved);
        return resolved;
      } catch {
        continue;
      }
    }

    this.resolutionCache.set(basePath, null);
    return null;
  }

  async getFileContentsWithDependencies(
    paths: string[],
  ): Promise<FileContent[]> {
    const uniquePaths = Array.from(
      new Set(paths.map((p) => path.resolve(p) as AbsolutePath)),
    );
    const results: FileContent[] = [];

    // Procesamiento por lotes para evitar saturar el sistema de archivos
    for (let i = 0; i < uniquePaths.length; i += this.CONCURRENCY_LIMIT) {
      const batch = uniquePaths.slice(i, i + this.CONCURRENCY_LIMIT);
      const batchResults = await Promise.all(
        batch.map((p) => this.processFile(p)),
      );
      results.push(...batchResults);
    }

    return results;
  }

  private processFile = cache(
    async (currentPath: AbsolutePath): Promise<FileContent> => {
      const ext = path.extname(currentPath).toLowerCase() as Extension;

      if (!currentPath.startsWith(this.projectRoot)) {
        return {
          path: currentPath,
          error: "Security: Outside root",
        };
      }

      if (!ALLOWED_EXTENSIONS.has(ext)) {
        return {
          path: currentPath,
          error: `Forbidden extension: ${ext}`,
        };
      }

      try {
        const content = await fs.readFile(currentPath, "utf-8");
        const dependencies = new Set<string>();

        if (CODE_EXTENSIONS.has(ext)) {
          const matches = [...content.matchAll(IMPORT_REGEX)];
          const specifiers = matches
            .map((match) => match[1] || match[2])
            .filter(Boolean);

          for (const specifier of specifiers) {
            const potentialPath = this.resolveImportPath(
              currentPath,
              specifier,
            );
            if (potentialPath) {
              const resolved = await this.resolveWithExtensions(potentialPath);
              if (resolved) dependencies.add(resolved);
            }
          }
        }

        const fileData: FileContent = {
          path: currentPath,
          content,
          dependencies: Array.from(dependencies),
          language: ext.slice(1),
        };

        return { ...fileData };
      } catch (err) {
        return {
          path: currentPath,
          content: "",
          error: err instanceof Error ? err.message : String(err),
          dependencies: [],
        };
      }
    },
  );

  loadProjectGraph = cache(
    async (
      entryPoints: string[],
      includeDeps = true,
    ): Promise<FileContent[]> => {
      const visited = new Set<AbsolutePath>();
      const results = new Map<AbsolutePath, FileContent>();
      let nodesToProcess: AbsolutePath[] = entryPoints.map(
        (p) => path.resolve(p) as AbsolutePath,
      );

      while (nodesToProcess.length > 0) {
        const toProcess = nodesToProcess.filter((p) => !visited.has(p));
        nodesToProcess = [];
        if (toProcess.length === 0) break;

        toProcess.forEach((p) => visited.add(p));
        const processedFiles =
          await this.getFileContentsWithDependencies(toProcess);

        for (const file of processedFiles) {
          const absPath = file.path as AbsolutePath;
          results.set(absPath, file);

          if (includeDeps && file.dependencies) {
            for (const dep of file.dependencies) {
              if (!visited.has(dep as AbsolutePath))
                nodesToProcess.push(dep as AbsolutePath);
            }
          }
        }
        if (!includeDeps) break;
      }
      return Array.from(results.values());
    },
  );
}

export const fileService = new FileService();

async function recursiveFileSearch(
  dir: string,
  extensions: ReadonlySet<Extension> = ALLOWED_EXTENSIONS,
  ignore: Set<string> = DEFAULT_IGNORE,
): Promise<string[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const promises = entries.map(async (entry) => {
    if (ignore.has(entry.name)) return [];
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory())
      return recursiveFileSearch(fullPath, extensions, ignore);
    return entry.isFile() &&
      extensions.has(path.extname(entry.name).toLowerCase() as Extension)
      ? [fullPath.replace(/\\/g, "/")]
      : [];
  });
  return (await Promise.all(promises)).flat();
}

export const getFilePaths = cache(
  async (
    folder: string = config.TARGET_PROJECT_PATH,
    extensions: ReadonlySet<Extension> = ALLOWED_EXTENSIONS,
    ignore: string[] = Array.from(DEFAULT_IGNORE),
  ) => {
    const stat = await fs.stat(folder).catch(() => null);
    if (!stat?.isDirectory()) throw new Error(`Path invalido: ${folder}`);
    return recursiveFileSearch(folder, extensions, new Set(ignore));
  },
);
