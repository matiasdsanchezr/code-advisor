"use client";
import { useState, useEffect, useMemo, useTransition } from "react";
import { FileExplorer } from "./file-explorer";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  generatePrompt,
  GeneratePromptResponse,
} from "@/lib/actions/get-source-code";
import { GeneratedUserPrompt } from "./generated-user-prompt";
import { buildPrompt } from "../../lib/utils/build-prompt";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { generateResponse } from "@/lib/actions/chat-agent";
import { EMPTY_FORM_STATE, FormState } from "@/types/form-state";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const DEFAULT_SYSTEM_PROMPT =
  "Eres un asistente experto en análisis de código fuente. Analiza el código proporcionado y responde de forma clara y concisa.";

const INITIAL_PROMPT_RESPONSE: GeneratePromptResponse = {
  files: [],
  userQuery: "",
  formError: undefined,
};

export const ChatShell = ({ filePaths }: { filePaths: string[] }) => {
  const [resetKey, setResetKey] = useState(0);

  return (
    <div key={resetKey}>
      <ChatShellContent
        filePaths={filePaths}
        onReset={() => setResetKey((k) => k + 1)}
      />
    </div>
  );
};

const ChatShellContent = ({
  filePaths,
  onReset,
}: {
  filePaths: string[];
  onReset: () => void;
}) => {
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [showFileExplorer, setShowFileExplorer] = useState(true);
  const [userQuery, setUserQuery] = useState("");
  const [systemPrompt, setSystemPrompt] = useState(DEFAULT_SYSTEM_PROMPT);
  const [systemPromptDraft, setSystemPromptDraft] = useState(
    DEFAULT_SYSTEM_PROMPT
  );
  const [isSystemPromptOpen, setIsSystemPromptOpen] = useState(false);
  const [fileErrors, setFileErrors] = useState<string[]>([]);
  const [isPending, startPromptTransition] = useTransition();
  const [promptData, setPromptData] = useState<GeneratePromptResponse>(
    INITIAL_PROMPT_RESPONSE
  );
  const [isAgentPending, startAgentTransition] = useTransition();
  const [agentResponse, setAgentResponse] =
    useState<FormState>(EMPTY_FORM_STATE);

  const handleGeneratePrompt = (formData: FormData) => {
    startPromptTransition(async () => {
      const result = await generatePrompt(promptData, formData);
      setPromptData(result);
    });
  };

  const handleAgentAction = (formData: FormData) => {
    startAgentTransition(async () => {
      const result = await generateResponse(agentResponse, formData);
      setAgentResponse(result);
    });
  };

  // Efectos para persistir en localStorage
  useEffect(() => {
    const saved = localStorage.getItem("chatShellState");
    if (saved) {
      try {
        const { selectedFiles: savedFiles, userQuery: savedQuery } =
          JSON.parse(saved);
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setSelectedFiles(Array.isArray(savedFiles) ? savedFiles : []);
        setUserQuery(typeof savedQuery === "string" ? savedQuery : "");
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(
      "chatShellState",
      JSON.stringify({ selectedFiles, userQuery })
    );
  }, [selectedFiles, userQuery]);

  useEffect(() => {
    const nextErrors = promptData.files
      .filter((file) => file.error)
      .map((file) => `${file.path}: ${file.error}`);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFileErrors(nextErrors);
  }, [promptData.files]);

  const handleModifyQuery = () => {
    setPromptData(INITIAL_PROMPT_RESPONSE);
    setAgentResponse(EMPTY_FORM_STATE);
  };

  const handleResetSystemPrompt = () => {
    setSystemPromptDraft(DEFAULT_SYSTEM_PROMPT);
  };

  const handleSaveSystemPrompt = () => {
    setSystemPrompt(systemPromptDraft);
    setIsSystemPromptOpen(false);
  };

  const handleOpenSystemPrompt = (open: boolean) => {
    if (open) setSystemPromptDraft(systemPrompt);
    setIsSystemPromptOpen(open);
  };

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
    () => promptData.files.filter((f) => !f.error && f.sourceCode),
    [promptData.files]
  );
  const isPromptGenerated = validFiles.length > 0 && !!promptData.userQuery;
  const isDisabled = isPending || isAgentPending || isPromptGenerated;

  const finalPrompt = useMemo(
    () =>
      buildPrompt(
        systemPrompt,
        promptData.userQuery,
        validFiles.map((f) => f.sourceCode).join("\n\n---\n\n")
      ),
    [systemPrompt, promptData.userQuery, validFiles]
  );

  return (
    <div className="flex flex-col gap-6 p-3">
      {/* --- SECCIÓN 1: Configuración de la Consulta --- */}
      <Card className={isPromptGenerated ? "bg-muted/30" : ""}>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>Paso 1: Define tu consulta</CardTitle>
              <CardDescription>
                Selecciona los archivos y describe la tarea que deseas realizar.
              </CardDescription>
            </div>
            <Dialog
              open={isSystemPromptOpen}
              onOpenChange={handleOpenSystemPrompt}
            >
              <DialogTrigger
                render={
                  <Button variant="outline" size="sm" disabled={isDisabled}>
                    <span className="icon-[fa7-solid--sliders] mr-2" />
                    System Prompt
                  </Button>
                }
              ></DialogTrigger>
              <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle>Configurar System Prompt</DialogTitle>
                  <DialogDescription>
                    Define el comportamiento del asistente antes de procesar los
                    archivos.
                  </DialogDescription>
                </DialogHeader>
                <div className="flex flex-col gap-2 py-2">
                  <Label htmlFor="system-prompt">
                    Instrucciones del sistema
                  </Label>
                  <Textarea
                    id="system-prompt"
                    value={systemPromptDraft}
                    onChange={(e) => setSystemPromptDraft(e.target.value)}
                    placeholder="Escribe las instrucciones para el asistente..."
                    className="min-h-40 resize-y"
                  />
                </div>
                <DialogFooter className="gap-2">
                  <Button
                    variant="ghost"
                    onClick={() => setIsSystemPromptOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button variant="outline" onClick={handleResetSystemPrompt}>
                    Restaurar predeterminado
                  </Button>
                  <Button onClick={handleSaveSystemPrompt}>Guardar</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Button
            onClick={() => setShowFileExplorer(!showFileExplorer)}
            className="w-min"
            variant="secondary"
            disabled={isDisabled}
          >
            <span className="icon-[fa7-solid--folder-open] mr-2" />
            {showFileExplorer ? "Ocultar" : "Mostrar"} explorador de archivos (
            {selectedFiles.length})
          </Button>
          {showFileExplorer && (
            <FileExplorer
              filePaths={filePaths}
              selectedFiles={selectedFiles}
              onSelectedFilesChange={setSelectedFiles}
              disabled={isDisabled}
            />
          )}

          {(promptData.formError || fileErrors.length > 0) && (
            <Alert variant="destructive">
              <AlertDescription className="space-y-1">
                {promptData.formError && <p>{promptData.formError}</p>}
                {fileErrors.length > 0 && (
                  <p>
                    No se pudieron leer {fileErrors.length} archivo(s). Revisa
                    la selección o intenta de nuevo.
                  </p>
                )}
              </AlertDescription>
            </Alert>
          )}

          <form action={handleGeneratePrompt} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="user-query">Tu consulta</Label>
              <Textarea
                id="user-query"
                name="userQuery"
                value={userQuery}
                onChange={(e) => setUserQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ej: ¿Qué hace esta función? ¿Cómo puedo optimizar este código?"
                className="min-h-28 resize-y"
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
                disabled={
                  selectedFiles.length === 0 || !userQuery.trim() || isPending
                }
                className="max-w-56"
              >
                {isPending ? (
                  <>
                    <span className="icon-[fa7-solid--spinner] mr-2 animate-spin" />
                    Analizando archivos...
                  </>
                ) : (
                  <>
                    <span className="icon-[fa7-solid--paper-plane] mr-2" />
                    Generar y revisar prompt
                  </>
                )}
              </Button>
            )}
          </form>
        </CardContent>
      </Card>

      {/* --- SECCIÓN 2: Prompt Generado y Acciones --- */}
      {isPromptGenerated && (
        <Card>
          <CardHeader>
            <CardTitle>Paso 2: Revisa y utiliza el prompt</CardTitle>
            <CardDescription>
              Copia el prompt para usarlo en otro LLM o analízalo aquí
              directamente.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <GeneratedUserPrompt
              fileContents={promptData.files}
              userQuery={promptData.userQuery}
              systemPrompt={systemPrompt}
            />
            <Separator />
            <div className="flex items-center gap-4 flex-wrap">
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
                      <span className="icon-[fa7-solid--spinner] mr-2 animate-spin" />
                      Procesando con IA...
                    </>
                  ) : (
                    <>
                      <span className="icon-[fa7-solid--brain] mr-2" />
                      Analizar con IA
                    </>
                  )}
                </Button>
              </form>
              <Button
                variant="outline"
                onClick={handleModifyQuery}
                disabled={isAgentPending}
              >
                <span className="icon-[fa7-solid--pencil] mr-2" />
                Modificar Consulta
              </Button>
              <Button
                variant="destructive"
                onClick={onReset}
                disabled={isAgentPending}
              >
                <span className="icon-[fa7-solid--arrow-rotate-left] mr-2" />
                Empezar de Cero
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* --- SECCIÓN 3: Respuesta de la IA --- */}
      {agentResponse.timestamp > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Respuesta del Asistente</CardTitle>
          </CardHeader>
          <CardContent>
            {agentResponse.success &&
            (agentResponse.data as { response: string })?.response ? (
              <div className="p-4 border rounded-lg bg-zinc-100 dark:bg-zinc-900 whitespace-pre-wrap font-mono text-sm">
                {(agentResponse.data as { response: string }).response}
              </div>
            ) : (
              <Alert variant="destructive">
                <AlertDescription>{agentResponse.message}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};
