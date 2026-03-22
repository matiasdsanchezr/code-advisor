"use client";
import { generateAiAnswer } from "@/actions/chat-agent";
import { getFileContents } from "@/actions/get-file-contents";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useChatStore } from "@/stores/chat-store";
import { createCodePlugin } from "@streamdown/code";
import { useActionState, useMemo, useState } from "react";
import { Streamdown } from "streamdown";
import { useShallow } from "zustand/shallow";
import { buildPrompt } from "../../utils/build-prompt";
import { FileExplorer } from "./file-explorer";
import { GeneratedPrompt } from "./generated-prompt";
import { SystemPromptMenu } from "./system-prompt-menu";

export const ChatShell = ({
  filePaths,
  initialPrompts,
}: {
  filePaths: string[];
  initialPrompts: string[];
}) => {
  return (
    <ChatShellContent filePaths={filePaths} initialPrompts={initialPrompts} />
  );
};

const ChatShellContent = ({
  filePaths,
  initialPrompts,
}: {
  filePaths: string[];
  initialPrompts: string[];
}) => {
  const store = useChatStore(
    useShallow((s) => ({
      selectedFiles: s.selectedFiles,
      userQuery: s.userQuery,
      systemPrompt: s.systemPrompt,
      fileContents: s.fileContents,
      agentResponse: s.agentResponse,
      includeDependencies: s.includeDependencies,
      setUserQuery: s.setUserQuery,
      setFileContents: s.setFileContents,
      setAgentResponse: s.setAgentResponse,
      setIncludeDependencies: s.setIncludeDependencies,
      resetChatResult: s.resetChatResult,
      resetAll: s.resetAll,
    })),
  );

  const [showFileExplorer, setShowFileExplorer] = useState(true);
  const [isPromptGenerated, setIsPromptGenerated] = useState(false);

  const [, handleFetchFileContents, isFetchingFiles] = useActionState(
    async (prevState: unknown, formData: FormData) => {
      const { data: fileContents, error } = await getFileContents({}, formData);
      if (fileContents) {
        store.setFileContents(fileContents);
        setIsPromptGenerated(true);
        return { error: null };
      }
      return {
        error: error ?? "Se produjo un error al analizar los archivos",
      };
    },
    null,
  );

  const [inferenceState, handleInferenceAction, isWaitingForInference] =
    useActionState(async (prevState: unknown, formData: FormData) => {
      const result = await generateAiAnswer(
        { data: store.agentResponse },
        formData,
      );
      if (result.data) {
        store.setAgentResponse(result.data);
        return { error: null };
      }
      return {
        error: result.error ?? "Se produjo un error al generar la respuesta",
      };
    }, null);

  const fileErrors = useMemo(
    () =>
      store.fileContents
        .filter((file) => file.error)
        .map((file) => `${file.path}: ${file.error}`),
    [store.fileContents],
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (
      (e.ctrlKey || e.metaKey) &&
      e.key === "Enter" &&
      !isDisabled &&
      store.selectedFiles.length > 0 &&
      store.userQuery.trim()
    ) {
      e.preventDefault();
      e.currentTarget.form?.requestSubmit();
    }
  };

  const validFiles = useMemo(
    () => store.fileContents.filter((f) => !f.error && f.content),
    [store.fileContents],
  );
  const isReadyToReview = isPromptGenerated && !!store.userQuery;
  const isDisabled =
    isFetchingFiles || isWaitingForInference || isReadyToReview;

  const finalPrompt = useMemo(
    () => buildPrompt(store.systemPrompt, store.userQuery, validFiles),
    [store.systemPrompt, store.userQuery, validFiles],
  );

  return (
    <div className="flex flex-col gap-6 p-3">
      {/* --- SECCIÓN 1: Configuración de la Consulta --- */}
      <Card
        className={cn(
          "border-border/60 shadow-sm transition-colors",
          isReadyToReview && "bg-muted/40",
        )}
      >
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium tracking-wide uppercase">
                <span>Paso 1</span>
              </div>
              <CardTitle className="text-lg md:text-xl">
                Define tu consulta
              </CardTitle>
              <CardDescription className="text-sm md:text-base">
                Selecciona los archivos y describe la tarea que deseas realizar.
              </CardDescription>
            </div>
            <SystemPromptMenu
              disabled={isDisabled}
              availablePrompts={initialPrompts}
            />
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <Button
              onClick={() => setShowFileExplorer(!showFileExplorer)}
              variant="outline"
              size="sm"
              disabled={isDisabled}
              className="inline-flex items-center gap-2"
            >
              <span
                className={cn(
                  "icon-[fa7-solid--folder-open] transition-transform",
                  showFileExplorer && "rotate-12",
                )}
              />
              <span className="hidden sm:inline">
                {showFileExplorer
                  ? "Ocultar explorador de archivos"
                  : "Mostrar explorador de archivos"}
              </span>
              <span className="sm:hidden">
                {showFileExplorer ? "Ocultar archivos" : "Ver archivos"}
              </span>
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium">
                {store.selectedFiles.length}
              </span>
            </Button>

            {store.selectedFiles.length > 0 && (
              <span className="text-xs text-muted-foreground">
                {store.selectedFiles.length} archivo(s) seleccionado(s)
              </span>
            )}
          </div>

          {showFileExplorer && (
            <FileExplorer filePaths={filePaths} disabled={isDisabled} />
          )}

          {fileErrors.length > 0 && (
            <Alert
              variant="destructive"
              className="border-destructive/40 bg-destructive/5"
            >
              <AlertDescription className="space-y-1 text-sm">
                <p className="font-medium">
                  No se pudieron leer {fileErrors.length} archivo(s).
                </p>
                <p>
                  Revisa la selección o intenta de nuevo. Si el problema
                  persiste, verifica permisos de lectura o formato.
                </p>
                <ul className="mt-1 list-disc pl-4 text-xs text-muted-foreground">
                  {fileErrors.slice(0, 3).map((err) => (
                    <li key={err}>{err}</li>
                  ))}
                  {fileErrors.length > 3 && (
                    <li>Y {fileErrors.length - 3} archivo(s) más…</li>
                  )}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          <form
            action={handleFetchFileContents}
            className="flex flex-col gap-4"
          >
            <div className="flex items-center gap-2 py-1">
              <Checkbox
                id="include-deps"
                checked={store.includeDependencies}
                onCheckedChange={(val) => store.setIncludeDependencies(!!val)}
                disabled={isDisabled}
              />
              <Label htmlFor="include-deps" className="cursor-pointer">
                Incluir dependencias de los archivos seleccionados
              </Label>
              {/* Input oculto para que viaje en el FormData */}
              <input
                type="hidden"
                name="includeDependencies"
                value={String(store.includeDependencies)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between gap-2">
                <Label htmlFor="user-query" className="text-sm font-medium">
                  Tu consulta
                </Label>
                <span className="text-[11px] text-muted-foreground">
                  Ctrl/⌘ + Enter para enviar
                </span>
              </div>
              <Textarea
                id="user-query"
                name="userQuery"
                value={store.userQuery}
                onChange={(e) => store.setUserQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ej: Explícame qué hace esta función y propón mejoras de rendimiento."
                className="min-h-32 text-sm md:text-base"
                disabled={isDisabled}
              />
              <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                <span>
                  Selecciona al menos un archivo para generar el prompt.
                </span>
                <span>{store.userQuery.trim().length} caracteres</span>
              </div>
            </div>
            {store.selectedFiles.map((path) => (
              <input key={path} type="hidden" name="filePath" value={path} />
            ))}
            <input
              type="hidden"
              name="systemPrompt"
              value={store.systemPrompt}
            />
            {!isReadyToReview && (
              <Button
                type="submit"
                disabled={!store.userQuery.trim() || isFetchingFiles}
                className="inline-flex max-w-60 items-center gap-2"
              >
                {isFetchingFiles ? (
                  <>
                    <span className="icon-[fa7-solid--spinner] animate-spin" />
                    Analizando archivos...
                  </>
                ) : (
                  <>
                    <span className="icon-[fa7-solid--paper-plane]" />
                    Generar y revisar prompt
                  </>
                )}
              </Button>
            )}
          </form>
        </CardContent>
      </Card>

      {/* --- SECCIÓN 2: Prompt Generado y Acciones --- */}
      {isReadyToReview && (
        <Card className="border-border/60 shadow-sm">
          <CardHeader>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium tracking-wide uppercase">
                <span>Paso 2</span>
              </div>
              <CardTitle className="text-lg md:text-xl">
                Revisa y utiliza el prompt
              </CardTitle>
              <CardDescription className="text-sm md:text-base">
                Copia el prompt para usarlo en otro LLM o procesa la tarea aquí.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {/* Sección de prompt generado */}
            {isReadyToReview && (
              <GeneratedPrompt
                systemPrompt={store.systemPrompt}
                userQuery={store.userQuery}
                fileContents={validFiles}
              />
            )}
            <Separator />
            <div className="flex flex-wrap items-center gap-3">
              <form action={handleInferenceAction}>
                <input
                  type="hidden"
                  name="instruction"
                  value={store.systemPrompt}
                />
                <input type="hidden" name="input" value={finalPrompt} />
                <Button
                  type="submit"
                  disabled={isWaitingForInference}
                  className="inline-flex items-center gap-2"
                >
                  {isWaitingForInference ? (
                    <>
                      <span className="icon-[fa7-solid--spinner] animate-spin" />
                      Procesando con IA...
                    </>
                  ) : (
                    <>
                      <span className="icon-[fa7-solid--brain]" />
                      Analizar con IA
                    </>
                  )}
                </Button>
              </form>

              <Button
                variant="outline"
                onClick={() => {
                  store.resetChatResult();
                  setIsPromptGenerated(false);
                }}
                disabled={isWaitingForInference}
                className="inline-flex items-center gap-2"
              >
                <span className="icon-[fa7-solid--pencil]" />
                Modificar consulta
              </Button>

              <Button
                variant="destructive"
                onClick={() => {
                  store.resetAll();
                  setIsPromptGenerated(false);
                }}
                disabled={isWaitingForInference}
                className="inline-flex items-center gap-2 text-destructive hover:text-destructive"
              >
                <span className="icon-[fa7-solid--arrow-rotate-left]" />
                Empezar de cero
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* --- SECCIÓN 3: Respuesta de la IA --- */}
      {(store.agentResponse.response || inferenceState?.error) && (
        <Card className="overflow-hidden border-border/60 shadow-md transition-all">
          <CardHeader className="border-b bg-muted/30 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <span className="icon-[fluent--brain-sparkle-20-regular]"></span>
                </div>
                <div>
                  <CardTitle className="text-base font-semibold">
                    Respuesta generada
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Respuesta basada en el contexto proporcionado
                  </CardDescription>
                </div>
              </div>
              {store.agentResponse.response && (
                <Badge variant="outline" className="h-6 gap-1 bg-background/50">
                  <span className="icon-[fa7-solid--check-double] text-[10px] text-green-600" />
                  Generado
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="min-h-[200px] transition-all duration-500 ease-in-out">
              {store.agentResponse.response ? (
                <div className="prose prose-sm max-w-none p-6 dark:prose-invert overflow-anchor-none">
                  <Streamdown
                    plugins={{
                      code: createCodePlugin({
                        themes: ["github-light", "github-dark"],
                      }),
                    }}
                  >
                    {store.agentResponse.response}
                  </Streamdown>
                </div>
              ) : isWaitingForInference ? (
                <div className="p-6 space-y-4">
                  <div className="h-4 bg-muted animate-pulse rounded w-3/4" />
                  <div className="h-4 bg-muted animate-pulse rounded w-full" />
                  <div className="h-4 bg-muted animate-pulse rounded w-5/6" />
                </div>
              ) : (
                <div className="p-6">
                  <Alert
                    variant="destructive"
                    className="border-destructive/20 bg-destructive/5 flex items-center"
                  >
                    <span className="icon-[fa7-solid--circle-exclamation] text-destructive" />
                    <AlertDescription className="ml-2 font-medium">
                      {inferenceState?.error}
                    </AlertDescription>
                  </Alert>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
