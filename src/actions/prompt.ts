"use server";
import { readdir, readFile } from "fs/promises";
import path from "path";

export const loadPrompt = async (promptId: string) => {
  const systemPrompt = await readFile(
    path.join(process.cwd(), "storage", "prompts", promptId),
    "utf-8",
  );
  return systemPrompt;
};

export const loadPrompts = async () => {
  const systemPrompts = await readdir(
    path.join(process.cwd(), "storage", "prompts"),
  );
  return systemPrompts;
};
