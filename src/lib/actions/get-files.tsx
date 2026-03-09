"use server";
import fs from "fs/promises";
import path from "path";
import { config } from "../utils/config";

const DEFAULT_IGNORE = [
  "node_modules",
  ".git",
  ".next",
  "dist",
  "build",
  ".cache",
  ".yalc",
  "storage",
];

async function walkDir(
  dir: string,
  extensions: string[],
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
      extensions.some((ext) => entry.name.endsWith(ext))
    ) {
      files.push(fullPath.replace(/\\/g, "/"));
    }
  }

  return files;
}

async function getFilePaths(
  folder: string,
  extensions: string | string[],
  ignore: string[] = DEFAULT_IGNORE
): Promise<string[]> {
  const exts = Array.isArray(extensions) ? extensions : [extensions];

  const stat = await fs.stat(folder).catch(() => null);

  if (!stat) {
    throw new Error(`La carpeta "${folder}" no existe.`);
  }

  if (!stat.isDirectory()) {
    throw new Error(`"${folder}" no es una carpeta.`);
  }

  return walkDir(folder, exts, ignore);
}

export async function loadFiles() {
  return getFilePaths(
    config.TARGET_PROJECT_PATH,
    [".tsx", ".ts", ".js", "md", "json"],
    [...DEFAULT_IGNORE, "coverage", "__tests__", "storybook-static"]
  );
}
