"use server";

import { fileService } from "@/services/file-service";
import { ActionState } from "@/types/action-state";
import { FileContent } from "@/types/file-content";
import { z } from "zod";

const GeneratePromptSchema = z.object({
  filePaths: z.array(z.string().trim().min(1)).min(0).max(200),
  includeDependencies: z.preprocess((val) => val === "true", z.boolean()),
});

export async function getFileContents(
  _prev: ActionState<FileContent[]>,
  formData: FormData,
): Promise<ActionState<FileContent[]>> {
  const parsed = GeneratePromptSchema.safeParse({
    filePaths: formData.getAll("filePath"),
    includeDependencies: formData.get("includeDependencies"),
  });

  if (!parsed.success) {
    return { error: z.prettifyError(parsed.error) };
  }

  const fileContents = await fileService.loadProjectGraph(
    parsed.data.filePaths,
    parsed.data.includeDependencies,
  );

  return { data: fileContents };
}
