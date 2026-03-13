"use server";

import { ActionState } from "@/types/action-state";
import { FileContent } from "@/types/file-content";
import { z } from "zod/v4";
import { getFileContents } from "../services/file-service";

const GeneratePromptSchema = z.object({
  filePaths: z.array(z.string().trim().min(1)).min(1).max(200),
});

export async function generatePrompt(
  _prev: ActionState<FileContent[]>,
  formData: FormData
): Promise<ActionState<FileContent[]>> {
  const parsed = GeneratePromptSchema.safeParse({
    filePaths: formData.getAll("filePath"),
  });

  if (!parsed.success) {
    return {
      error: z.prettifyError(parsed.error),
    };
  }

  const fileContents = await getFileContents(parsed.data.filePaths);

  return {
    data: fileContents,
  };
}
