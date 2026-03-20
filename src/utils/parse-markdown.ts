import { readFile } from "node:fs/promises";

/**
 * Carga un archivo Markdown y reemplaza los placeholders {{{key}}}
 * con los valores proporcionados en un objeto.
 * * @param filePath - Ruta relativa o absoluta al archivo .md
 * @param variables - Objeto con los datos a inyectar
 * @returns El contenido del markdown procesado como string
 */
export async function parseMarkdownTemplate(
  filePath: string,
  variables: Record<string, string | number>,
): Promise<string> {
  try {
    const content = await readFile(filePath, "utf-8");
    return content.replace(/{{{(.*?)}}}/g, (match, key) => {
      const trimmedKey = key.trim();
      if (variables[trimmedKey] !== undefined) {
        return String(variables[trimmedKey]);
      } else {
        console.warn("Variable no encontrada:", trimmedKey);
        return match;
      }
    });
  } catch (error) {
    console.error("Error al procesar el archivo MD:", error);
    throw error;
  }
}
