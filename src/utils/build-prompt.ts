import { FileContent } from "@/types/file-content";

const formatSourceCode = (files: FileContent[]): string => {
  return files
    .map(
      (file) =>
        `Archivo: [${file.path}]\n\`\`\`${file.language || ""}\n${
          file.content
        }\n\`\`\``
    )
    .join("\n\n");
};

const instructionsSection = (systemPrompt: string) => `
## INSTRUCCIONES DEL SISTEMA
<system_instructions>
${systemPrompt}
</system_instructions>
`;

const contextSection = (files: FileContent[]) => `
## CONTEXTO DEL PROYECTO
<context>
${formatSourceCode(files)}
</context>
`;

const taskSection = (userInput: string) => `
## TAREA DEL USUARIO
<task>
${userInput}
</task>i
`;

export const buildUserPrompt = (userInput: string, files?: FileContent[]) => {
  const sections = [];
  if (files && files.length > 0) sections.push(contextSection(files));
  sections.push(taskSection(userInput));

  return sections.join("\n\n---\n\n").trim();
};

export const attachSystemInstruction = (
  systemPrompt: string,
  prompt: string
) => {
  return `${instructionsSection(systemPrompt)}\n\n---\n\n${prompt}`;
};

/**
 * Construye un prompt optimizado para análisis de código fuente.
 */
export const buildPrompt = (
  systemPrompt: string,
  userInput: string,
  files?: FileContent[]
) => {
  const sections = [];
  if (systemPrompt) sections.push(instructionsSection(systemPrompt));
  if (files && files.length > 0) sections.push(contextSection(files));
  sections.push(taskSection(userInput));

  return sections.join("\n\n---\n\n").trim();
};
