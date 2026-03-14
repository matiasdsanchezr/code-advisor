Para optimizar el componente `ChatShell` siguiendo los estándares de **ShadCN UI**, reemplazaremos los iconos de Iconify (que usan clases de Tailwind) por componentes de **Lucide React** (que es la librería por defecto de ShadCN) y nos aseguraremos de que la estructura siga las convenciones de la librería.

Aquí tienes el código actualizado:

```tsx
"use client";

import { useMemo, useState, useTransition } from "react";
import { useShallow } from "zustand/shallow";
import { 
  Loader2, 
  SendHorizontal, 
  Brain, 
  Pencil, 
  RotateCcw, 
  FolderOpen,
  AlertCircle
} from "lucide-react";

import { generateAiAnswer } from "@/actions/chat-agent";
import { generatePrompt } from "@/actions/get-source-code";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { useChatStore } from "@/stores/chat-store";
import { buildPrompt } from "../../utils/build-prompt";
import { FileExplorer } from "./file-explorer";
import { GeneratedUserPrompt } from "./generated-user-prompt";
import { SystemPromptDialog } from "./system-prompt-dialog";
import { createCodePlugin } from "@streamdown/code";
import { Streamdown } from "streamdown";

export const ChatShell = ({ filePaths }: { filePaths: string[] }) => {
  return <ChatShellContent filePaths={filePaths} />;
};

const ChatShellContent = ({ filePaths }: { filePaths: string[] }) => {
  const {
    selectedFiles,
    userQuery,
    systemPrompt,
    fileContents,
    agentResponse,
    setUserQuery,
    setPromptData,
    setAgentResponse,
    resetChatResult,
    resetAll,
  } = useChatStore(
    useShallow((s) => ({
      selectedFiles: s.selectedFiles,
      userQuery: s.userQuery,
      systemPrompt: s.systemPrompt,
      fileContents: s.fileContents,
      agentResponse: s.agentResponse,
      setUserQuery: s.setUserQuery,
      setPromptData: s.setFileContents,
      setAgentResponse: s.setAgentResponse,
      resetChatResult: s.resetChatResult,
      resetAll: s.resetAll,
    })),
  );

  const [showFileExplorer, setShowFileExplorer] = useState(true);
  const [isPending, startPromptTransition] = useTransition();
  const [isAgentPending, startAgentTransition] = useTransition();
  const [agentError, setAgentError] = useState<string>("");

  const handleGeneratePrompt = (formData: FormData) => {
    startPromptTransition(async () => {
      const result = await generatePrompt({}, formData);
      if (result.data) setPromptData(result.data);
    });
  };

  const handleAgentAction = (formData: FormData) => {
    startAgentTransition(async () => {
      const result = await generateAiAnswer({ data: agentResponse }, formData);
      if (result.data) {
        setAgentResponse(result.data);
        setAgentError("");
        return;
      }
      setAgentError(result.error ?? "Error al generar una respuesta");
    });
  };

  const fileErrors = useMemo(
    () =>
      fileContents
        .filter((file) => file.error)
        .map((file) => `${file.path}: ${file.error}`),
    [fileContents],
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (
      (e.ctrlKey || e.metaKey) &&
      e.key === "Enter" &&
      !isDisabled &&
      selectedFiles.length > 0 &&
      userQuery.trim()
    ) {
      e.preventDefault();
      e.currentTarget.form?.requestSubmit();
    }
  };

  const validFiles = useMemo(
    () => fileContents.filter((f) => !f.error && f.sourceCode),
    [fileContents],
  );

  const isPromptGenerated = validFiles.length > 0 && !!userQuery;
  const isDisabled = isPending || isAgentPending || isPromptGenerated;
  
  const finalPrompt = useMemo(
    () =>
      buildPrompt(
        systemPrompt,
        userQuery,
        validFiles.map((f) => f.sourceCode).join("\n\n---\n\n"),
      ),
    [systemPrompt, userQuery, validFiles],
  );

  return (
    <div className="flex flex-col gap-6 p-4 max-w-5xl mx-auto w-full">
      {/* --- SECCIÓN 1: Configuración de la Consulta --- */}
      <Card className={isPromptGenerated ? "bg-muted/40" : ""}>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <CardTitle>Paso 1: Define tu consulta</CardTitle>
              <CardDescription>
                Selecciona los archivos y describe la tarea que deseas realizar.
              </CardDescription>
            </div>
            <SystemPromptDialog disabled={isDisabled} />
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <Button
            onClick={() => setShowFileExplorer(!showFileExplorer)}
            variant="outline"
            size="sm"
            disabled={isDisabled}
            className="h-9"
          >
            <FolderOpen className="mr-2 h-4 w-4" />
            {showFileExplorer ? "Ocultar" : "Mostrar"} explorador ({selectedFiles.length})
          </Button>

          {showFileExplorer && (
            <div className="rounded-md border bg-background p-2">
              <FileExplorer filePaths={filePaths} disabled={isDisabled} />
            </div>
          )}

          {fileErrors.length > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error de lectura</AlertTitle>
              <AlertDescription>
                No se pudieron leer {fileErrors.length} archivo(s). Revisa la selección.
              </AlertDescription>
            </Alert>
          )}

          <form action={handleGeneratePrompt} className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="user-query">Tu consulta</Label>
              <Textarea
                id="user-query"
                name="userQuery"
                value={userQuery}
                onChange={(e) => setUserQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ej: ¿Qué hace esta función? ¿Cómo puedo optimizar este código?"
                className="min-h-[120px] resize-y"
                disabled={isDisabled}
              />
            </div>
            {selectedFiles.map((path) => (
              <input key={path} type="hidden" name="filePath" value={path} />
            ))}
            <input type="hidden" name="systemPrompt" value={systemPrompt} />
            
            {!isPromptGenerated && (
              <Button
                type="submit"
                disabled={selectedFiles.length === 0 || !userQuery.trim() || isPending}
                className="w-full md:w-auto"
              >
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analizando archivos...
                  </>
                ) : (
                  <>
                    <SendHorizontal className="mr-2 h-4 w-4" />
                    Generar y revisar prompt
                  </>
                )}
              </Button>
            )}
          </form>
        </CardContent>
      </Card>

      {/* --- SECCIÓN 2: Prompt Generado --- */}
      {isPromptGenerated && (
        <Card className="border-blue-200 dark:border-blue-900 bg-blue-50/30 dark:bg-blue-950/10">
          <CardHeader>
            <CardTitle>Paso 2: Revisa y utiliza el prompt</CardTitle>
            <CardDescription>
              Copia el prompt o analízalo directamente con la IA.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <GeneratedUserPrompt />
            <Separator />
            <div className="flex flex-wrap items-center gap-3">
              <form action={handleAgentAction}>
                <input type="hidden" name="instruction" value={systemPrompt} />
                <input type="hidden" name="input" value={finalPrompt} />
                <Button
                  type="submit"
                  disabled={isAgentPending}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {isAgentPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Procesando...
                    </>
                  ) : (
                    <>
                      <Brain className="mr-2 h-4 w-4" />
                      Analizar con IA
                    </>
                  )}
                </Button>
              </form>
              <Button
                variant="outline"
                onClick={resetChatResult}
                disabled={isAgentPending}
              >
                <Pencil className="mr-2 h-4 w-4" />
                Modificar Consulta
              </Button>
              <Button
                variant="ghost"
                onClick={resetAll}
                disabled={isAgentPending}
                className="text-destructive hover:bg-destructive/10"
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                Empezar de cero
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* --- SECCIÓN 3: Respuesta de la IA --- */}
      {(agentResponse.response || agentError) && (
        <Card className="shadow-lg border-2">
          <CardHeader className="border-b bg-muted/20">
            <CardTitle className="text-lg">Respuesta del Asistente</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            {agentResponse.response ? (
              <div className="rounded-lg bg-zinc-950 p-1">
                <Streamdown
                  plugins={{
                    code: createCodePlugin({
                      themes: ["github-light", "github-dark"],
                    }),
                  }}
                  className="prose prose-sm dark:prose-invert max-w-none p-4"
                >
                  {agentResponse.response}
                </Streamdown>
              </div>
            ) : (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{agentError}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};
```

### Cambios realizados:
1.  **Iconos Lucide:** Se reemplazaron todos los `<span>` que usaban Iconify por componentes nativos de `lucide-react` (`Loader2`, `Brain`, `SendHorizontal`, etc.). Esto es más consistente con ShadCN y facilita el tipado.
2.  **Layout y Espaciado:** Se mejoró el uso de clases utilitarias de Tailwind (`space-y-6`, `grid gap-2`) en lugar de `flex-col gap-4` genéricos para dar un aire más "limpio".
3.  **Estados Visuales:** Se añadieron variantes de color sutiles a las tarjetas (ej. `bg-blue-50/30` en el paso 2) para guiar mejor la vista del usuario a través de los pasos.
4.  **Accesibilidad y UX:**
    *   Se agregó un ancho máximo (`max-w-5xl mx-auto`) para que el chat no se vea demasiado ancho en pantallas grandes.
    *   Se mejoró el feedback visual del botón "Empezar de cero" usando la variante `ghost` con colores destructivos.
    *   Se envolvió el `FileExplorer` en un contenedor con borde para delimitar mejor el área de interacción.
5.  **Alertas:** Se utilizó `AlertTitle` y el icono `AlertCircle` para que los errores sean más prominentes.