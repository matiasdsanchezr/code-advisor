export const texto = `# Análisis de Mejoras para Server Actions y Queries

Basándome en el código proporcionado, aquí tienes un análisis detallado de las mejoras potenciales:

---

## 📁 Server Actions

### 1. \`chat-agent.tsx\` - \`generateResponse\`

**Problemas identificados:**

| Aspecto | Problema | Severidad |
|---------|----------|-----------|
| Validación de entrada | No hay validación de \`instruction\` e \`input\` | 🔴 Alta |
| Rutas hardcodeadas | \`"response.md"\` está hardcodeado | 🟡 Media |
| Manejo de errores | El casteo \`as { status?: number }\` es inseguro | 🟡 Media |
| Side effects | Escribir archivo debería ser separado | 🟡 Media |

**Mejoras propuestas:**

\`\`\`tsx
"use server";
import { AiProviderService } from "@/services/ai-provider/ai-provider.service";
import { ActionState } from "@/types/action-state";
import { AgentResponse } from "@/types/agent-response";
import { z } from "zod";
import fs from "node:fs/promises";
import path from "node:path";

// ✅ Añadir validación con Zod
const GenerateResponseSchema = z.object({
  instruction: z.string().trim().min(1, "La instrucción es requerida"),
  input: z.string().min(1, "El input es requerido"),
});

// ✅ Configuración externalizada
const RESPONSE_OUTPUT_PATH = process.env.RESPONSE_OUTPUT_PATH 
  ?? path.join(process.cwd(), "response.md");

// ✅ Type guard para errores con status
function isErrorWithStatus(error: unknown): error is { status: number } {
  return typeof error === "object" && error !== null && "status" in error;
}

export async function generateResponse(
  prevState: ActionState<AgentResponse>,
  formData: FormData,
): Promise<ActionState<AgentResponse>> {
  // ✅ Validación temprana
  const parsed = GenerateResponseSchema.safeParse({
    instruction: formData.get("instruction"),
    input: formData.get("input"),
  });

  if (!parsed.success) {
    return {
      success: false,
      message: parsed.error.issues[0]?.message ?? "Datos inválidos",
      errors: { 
        instruction: parsed.error.formErrors.fieldErrors.instruction,
        input: parsed.error.formErrors.fieldErrors.input,
      },
      timestamp: Date.now(),
    };
  }

  const { instruction, input } = parsed.data;

  try {
    const agent = await AiProviderService.getInstance();
    const modelResponse = await agent.generateContent(instruction, input);

    // ✅ Separar en función independiente
    await saveResponseToFile(RESPONSE_OUTPUT_PATH, modelResponse.response);

    return {
      success: true,
      message: "Respuesta generada correctamente",
      errors: {},
      timestamp: Date.now(),
      data: {
        response: modelResponse.response,
        thoughts: modelResponse.thoughts,
      },
    };
  } catch (error: unknown) {
    console.error("Error en generateResponse:", error);
    
    // ✅ Manejo de errores más robusto
    if (isErrorWithStatus(error) && error.status === 429) {
      return {
        success: false,
        message: "Rate limit alcanzado. Intenta más tarde.",
        errors: {},
        timestamp: Date.now(),
      };
    }

    return {
      success: false,
      message: error instanceof Error 
        ? error.message 
        : "Error desconocido al generar la respuesta",
      errors: {},
      timestamp: Date.now(),
    };
  }
}

// ✅ Función extraída para I/O
async function saveResponseToFile(filePath: string, content: string): Promise<void> {
  const dir = path.dirname(filePath);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(filePath, content, "utf-8");
}
\`\`\`

---

### 2. \`get-source-code.tsx\` - \`generatePrompt\`

**Problemas identificados:**

| Aspecto | Problema | Severidad |
|---------|----------|-----------|
| Tipo de retorno | \`GeneratePromptResponse\` debería usar \`ActionState\` | 🟡 Media |
| Límite arbitrario | \`max(200)\` sin justificación clara | 🟢 Baja |

**Mejoras propuestas:**

\`\`\`tsx
"use server";
import { ActionState } from "@/types/action-state";
import { FileContent } from "@/types/file-content";
import { z } from "zod";
import { getFileContents } from "../queries/file";

// ✅ Configuración externalizada
const MAX_FILES_PER_REQUEST = parseInt(process.env.MAX_FILES_PER_REQUEST ?? "50", 10);

const GeneratePromptSchema = z.object({
  filePaths: z
    .array(z.string().trim().min(1))
    .min(1, "Selecciona al menos un archivo")
    .max(MAX_FILES_PER_REQUEST, \`Máximo \${MAX_FILES_PER_REQUEST} archivos por solicitud\`),
});

// ✅ Usar ActionState consistentemente
export async function generatePrompt(
  _prev: ActionState<{ fileContents: FileContent[] }>,
  formData: FormData,
): Promise<ActionState<{ fileContents: FileContent[] }>> {
  const parsed = GeneratePromptSchema.safeParse({
    filePaths: formData.getAll("filePath"),
  });

  if (!parsed.success) {
    return {
      success: false,
      message: parsed.error.issues[0]?.message ?? "Datos inválidos",
      errors: { filePaths: parsed.error.formErrors.fieldErrors.filePaths },
      timestamp: Date.now(),
    };
  }

  try {
    const fileContents = await getFileContents(parsed.data.filePaths);
    
    // ✅ Filtrar archivos con errores del resultado
    const validContents = fileContents.filter(f => !f.error);
    
    if (validContents.length === 0) {
      return {
        success: false,
        message: "Ningún archivo pudo ser leído correctamente",
        errors: {},
        timestamp: Date.now(),
      };
    }

    return {
      success: true,
      message: \`\${validContents.length} archivo(s) cargado(s) correctamente\`,
      timestamp: Date.now(),
      data: { fileContents: validContents },
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Error al leer archivos",
      errors: {},
      timestamp: Date.now(),
    };
  }
}
\`\`\`

---

## 📁 Queries

### 3. \`chat-agent.tsx\` - \`getAiProviderState\`

**Mejoras propuestas:**

\`\`\`tsx
import { AiProviderService } from "@/services/ai-provider/ai-provider.service";

export type AiProviderState = {
  model: string;
  isBusy: boolean;
  provider: string;
  // ✅ Añadir timestamp para cache
  lastUpdated: number;
};

export async function getAiProviderState(): Promise<AiProviderState> {
  try {
    const agent = await AiProviderService.getInstance();
    return {
      model: agent.model,
      isBusy: agent.isBusy,
      provider: agent.provider,
      lastUpdated: Date.now(),
    };
  } catch (error) {
    console.error("Error obteniendo estado del AI provider:", error);
    // ✅ Devolver estado por defecto en lugar de fallar
    return {
      model: "unknown",
      isBusy: false,
      provider: "unknown",
      lastUpdated: Date.now(),
    };
  }
}
\`\`\`

---

### 4. \`file.tsx\` - Funciones de archivos

**Problemas identificados:**

| Aspecto | Problema | Severidad |
|---------|----------|-----------|
| Sin límite de profundidad | \`walkDir\` puede recursividad infinita | 🔴 Alta |
| Sin caché | Archivos leídos múltiples veces | 🟡 Media |
| Seguridad | Validación de path mejorable | 🟡 Media |

**Mejoras propuestas:**

\`\`\`tsx
import fs from "fs/promises";
import path from "path";
import { config } from "../utils/config";
import { FileContent } from "@/types/file-content";

// ✅ Configuración externalizada
const ALLOWED_EXTENSIONS = new Set(
  (process.env.ALLOWED_EXTENSIONS ?? ".tsx,.ts,.js,.md,.json")
    .split(",")
    .map(e => e.trim().toLowerCase())
);

const IGNORE_DIRS = [
  "node_modules", ".git", ".next", "dist", 
  "build", ".cache", ".yalc", "__tests__", ".svn"
];

// ✅ Límite de profundidad para prevenir recursividad infinita
const MAX_DEPTH = parseInt(process.env.MAX_WALK_DEPTH ?? "20", 10);

async function walkDir(
  dir: string,
  extensions: Set<string>,
  ignore: string[],
  currentDepth: number = 0,
): Promise<string[]> {
  // ✅ Protección contra recursividad infinita
  if (currentDepth > MAX_DEPTH) {
    console.warn(\`Límite de profundidad alcanzado en: \${dir}\`);
    return [];
  }

  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    if (entry.isDirectory() && ignore.includes(entry.name)) continue;
    
    const fullPath = path.join(dir, entry.name);
    
    if (entry.isDirectory()) {
      files.push(...(await walkDir(fullPath, extensions, ignore, currentDepth + 1)));
    } else if (entry.isFile() && extensions.has(path.extname(entry.name).toLowerCase())) {
      files.push(fullPath.replace(/\\/g, "/"));
    }
  }

  return files;
}

// ✅ Caché simple para evitar lecturas repetidas
const fileCache = new Map<string, { content: string; timestamp: number }>();
const CACHE_TTL = 5000; // 5 segundos

export async function getFileContents(paths: string[]): Promise<FileContent[]> {
  const basePath = path.resolve(config.TARGET_PROJECT_PATH);
  const uniquePaths = [...new Set(paths)].map(p => path.resolve(p));

  return Promise.all(
    uniquePaths.map(async (candidatePath): Promise<FileContent> => {
      // ✅ Validación de seguridad mejorada
      const normalizedBase = path.normalize(basePath);
      const normalizedCandidate = path.normalize(candidatePath);
      
      if (!normalizedCandidate.startsWith(normalizedBase + path.sep)) {
        return {
          path: candidatePath,
          content: "",
          error: "Ruta inválida: acceso denegado fuera del proyecto",
        };
      }

      const ext = path.extname(candidatePath).toLowerCase();
      
      if (!ALLOWED_EXTENSIONS.has(ext)) {
        return {
          path: candidatePath,
          content: "",
          error: \`Extensión no permitida: \${ext || "(sin extensión)"}\`,
        };
      }

      try {
        // ✅ Verificar caché
        const cached = fileCache.get(candidatePath);
        const stats = await fs.stat(candidatePath);
        
        if (cached && cached.timestamp + CACHE_TTL > Date.now()) {
          const cachedStats = await fs.stat(candidatePath);
          if (cachedStats.mtimeMs <= cached.timestamp) {
            return {
              path: candidatePath,
              content: cached.content,
              sourceCode: formatSourceCode(candidatePath, cached.content),
            };
          }
        }

        const content = await fs.readFile(candidatePath, "utf-8");
        
        // ✅ Actualizar caché
        fileCache.set(candidatePath, { content, timestamp: stats.mtimeMs });

        return {
          path: candidatePath,
          content,
          sourceCode: formatSourceCode(candidatePath, content),
        };
      } catch (error) {
        return {
          path: candidatePath,
          content: "",
          error: error instanceof Error ? error.message : String(error),
        };
      }
    })
  );
}

// ✅ Función extraída
function formatSourceCode(filePath: string, content: string): string {
  const fileName = path.basename(filePath);
  const ext = path.extname(fileName).slice(1) || "txt";
  return \`\\
[\${fileName}](\${filePath})
\\\`\\\`\\\`\${ext}
\${content}
\\\`\\\`\\\`\`;
}
\`\`\`

---

## 📊 Resumen de Mejoras

| Archivo | Mejoras Clave |
|---------|---------------|
| \`chat-agent.tsx\` (action) | Validación Zod, type guards, separación de responsabilidades |
| \`get-source-code.tsx\` | Tipado consistente, configuración externalizada |
| \`chat-agent.tsx\` (query) | Manejo de errores, timestamp para cache |
| \`file.tsx\` | Límite de profundidad, caché, validación de paths mejorada |

¿Quieres que profundice en alguna de estas mejoras o que implemente alguna en particular?`