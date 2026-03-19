"use client";
import { generateAiAnswer } from "@/actions/chat-agent";
import { generatePrompt } from "@/actions/get-source-code";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
import { useChatStore } from "@/stores/chat-store";
import { createCodePlugin } from "@streamdown/code";
import { useMemo, useState, useTransition } from "react";
import { Streamdown } from "streamdown";
import { useShallow } from "zustand/shallow";
import { buildPrompt } from "../../utils/build-prompt";
import { FileExplorer } from "./file-explorer";
import { GeneratedUserPrompt } from "./generated-user-prompt";
import { SystemPromptDialog } from "./system-prompt-dialog";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

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
    includeDependencies,
    setUserQuery,
    setFileContents,
    setAgentResponse,
    setIncludeDependencies,
    resetChatResult,
    resetAll,
  } = useChatStore(
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
  const [isAnalyzingFiles, startFileAnalysisTransition] = useTransition();
  const [isWaitingForInference, startInferenceTransition] = useTransition();
  const [agentError, setAgentError] = useState<string>("");

  const handleFetchFileContents = (formData: FormData) => {
    startFileAnalysisTransition(async () => {
      const result = await generatePrompt({}, formData);
      const analyzedFiles = result.data;
      if (analyzedFiles) setFileContents(analyzedFiles);
    });
  };

  const handleAgentAction = (formData: FormData) => {
    startInferenceTransition(async () => {
      const result = await generateAiAnswer({ data: agentResponse }, formData);
      const inferenceResponse = result.data;
      if (inferenceResponse) {
        setAgentResponse(inferenceResponse);
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
  const isReadyToReview = validFiles.length > 0 && !!userQuery;
  const isDisabled =
    isAnalyzingFiles || isWaitingForInference || isReadyToReview;
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
            <SystemPromptDialog disabled={isDisabled} />
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
                {selectedFiles.length}
              </span>
            </Button>

            {selectedFiles.length > 0 && (
              <span className="text-xs text-muted-foreground">
                {selectedFiles.length} archivo(s) seleccionado(s)
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
                checked={includeDependencies}
                onCheckedChange={(val) => setIncludeDependencies(!!val)}
                disabled={isDisabled}
              />
              <Label htmlFor="include-deps" className="cursor-pointer">
                Incluir dependencias de los archivos seleccionados
              </Label>
              {/* Input oculto para que viaje en el FormData */}
              <input
                type="hidden"
                name="includeDependencies"
                value={String(includeDependencies)}
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
                value={userQuery}
                onChange={(e) => setUserQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ej: Explícame qué hace esta función y proponé mejoras de rendimiento."
                className="min-h-32 text-sm md:text-base"
                disabled={isDisabled}
              />
              <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                <span>
                  Selecciona al menos un archivo para generar el prompt.
                </span>
                <span>{userQuery.trim().length} caracteres</span>
              </div>
            </div>
            {selectedFiles.map((path) => (
              <input key={path} type="hidden" name="filePath" value={path} />
            ))}
            <input type="hidden" name="systemPrompt" value={systemPrompt} />
            {!isReadyToReview && (
              <Button
                type="submit"
                disabled={
                  selectedFiles.length === 0 ||
                  !userQuery.trim() ||
                  isAnalyzingFiles
                }
                className="inline-flex max-w-60 items-center gap-2"
              >
                {isAnalyzingFiles ? (
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
                Copia el prompt para usarlo en otro LLM o analízalo aquí.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {/* Seccion de prompt generado */}
            <GeneratedUserPrompt />
            <Separator />
            <div className="flex flex-wrap items-center gap-3">
              <form action={handleAgentAction}>
                <input type="hidden" name="instruction" value={systemPrompt} />
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
                onClick={resetChatResult}
                disabled={isWaitingForInference}
                className="inline-flex items-center gap-2"
              >
                <span className="icon-[fa7-solid--pencil]" />
                Modificar consulta
              </Button>

              <Button
                variant="destructive"
                onClick={resetAll}
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
      {/* --- SECCIÓN 3: Respuesta de la IA --- */}
      {(agentResponse.response || agentError) && (
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
              {agentResponse.response && (
                <Badge variant="outline" className="h-6 gap-1 bg-background/50">
                  <span className="icon-[fa7-solid--check-double] text-[10px] text-green-600" />
                  Generado
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {agentResponse.response ? (
              <div className="relative">
                <div className="prose prose-sm max-w-none p-6 dark:prose-invert md:prose-base">
                  <Streamdown
                    plugins={{
                      code: createCodePlugin({
                        themes: ["github-light", "github-dark"],
                      }),
                    }}
                  >
                    {agentResponse.response}
                  </Streamdown>
                </div>

                <div className="flex items-center gap-2 border-t bg-muted/20 px-6 py-2 text-[10px] text-muted-foreground">
                  <span className="icon-[fa7-solid--circle-info]" />
                  Verifica siempre el código generado antes de aplicarlo.
                </div>
              </div>
            ) : (
              <div className="p-6">
                <Alert
                  variant="destructive"
                  className="border-destructive/20 bg-destructive/5"
                >
                  <span className="icon-[fa7-solid--circle-exclamation] text-destructive" />
                  <AlertDescription className="ml-2 font-medium">
                    {agentError}
                  </AlertDescription>
                </Alert>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};
