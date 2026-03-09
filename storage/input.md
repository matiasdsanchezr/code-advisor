# TAREA ACTUAL En base a la siguiente información de contexto:
<context>
[chat-shell.tsx](/home/user/ai-web-app/code-advisor/src/app/_components/chat-shell.tsx)

```tsx
"use client";
import { useActionState, useState, useEffect } from "react";
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
import { GeneratedUserPrompt, buildPrompt } from "./generated-user-prompt";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { generateResponse } from "@/lib/actions/chat-agent";
import { EMPTY_FORM_STATE, FormState } from "@/types/form-state";

const DEFAULT_SYSTEM_PROMPT =
  "Eres un asistente experto en análisis de código fuente. Analiza el código proporcionado y responde de forma clara y concisa.";

export const ChatShell = ({ filePaths }: { filePaths: string[] }) => {
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [showFileExplorer, setShowFileExplorer] = useState(false);
  const [userQuery, setUserQuery] = useState("");
  const [systemPrompt, setSystemPrompt] = useState(DEFAULT_SYSTEM_PROMPT);
  const [systemPromptDraft, setSystemPromptDraft] = useState(
    DEFAULT_SYSTEM_PROMPT
  );
  const [isSystemPromptOpen, setIsSystemPromptOpen] = useState(false);
  const [fileErrors, setFileErrors] = useState<string[]>([]);

  // Estado para la generación del prompt inicial (lectura de archivos)
  const [promptData, formAction, isPending] = useActionState<
    GeneratePromptResponse,
    FormData
  >(generatePrompt, {
    files: [],
    userQuery: "",
    formError: undefined,
  });

  // Estado para la respuesta del agente de IA
  const [agentResponse, agentAction, isAgentPending] = useActionState<
    FormState,
    FormData
  >(generateResponse, EMPTY_FORM_STATE);

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

  const isDisabled = isPending || isAgentPending;

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

  // Cálculo del prompt para enviar al agente
  const validFiles = promptData.files.filter((f) => !f.error && f.sourceCode);
  const joinedSourceCode = validFiles
    .map((f) => f.sourceCode)
    .join("\n\n---\n\n");
  const finalPrompt = buildPrompt(
    systemPrompt,
    promptData.userQuery,
    joinedSourceCode
  );

  return (
    <div className="flex flex-col gap-4 p-3">
      <div className="flex items-center justify-end">
        <Dialog open={isSystemPromptOpen} onOpenChange={handleOpenSystemPrompt}>
          <DialogTrigger
            render={
              <Button variant="outline" size="sm" disabled={isDisabled}>
                <span className="icon-[fa7-solid--sliders] mr-2" />
                System Prompt
              </Button>
            }
          />
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Configurar System Prompt</DialogTitle>
              <DialogDescription>
                Define el comportamiento del asistente antes de procesar los
                archivos.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-2 py-2">
              <Label htmlFor="system-prompt">Instrucciones del sistema</Label>
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

      <Button
        onClick={() => setShowFileExplorer(!showFileExplorer)}
        className="w-min mx-auto"
        variant="secondary"
        disabled={isDisabled}
      >
        <span className="icon-[fa7-solid--folder-open] mr-2" />
        {showFileExplorer ? "Ocultar" : "Mostrar"} explorador de archivos
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
                No se pudieron leer {fileErrors.length} archivo(s). Revisa la
                selección o intenta de nuevo.
              </p>
            )}
          </AlertDescription>
        </Alert>
      )}

      <form action={formAction} className="flex flex-col gap-4">
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
        <Button
          type="submit"
          disabled={
            selectedFiles.length === 0 || !userQuery.trim() || isPending
          }
          className="max-w-44"
        >
          {isPending ? (
            <>
              <span className="icon-[fa7-solid--spinner] mr-2 animate-spin" />
              Analizando...
            </>
          ) : (
            <>
              <span className="icon-[fa7-solid--paper-plane] mr-2" />
              Generar prompt
            </>
          )}
        </Button>
      </form>

      <GeneratedUserPrompt
        fileContents={promptData.files}
        userQuery={promptData.userQuery}
        systemPrompt={systemPrompt}
      />

      {/* Sección de envío al agente */}
      {validFiles.length > 0 && promptData.userQuery && (
        <div>
          <form action={agentAction} className="flex flex-col gap-4">
            {/* Inputs ocultos para el server action */}
            <input type="hidden" name="instruction" value={systemPrompt} />
            <input type="hidden" name="input" value={finalPrompt} />

            <Button
              type="submit"
              disabled={isAgentPending || isPending}
              className="max-w-44 bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isAgentPending ? (
                <>
                  <span className="icon-[fa7-solid--spinner] mr-2 animate-spin" />
                  Procesando...
                </>
              ) : (
                <>
                  <span className="icon-[fa7-solid--brain] mr-2" />
                  Analizar con IA
                </>
              )}
            </Button>
          </form>
          {/* Visualización de la respuesta */}
          {agentResponse.success &&
            (agentResponse.data as { response: string }) && (
              <div className="mt-4 p-4 border rounded-lg bg-zinc-100 dark:bg-zinc-900 whitespace-pre-wrap">
                <h3 className="font-bold mb-2 text-lg">Respuesta:</h3>
                <div>
                  {(agentResponse.data as { response: string }).response}
                </div>
              </div>
            )}

          {!agentResponse.success && agentResponse.message && (
            <Alert variant="destructive" className="mt-2">
              <AlertDescription>{agentResponse.message}</AlertDescription>
            </Alert>
          )}
        </div>
      )}
    </div>
  );
};

```

---

[file-content.tsx](/home/user/ai-web-app/code-advisor/src/app/_components/file-content.tsx)

```tsx
import { FileContent } from "@/types/file-content"

export const FileContentCard = ({fileContents} : {fileContents: FileContent[]} ) =>{
    return (<div className="flex flex-col gap-6">
        {fileContents.map(({ path, content, error }) => (
          <div
            key={path}
            className="rounded-lg border border-zinc-700 overflow-hidden"
          >
            <div className="flex items-center gap-2 bg-zinc-800 px-4 py-2">
              <span className="icon-[fa7-solid--file-code] text-zinc-400" />
              <span className="font-mono text-sm text-zinc-300 truncate">
                {path}
              </span>
            </div>
            {error ? (
              <p className="p-4 text-sm text-red-400">{error}</p>
            ) : (
              <pre className="overflow-auto p-4 text-xs leading-relaxed text-zinc-100 bg-zinc-950">
                <code>{content}</code>
              </pre>
            )}
          </div>
        ))}
      </div>)
}
```

---

[file-explorer.tsx](/home/user/ai-web-app/code-advisor/src/app/_components/file-explorer.tsx)

```tsx
"use client";

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

interface FileExplorerProps {
  filePaths: string[];
  selectedFiles: string[];
  onSelectedFilesChange: (files: string[]) => void;
  disabled?: boolean;
}

interface TreeNode {
  id: string;
  name: string;
  isFile: boolean;
  children: TreeNode[];
  filePath?: string; // solo en hojas
}

function getCommonBase(paths: string[]): string {
  if (!paths.length) return "";
  const split = paths.map((p) => p.split("/"));
  const minLen = Math.min(...split.map((s) => s.length));
  const common: string[] = [];
  for (let i = 0; i < minLen; i++) {
    if (split.every((s) => s[i] === split[0][i])) common.push(split[0][i]);
    else break;
  }
  return common.join("/");
}

function buildTree(filePaths: string[]): {
  roots: TreeNode[];
  folderToFiles: Map<string, string[]>;
  fileIdToPath: Map<string, string>;
} {
  const base = getCommonBase(filePaths);
  const nodeMap = new Map<string, TreeNode>();
  const rootMap = new Map<string, TreeNode>();
  const fileIdToPath = new Map<string, string>();

  for (const absPath of filePaths) {
    const relative = absPath.slice(base.length).replace(/^\//, "");
    const parts = relative.split("/").filter(Boolean);

    let currentMap = rootMap;
    let currentId = base;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isFile = i === parts.length - 1;
      currentId = `${currentId}/${part}`;

      if (!currentMap.has(currentId)) {
        const node: TreeNode = {
          id: currentId,
          name: part,
          isFile,
          children: [],
          filePath: isFile ? absPath : undefined,
        };
        currentMap.set(currentId, node);
        nodeMap.set(currentId, node);
        if (isFile) fileIdToPath.set(currentId, absPath);
      }

      if (!isFile) {
        const node = currentMap.get(currentId)!;
        const childMap = new Map<string, TreeNode>();
        node.children.forEach((c) => childMap.set(c.id, c));
        currentMap = childMap;
        // Re-sync children array (will be updated next iteration)
        node.children = [...childMap.values()];
      }
    }
  }

  // Rebuild children arrays properly
  // Re-traverse to correctly assign children
  const roots2: TreeNode[] = [];
  const nodeMap2 = new Map<string, TreeNode>();

  for (const absPath of filePaths) {
    const relative = absPath.slice(base.length).replace(/^\//, "");
    const parts = relative.split("/").filter(Boolean);

    let currentId = base;
    let parentNode: TreeNode | null = null;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isFile = i === parts.length - 1;
      const nodeId = `${currentId}/${part}`;
      currentId = nodeId;

      if (!nodeMap2.has(nodeId)) {
        const node: TreeNode = {
          id: nodeId,
          name: part,
          isFile,
          children: [],
          filePath: isFile ? absPath : undefined,
        };
        nodeMap2.set(nodeId, node);
        if (parentNode) {
          parentNode.children.push(node);
        } else {
          roots2.push(node);
        }
      }

      if (!isFile) {
        parentNode = nodeMap2.get(nodeId)!;
      }
    }
  }

  // Build folderToFiles
  const folderToFiles = new Map<string, string[]>();

  function collectFiles(node: TreeNode): string[] {
    if (node.isFile) return node.filePath ? [node.filePath] : [];
    const files = node.children.flatMap(collectFiles);
    folderToFiles.set(node.id, files);
    return files;
  }

  roots2.forEach(collectFiles);

  return { roots: roots2, folderToFiles, fileIdToPath };
}

// ─── IndeterminateCheckbox ────────────────────────────────────────────────────

function IndeterminateCheckbox({
  checked,
  indeterminate,
  onCheckedChange,
  className,
  disabled,
}: {
  checked: boolean;
  indeterminate: boolean;
  onCheckedChange: (checked: boolean) => void;
  className?: string;
  disabled?: boolean;
}) {
  const ref = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (ref.current) {
      const input = ref.current.querySelector("input");
      if (input) {
        input.indeterminate = indeterminate && !checked;
      }
    }
  }, [indeterminate, checked]);

  return (
    <Checkbox
      ref={ref}
      checked={indeterminate ? false : checked}
      indeterminate={indeterminate}
      onCheckedChange={(val) => onCheckedChange(!!val)}
      className={`${className} shrink-0 `}
      onClick={(e) => e.stopPropagation()}
      disabled={disabled}
    />
  );
}

function TreeNodeRow({
  node,
  depth,
  selectedSet,
  folderToFiles,
  onToggle,
  disabled,
}: {
  node: TreeNode;
  depth: number;
  selectedSet: Set<string>;
  folderToFiles: Map<string, string[]>;
  onToggle: (node: TreeNode) => void;
  disabled: boolean;
}) {
  const [open, setOpen] = useState(true);

  const { checked, indeterminate } = useMemo(() => {
    if (node.isFile) {
      return {
        checked: selectedSet.has(node.filePath!),
        indeterminate: false,
      };
    }
    const files = folderToFiles.get(node.id) ?? [];
    if (!files.length) return { checked: false, indeterminate: false };
    const selectedCount = files.filter((f) => selectedSet.has(f)).length;
    return {
      checked: selectedCount === files.length,
      indeterminate: selectedCount > 0 && selectedCount < files.length,
    };
  }, [node, selectedSet, folderToFiles]);

  const hasChildren = !node.isFile && node.children.length > 0;

  const handleClickOpen = useCallback(
    (e: React.MouseEvent<HTMLLIElement, MouseEvent>) => {
      if (hasChildren && e.currentTarget === e.target) {
        e.stopPropagation();
        setOpen((o) => !o);
      }
    },
    [hasChildren, setOpen]
  );

  return (
    <li onClick={handleClickOpen}>
      <div
        className={cn(
          "flex items-center gap-1.5 px-2 py-1 rounded-md cursor-pointer",
          "hover:bg-muted/60 transition-colors group select-none",
          "text-sm"
        )}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
        onClick={(e) => {
          if (hasChildren && e.currentTarget === e.target) {
            e.stopPropagation();
            setOpen((o) => !o);
          }
        }}
      >
        {/* Expand/collapse arrow for folders */}
        {!node.isFile ? (
          <span
            className={cn(
              "icon-[fa7-solid--chevron-right] text-muted-foreground/60 text-[10px] shrink-0 transition-transform",
              open && "rotate-90"
            )}
            onClick={handleClickOpen}
          />
        ) : (
          <span className="w-[10px] shrink-0" />
        )}

        {/* Icon */}
        {node.isFile ? (
          <span className="icon-[fa7-solid--file-code] opacity-50 shrink-0 text-xs" />
        ) : (
          <span
            className={cn(
              "shrink-0 text-xs",
              open
                ? "icon-[fa7-solid--folder-open] text-yellow-400"
                : "icon-[fa7-solid--folder] text-yellow-500"
            )}
          />
        )}

        <span
          className={cn(
            "truncate",
            node.isFile ? "text-muted-foreground" : "font-medium"
          )}
          onClick={handleClickOpen}
        >
          {node.name}
        </span>

        <div className="flex-1 border-t border-black-200"></div>

        <IndeterminateCheckbox
          checked={checked}
          indeterminate={indeterminate}
          onCheckedChange={() => onToggle(node)}
          className="ml-auto"
          disabled={disabled}
        />
      </div>

      {hasChildren && open && (
        <ul>
          {node.children.map((child) => (
            <TreeNodeRow
              key={child.id}
              node={child}
              depth={depth + 1}
              selectedSet={selectedSet}
              folderToFiles={folderToFiles}
              onToggle={onToggle}
              disabled={disabled}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

export function FileExplorer({
  filePaths,
  onSelectedFilesChange,
  selectedFiles,
  disabled = false,
}: FileExplorerProps) {
  const { roots, folderToFiles, fileIdToPath } = useMemo(
    () => buildTree(filePaths),
    [filePaths]
  );

  const selectedSet = useMemo(() => new Set(selectedFiles), [selectedFiles]);

  const handleToggle = useCallback(
    (node: TreeNode) => {
      if (disabled) return;

      const affected: string[] = node.isFile
        ? node.filePath
          ? [node.filePath]
          : []
        : folderToFiles.get(node.id) ?? [];

      if (!affected.length) return;

      const next = new Set(selectedFiles);
      const allSelected = affected.every((f) => next.has(f));
      affected.forEach((f) => (allSelected ? next.delete(f) : next.add(f)));
      onSelectedFilesChange([...next]);
    },
    [disabled, folderToFiles, selectedFiles, onSelectedFilesChange]
  );

  return (
    <div className="md:flex gap-4 flex-1 min-h-0 max-h-150 m-auto border-2 rounded-lg">
      {/* ── Panel izquierdo: árbol ── */}
      <div className="md:w-[min(100px,1/2)] shrink-0 border rounded-lg bg-card flex flex-col overflow-y-scroll">
        <div className="px-3 py-2 border-b flex items-center justify-between">
          <span className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
            <span className="icon-[fa7-solid--sitemap]" />
            Estructura
          </span>
          <Badge variant="secondary">{filePaths.length} archivos</Badge>
        </div>
        <ScrollArea className="flex-1">
          <ul className="p-2">
            {roots.map((node) => (
              <TreeNodeRow
                key={node.id}
                node={node}
                depth={0}
                selectedSet={selectedSet}
                folderToFiles={folderToFiles}
                onToggle={handleToggle}
                disabled={disabled}
              />
            ))}
          </ul>
        </ScrollArea>
      </div>

      {/* ── Panel derecho: archivos seleccionados ── */}
      <div className="border rounded-lg bg-card flex flex-col min-h-0">
        <div className="px-3 py-2 border-b flex items-center justify-between">
          <span className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
            <span className="icon-[fa7-solid--square-check]" />
            Seleccionados
          </span>
          <div className="flex items-center gap-2">
            <Badge>{selectedFiles.length}</Badge>
            {selectedFiles.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-xs"
                onClick={() => {
                  if (disabled) return;
                  if (
                    window.confirm(
                      "¿Estás seguro de limpiar toda la selección?"
                    )
                  ) {
                    onSelectedFilesChange([]);
                  }
                }}
                disabled={disabled}
              >
                Limpiar
              </Button>
            )}
          </div>
        </div>
        <ScrollArea className="flex-1 p-3 overflow-y-scroll">
          {selectedFiles.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 gap-2 text-muted-foreground">
              <span className="icon-[fa7-solid--arrow-pointer] text-2xl" />
              <p className="text-sm">
                Selecciona archivos o carpetas del árbol
              </p>
            </div>
          ) : (
            <ul className="space-y-1">
              {[...selectedFiles].sort().map((file) => (
                <li
                  key={file}
                  className="text-xs font-mono text-muted-foreground flex items-center gap-1.5 hover:text-foreground transition-colors"
                >
                  <span className="icon-[fa7-solid--file] text-primary shrink-0" />
                  <span className="truncate">{file}</span>
                </li>
              ))}
            </ul>
          )}
        </ScrollArea>
      </div>
    </div>
  );
}

```

---

[generated-user-prompt.tsx](/home/user/ai-web-app/code-advisor/src/app/_components/generated-user-prompt.tsx)

```tsx
"use client";
import { useState } from "react";
import { Copy, Check, FileCode2, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { FileContent } from "@/types/file-content";

interface SourceCodeBlockProps {
  fileContents: FileContent[];
  systemPrompt: string;
  userQuery: string;
}

// Se exporta la función para ser usada en otros componentes
export const buildPrompt = (
  systemPrompt: string,
  userInput: string,
  joinedsourceCode: string
) => `# TAREA ACTUAL En base a la siguiente información de contexto:
<context>
${joinedsourceCode}
</context>
---
Instrucciones
<system_instructions>
${systemPrompt}
</system_instructions>

Llevar a cabo la siguiente tarea
<task>
${userInput}
</task>`;

export const GeneratedUserPrompt = ({
  fileContents,
  userQuery,
  systemPrompt,
}: SourceCodeBlockProps) => {
  const [copied, setCopied] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const validFiles = fileContents.filter((f) => !f.error && f.sourceCode);
  const joinedSourceCode = validFiles
    .map((f) => f.sourceCode)
    .join("\n\n---\n\n");

  const generatedUserPrompt = buildPrompt(
    systemPrompt,
    userQuery,
    joinedSourceCode
  );

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(generatedUserPrompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Error al copiar:", err);
    }
  };

  if (validFiles.length === 0) return null;

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={setIsOpen}
      className="rounded-xl border border-border bg-muted/40"
    >
      {/* Header siempre visible */}
      <div className="flex items-center justify-between gap-2 p-4">
        <CollapsibleTrigger className="flex items-center gap-2 text-sm font-medium hover:text-foreground/80 transition-colors">
          <ChevronDown
            className="h-4 w-4 text-muted-foreground transition-transform duration-200"
            style={{
              transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
            }}
          />
          <FileCode2 className="h-4 w-4 text-muted-foreground" />
          Prompt generado
          <Badge variant="secondary">{validFiles.length} archivos</Badge>
        </CollapsibleTrigger>

        {/* Copiar siempre visible para no tener que abrir antes de copiar */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleCopy}
          className="gap-1.5"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5 text-green-500" />
              <span className="text-green-500">Copiado</span>
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" />
              Copiar todo
            </>
          )}
        </Button>
      </div>

      <CollapsibleContent className="flex flex-col gap-3 px-4 pb-4">
        {/* Badges de archivos incluidos */}
        <div className="flex flex-wrap gap-1.5">
          {validFiles.map((f) => (
            <Badge key={f.path} variant="outline" className="font-mono text-xs">
              {f.path.split("/").pop()}
            </Badge>
          ))}
        </div>

        <Textarea
          readOnly
          value={generatedUserPrompt}
          className="font-mono text-xs resize-y min-h-64 max-h-[500px] bg-background"
          aria-label="Código fuente unificado"
        />
        <p className="text-xs text-muted-foreground text-right">
          {generatedUserPrompt.length.toLocaleString()} caracteres · ~
          {Math.ceil(generatedUserPrompt.length / 4).toLocaleString()} tokens
          estimados
        </p>
      </CollapsibleContent>
    </Collapsible>
  );
};

```

---

[navbar.tsx](/home/user/ai-web-app/code-advisor/src/app/_components/navbar.tsx)

```tsx
import { FileCode } from "lucide-react";

type NavbarProps = {
  chatAgentInfo: { isBusy: boolean; model: string };
};

export const Navbar = ({ chatAgentInfo }: NavbarProps) => {
  return (
    <div className="flex items-center justify-between bg-primary p-4 gap-3 text-zinc-300">
      <div className="flex items-center gap-2">
        <FileCode className="block" />
        <h2 className="uppercase">Code Advisor</h2>
      </div>
      <p>Modelo: {chatAgentInfo.model}</p>
      <p>Estado: {chatAgentInfo.isBusy ? "Ocupado" : "Disponible"}</p>
    </div>
  );
};

```

---

[chat-agent.tsx](/home/user/ai-web-app/code-advisor/src/lib/actions/chat-agent.tsx)

```tsx
"use server";
import { ChatCompletionAgent } from "@/services/chat-completion/chat-completion.service";
import { FormState } from "@/types/form-state";

export async function getChatAgentState() {
  const agent = await ChatCompletionAgent.getInstance();
  return { model: agent.model, isBusy: agent.isBusy };
}

export async function generateResponse(
  prevState: FormState,
  formData: FormData
): Promise<FormState> {
  try {
    const systemPrompt = formData.get("instruction") as string;
    const userInput = formData.get("input") as string;
    
    const agent = await ChatCompletionAgent.getInstance();
    const modelResponse = await agent.generateContent(systemPrompt, userInput);
    return {
      success: true,
      message: "Respuesta generada correctamente",
      fieldErrors: {},
      timestamp: Date.now(),
      data: {
        response: modelResponse.response,
        thoughts: modelResponse.thoughts,
      },
    };
  } catch (error: unknown) {
    const status = (error as { status?: number })?.status;
    if (status == 429)
      return {
        success: false,
        message:
          "Error al generar la respuesta. No hay capacidad para el modelo establecido",
        fieldErrors: {},
        timestamp: Date.now(),
      };

    return {
      success: false,
      message: "Se produjo un error desconocido al generar la respuesta",
      fieldErrors: {},
      timestamp: Date.now(),
    };
  }
}

```

---

[get-files.tsx](/home/user/ai-web-app/code-advisor/src/lib/actions/get-files.tsx)

```tsx
"use server";
import fs from "fs/promises";
import path from "path";
import { config } from "../utils/config";

const DEFAULT_IGNORE = [
  "node_modules",
  ".git",
  ".next",
  "dist",
  "build",
  ".cache",
  ".yalc",
  "storage",
];

async function walkDir(
  dir: string,
  extensions: string[],
  ignore: string[]
): Promise<string[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    if (entry.isDirectory() && ignore.includes(entry.name)) continue;

    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      files.push(...(await walkDir(fullPath, extensions, ignore)));
    } else if (
      entry.isFile() &&
      extensions.some((ext) => entry.name.endsWith(ext))
    ) {
      files.push(fullPath.replace(/\\/g, "/"));
    }
  }

  return files;
}

async function getFilePaths(
  folder: string,
  extensions: string | string[],
  ignore: string[] = DEFAULT_IGNORE
): Promise<string[]> {
  const exts = Array.isArray(extensions) ? extensions : [extensions];

  const stat = await fs.stat(folder).catch(() => null);

  if (!stat) {
    throw new Error(`La carpeta "${folder}" no existe.`);
  }

  if (!stat.isDirectory()) {
    throw new Error(`"${folder}" no es una carpeta.`);
  }

  return walkDir(folder, exts, ignore);
}

export async function loadFiles() {
  return getFilePaths(
    config.TARGET_PROJECT_PATH,
    [".tsx", ".ts", ".js", "md", "json"],
    [...DEFAULT_IGNORE, "coverage", "__tests__", "storybook-static"]
  );
}

```

---

[get-source-code.tsx](/home/user/ai-web-app/code-advisor/src/lib/actions/get-source-code.tsx)

```tsx
"use server";

import { FileContent } from "@/types/file-content";
import fs from "fs/promises";
import path from "path";
import { z } from "zod";
import { config } from "../utils/config";

const ALLOWED_EXTENSIONS = new Set([".tsx", ".ts", ".js", ".md", ".json"]);

const FilePathsSchema = z.object({
  filePaths: z.array(z.string().trim().min(1)).min(1).max(200),
});

const GeneratePromptSchema = z.object({
  userQuery: z.string().trim().min(1, "La consulta es obligatoria").max(10_000),
  filePaths: z.array(z.string().trim().min(1)).min(1).max(200),
});

const getFileSourceCode = (fileContent: FileContent): string => {
  if (fileContent.error) return "";

  const fileName = path.basename(fileContent.path);
  const ext = path.extname(fileName).slice(1) || "txt";

  return `\
[${fileName}](${fileContent.path})

\`\`\`${ext}
${fileContent.content}
\`\`\``;
};

function isPathInsideBase(basePath: string, candidatePath: string) {
  const relative = path.relative(basePath, candidatePath);
  return (
    relative === "" ||
    (!relative.startsWith("..") && !path.isAbsolute(relative))
  );
}

async function readSelectedFiles(paths: string[]): Promise<FileContent[]> {
  const basePath = path.resolve(config.TARGET_PROJECT_PATH);
  const uniquePaths = [...new Set(paths)].map((p) => path.resolve(p));

  return Promise.all(
    uniquePaths.map(async (candidatePath) => {
      const ext = path.extname(candidatePath).toLowerCase();

      if (!isPathInsideBase(basePath, candidatePath)) {
        return {
          path: candidatePath,
          content: "",
          error: "Ruta inválida: el archivo está fuera del proyecto permitido",
        };
      }

      if (!ALLOWED_EXTENSIONS.has(ext)) {
        return {
          path: candidatePath,
          content: "",
          error: `Extensión no permitida: ${ext || "(sin extensión)"}`,
        };
      }

      try {
        const content = await fs.readFile(candidatePath, "utf-8");
        const sourceCode = getFileSourceCode({ path: candidatePath, content });
        return { path: candidatePath, content, sourceCode };
      } catch (error) {
        return {
          path: candidatePath,
          content: "",
          error: String(error),
        };
      }
    })
  );
}

export async function analyzeFiles(
  _prev: FileContent[],
  formData: FormData
): Promise<FileContent[]> {
  const parsed = FilePathsSchema.safeParse({
    filePaths: formData.getAll("filePath"),
  });

  if (!parsed.success) return [];

  return readSelectedFiles(parsed.data.filePaths);
}

export type GeneratePromptResponse = {
  files: FileContent[];
  userQuery: string;
  formError?: string;
};

export async function generatePrompt(
  _prev: GeneratePromptResponse,
  formData: FormData
): Promise<GeneratePromptResponse> {
  const parsed = GeneratePromptSchema.safeParse({
    userQuery: formData.get("userQuery"),
    filePaths: formData.getAll("filePath"),
  });

  if (!parsed.success) {
    return {
      files: [],
      userQuery: String(formData.get("userQuery") ?? ""),
      formError: parsed.error.issues[0]?.message ?? "Datos inválidos",
    };
  }

  const files = await readSelectedFiles(parsed.data.filePaths);

  return {
    files,
    userQuery: parsed.data.userQuery,
  };
}

```

---

[config.ts](/home/user/ai-web-app/code-advisor/src/lib/utils/config.ts)

```ts
const TARGET_PROJECT_PATH = process.env.TARGET_PROJECT_PATH;
const GENAI_API_KEY = process.env.GENAI_API_KEY;
const VERTEX_API_KEY = process.env.VERTEX_API_KEY;
const OPEN_ROUTER_API_KEY = process.env.OPEN_ROUTER_API_KEY;
const NVIDIA_NIM_API_KEY = process.env.NVIDIA_NIM_API_KEY;

if (!TARGET_PROJECT_PATH) throw new Error("Se necesita el path del proyecto");

if (
  !GENAI_API_KEY &&
  !VERTEX_API_KEY &&
  !OPEN_ROUTER_API_KEY &&
  !NVIDIA_NIM_API_KEY
) {
  throw new Error(
    "Se necesita al menos una API key de GenAi, Vertex, OpenRouter o NVIDIA NIM"
  );
}

export const config = {
  TARGET_PROJECT_PATH,
  GENAI_API_KEY,
  VERTEX_API_KEY,
  OPEN_ROUTER_API_KEY,
  NVIDIA_NIM_API_KEY,
};

```

---

[parse-markdown.tsx](/home/user/ai-web-app/code-advisor/src/lib/utils/parse-markdown.tsx)

```tsx
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
  variables: Record<string, string | number>
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

```

---

[utils.ts](/home/user/ai-web-app/code-advisor/src/lib/utils.ts)

```ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

```

---

[client.ts](/home/user/ai-web-app/code-advisor/src/services/chat-completion/api/gemini-cli/client.ts)

```ts
import "server-only";
import { writeFileSync, mkdirSync } from "fs";
import { spawn } from "child_process";
import path from "path";
import { Message } from "../../schemas/message.schema";
import { type GeminiModel } from "../genai/default-config";

export type GenerateResponseOptions = {
  systemPrompt: string;
  messages: Message[];
  contextInfo?: string;
  debug?: boolean;
  model?: GeminiModel;
  config?: {
    signal?: AbortSignal;
    temperature?: number;
    topP?: number;
    topK?: number;
  };
};

type ModelResponse = {
  response: string;
  thoughts?: string;
};

export class GeminiCliClient {
  public generateResponse = async (
    args: GenerateResponseOptions
  ): Promise<ModelResponse> => {
    const model = args.model ?? "gemini-2.0-flash";
    const signal = args.config?.signal;

    const storageDir = path.join(process.cwd(), "storage");
    const filePath = path.join(storageDir, "input.md");

    // Construcción del Prompt
    let fullPrompt = `SYSTEM INSTRUCTION:\n${args.systemPrompt}\n\n`;
    if (args.contextInfo) fullPrompt += `CONTEXT:\n${args.contextInfo}\n\n`;

    fullPrompt += "CHAT HISTORY:\n";
    args.messages.forEach((msg) => {
      const role = msg.role === "user" ? "User" : "Model";
      fullPrompt += `${role}: ${msg.content}\n`;
    });

    mkdirSync(storageDir, { recursive: true });
    writeFileSync(filePath, fullPrompt, "utf8");

    return new Promise((resolve, reject) => {
      // Argumentos para el comando gemini
      const child = spawn("gemini", [`@${filePath}`, "--model", model]);

      let stdoutData = "";
      let stderrData = "";

      if (signal) {
        if (signal.aborted) {
          child.kill();
          return reject(new Error("Operación abortada prematuramente"));
        }
        signal.addEventListener("abort", () => {
          child.kill("SIGTERM");
          reject(new Error("Operación abortada por el usuario"));
        });
      }

      child.stdout.on("data", (data) => {
        stdoutData += data.toString();
      });

      child.stderr.on("data", (data) => {
        stderrData += data.toString();
      });

      child.on("close", (code) => {
        if (code !== 0) {
          console.error("Error en Gemini CLI:", stderrData);
          return reject(new Error(`El CLI falló con código ${code}`));
        }

        try {
          const parsedOutput = JSON.parse(stdoutData);
          resolve({
            response: parsedOutput.response,
            thoughts: parsedOutput.thoughts || undefined,
          });
        } catch (err) {
          console.error(err);
          reject(new Error("Error al parsear la salida JSON del CLI"));
        }
      });

      if (args.debug) {
        console.log(
          `Ejecutando comando Gemini CLI para el archivo: ${filePath}`
        );
      }
    });
  };
}

```

---

[index.ts](/home/user/ai-web-app/code-advisor/src/services/chat-completion/api/gemini-cli/index.ts)

```ts
// export { client } from './client';

```

---

[client.ts](/home/user/ai-web-app/code-advisor/src/services/chat-completion/api/genai/client.ts)

```ts
import "server-only";

import {
  GenerateContentConfig,
  GenerateContentResponse,
  GoogleGenAI,
} from "@google/genai";
import z, { ZodObject } from "zod/v4";
import { config } from "@/lib/utils/config";
import { Message } from "../../schemas/message.schema";
import { transformMessages } from "./content-utils";
import { defaultConfig, type GeminiModel } from "./default-config";

export type GenerateResponseOptions = {
  systemPrompt: string;
  messages: Message[];
  contextInfo?: string;
  responseJsonSchema?: ZodObject;
  config?: GenerateContentConfig;
  debug?: boolean;
  model?: GeminiModel;
  account?: "dsr1" | "anon" | "md" | "disoire";
};

type ModelResponse = {
  response: string;
  thoughts?: string;
};

class GenAIClient {
  private _client = new GoogleGenAI({ apiKey: config.GENAI_API_KEY });

  public generateResponse = async (
    args: GenerateResponseOptions
  ): Promise<ModelResponse> => {
    const model = args.model ?? "gemini-flash-latest";
    const client = this._client;
    const contents = transformMessages({
      messages: args.messages,
      contextInfo: args.contextInfo,
    });
    const modelResponse = await client.models.generateContent({
      model,
      contents,
      config: {
        ...defaultConfig,
        ...args.config,
        systemInstruction: args.systemPrompt,
        responseMimeType: args.responseJsonSchema
          ? "application/json"
          : "text/plain",
        responseJsonSchema: args.responseJsonSchema
          ? z.toJSONSchema(args.responseJsonSchema)
          : undefined,
      },
    });
    if (!modelResponse.text) {
      throw new Error(JSON.stringify(modelResponse));
    }
    const result = {
      thoughts: modelResponse.candidates?.[0].content?.parts?.[0].thought
        ? modelResponse.candidates?.[0].content?.parts?.[0].text
        : undefined,
      response: modelResponse.text,
    };
    if (args.debug) {
      console.log("thoughts", result.thoughts ?? "Desactivado");
      console.log("response", result.response);
    }
    return result;
  };

  private async getStreamResult(
    modelResponse: AsyncGenerator<GenerateContentResponse, unknown, unknown>,
    debug: boolean
  ) {
    let response = "";
    let thoughts = "";
    for await (const chunk of modelResponse) {
      if (!chunk.text && chunk.candidates?.[0].content?.parts?.[0].thought) {
        thoughts += chunk.candidates?.[0].content?.parts?.[0].text;
        if (debug)
          process.stdout.write(
            chunk.candidates?.[0].content?.parts?.[0].text ||
              "Razonamiento no encontrado"
          );
        continue;
      }
      if (debug) process.stdout.write(chunk.text || "");
      response += chunk.text || "";
    }
    process.stdout.write("\nFIN DE LA RESPUESTA\n\n");
    return { response, thoughts };
  }

  public generateResponseStream = async (
    args: GenerateResponseOptions
  ): Promise<ModelResponse> => {
    const model = args.model ?? "gemini-flash-latest";
    const client = this._client;
    const contents = transformMessages({
      messages: args.messages,
      contextInfo: args.contextInfo,
    });
    const modelResponse = await client.models.generateContentStream({
      model,
      contents,
      config: {
        ...defaultConfig,
        ...args.config,
        systemInstruction: args.systemPrompt,
        responseMimeType: args.responseJsonSchema
          ? "application/json"
          : "text/plain",
        responseJsonSchema: args.responseJsonSchema
          ? z.toJSONSchema(args.responseJsonSchema)
          : undefined,
      },
    });
    const result = await this.getStreamResult(
      modelResponse,
      args.debug || false
    );
    if (!result) throw new Error("Error al producir una respuesta");
    return { ...result, response: result.response };
  };
}

export const client = new GenAIClient();

```

---

[content-utils.ts](/home/user/ai-web-app/code-advisor/src/services/chat-completion/api/genai/content-utils.ts)

```ts
import { type Content } from '@google/genai';
import { type Message } from '../../schemas/message.schema';
import { obfuscate } from '../../utils/obfuscator';

type TransformMessagesParams = {
  messages: Message[];
  contextInfo?: string;
};

export const transformMessages = ({
  messages,
  contextInfo
}: TransformMessagesParams): Content[] => {
  const contents: Content[] = messages.map((message) => ({
    role: message.role === 'user' ? 'user' : 'model',
    parts: [{ text: obfuscate(message.content) }]
  }));

  if (contextInfo)
    contents.push(
      {
        role: 'model',
        parts: [
          {
            functionCall: {
              name: 'get_context_info',
              args: { location: 'current_location' }
            }
          }
        ]
      },
      {
        role: 'user',
        parts: [
          {
            functionResponse: {
              name: 'get_context_info',
              response: { contextInfo }
            }
          }
        ]
      }
    );
  return contents;
};

```

---

[default-config.ts](/home/user/ai-web-app/code-advisor/src/services/chat-completion/api/genai/default-config.ts)

```ts
import { type GenerateContentConfig, HarmBlockThreshold, HarmCategory } from '@google/genai';
import { z } from 'zod/v4';

export const defaultConfig: GenerateContentConfig = {
  safetySettings: [
    {
      category: HarmCategory.HARM_CATEGORY_CIVIC_INTEGRITY,
      threshold: HarmBlockThreshold.BLOCK_NONE
    },
    {
      category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
      threshold: HarmBlockThreshold.BLOCK_NONE
    },
    {
      category: HarmCategory.HARM_CATEGORY_HARASSMENT,
      threshold: HarmBlockThreshold.BLOCK_NONE
    },
    {
      category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
      threshold: HarmBlockThreshold.BLOCK_NONE
    },
    {
      category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
      threshold: HarmBlockThreshold.BLOCK_NONE
    }
  ],
  temperature: 1,
  topP: 0.95,
  responseModalities: ['text']
};

export const GeminiModelSchema = z.enum([
  'gemini-2.0-flash',
  'gemini-2.5-flash-lite',
  'gemini-2.5-flash',
  'gemini-2.5-pro',
  'gemini-3-flash-lite-preview',
  'gemini-3-flash-preview',
  'gemini-3-pro-preview',
  'gemini-3.1-flash-lite-preview',
  'gemini-3.1-flash-preview',
  'gemini-3.1-pro-preview',
  'gemini-flash-latest'
]);

export type GeminiModel = z.infer<typeof GeminiModelSchema>;

```

---

[index.ts](/home/user/ai-web-app/code-advisor/src/services/chat-completion/api/genai/index.ts)

```ts
export { client } from './client';

```

---

[client.ts](/home/user/ai-web-app/code-advisor/src/services/chat-completion/api/vertex/client.ts)

```ts
import "server-only";

import { config } from "@/lib/utils/config";
import {
  Content,
  GenerateContentConfig,
  GenerateContentResponse,
  GoogleGenAI,
} from "@google/genai";
import z, { ZodObject } from "zod/v4";
import { type Message } from "../../schemas/message.schema";
import { defaultConfig, type GeminiModel } from "../genai/default-config";

const googleGenAi = new GoogleGenAI({
  vertexai: true,
  httpOptions: { apiVersion: "v1" },
  apiKey: config.VERTEX_API_KEY,
});

export type GenerateResponseOptions = {
  systemPrompt: string;
  messages: Message[];
  contextInfo?: string;
  responseJsonSchema?: ZodObject;
  config?: GenerateContentConfig;
  debug?: boolean;
  model?: GeminiModel;
};

type ModelResponse = {
  response: string;
  thoughts?: string;
};

const getContents = (messages: Message[], contextInfo?: string): Content[] => {
  const contents: Content[] = messages.map((message) => ({
    role: message.role === "user" ? "user" : "model",
    parts: [{ text: message.content }],
  }));

  if (contextInfo)
    contents.push(
      {
        role: "model",
        parts: [
          {
            functionCall: {
              name: "get_context_info",
              args: { location: "current_location" },
            },
          },
        ],
      },
      {
        role: "user",
        parts: [
          {
            functionResponse: {
              name: "get_context_info",
              response: { contextInfo },
            },
          },
        ],
      }
    );
  return contents;
};

export class VertexClient {
  private _client = new GoogleGenAI({
    vertexai: true,
    httpOptions: { apiVersion: "v1" },
    apiKey: config.VERTEX_API_KEY,
  });

  public generateResponse = async (
    args: GenerateResponseOptions
  ): Promise<ModelResponse> => {
    const model = args.model ?? "gemini-flash-latest";
    const client = this._client;
    const contents = getContents(args.messages, args.contextInfo);
    const modelResponse = await client.models.generateContent({
      model,
      contents,
      config: {
        ...defaultConfig,
        ...args.config,
        systemInstruction: args.systemPrompt,
        responseMimeType: args.responseJsonSchema
          ? "application/json"
          : "text/plain",
        responseJsonSchema: args.responseJsonSchema
          ? z.toJSONSchema(args.responseJsonSchema)
          : undefined,
      },
    });
    if (!modelResponse.text) {
      throw new Error(JSON.stringify(modelResponse));
    }
    const result = {
      thoughts: modelResponse.candidates?.[0].content?.parts?.[0].thought
        ? modelResponse.candidates?.[0].content?.parts?.[0].text
        : undefined,
      response: modelResponse.text,
    };
    if (args.debug) {
      console.log("thoughts", result.thoughts ?? "Desactivado");
      console.log("response", result.response);
    }
    return result;
  };

  private async getStreamResult(
    modelResponse: AsyncGenerator<GenerateContentResponse, unknown, unknown>,
    debug: boolean
  ) {
    let response = "";
    let thoughts = "";
    for await (const chunk of modelResponse) {
      if (!chunk.text && chunk.candidates?.[0].content?.parts?.[0].thought) {
        thoughts += chunk.candidates?.[0].content?.parts?.[0].text;
        if (debug)
          process.stdout.write(
            chunk.candidates?.[0].content?.parts?.[0].text ||
              "Razonamiento no encontrado"
          );
        continue;
      }
      if (debug) process.stdout.write(chunk.text || "");
      response += chunk.text || "";
    }
    process.stdout.write("\nFIN DE LA RESPUESTA\n\n");
    return { response, thoughts };
  }

  public generateResponseStream = async (
    args: GenerateResponseOptions
  ): Promise<ModelResponse> => {
    const model = args.model ?? "gemini-flash-latest";
    const client = googleGenAi;
    const contents = getContents(args.messages, args.contextInfo);
    const modelResponse = await client.models.generateContentStream({
      model,
      contents,
      config: {
        ...defaultConfig,
        ...args.config,
        systemInstruction: args.systemPrompt,
        responseMimeType: args.responseJsonSchema
          ? "application/json"
          : "text/plain",
        responseJsonSchema: args.responseJsonSchema
          ? z.toJSONSchema(args.responseJsonSchema)
          : undefined,
      },
    });
    const result = await this.getStreamResult(
      modelResponse,
      args.debug || false
    );
    if (!result) throw new Error("Error al producir una respuesta");
    return { ...result, response: result.response };
  };
}

```

---

[index.ts](/home/user/ai-web-app/code-advisor/src/services/chat-completion/api/vertex/index.ts)

```ts
export { client } from './client';

```

---

[chat-completion.service.ts](/home/user/ai-web-app/code-advisor/src/services/chat-completion/chat-completion.service.ts)

```ts
import { GeminiCliClient } from "./api/gemini-cli/client";
import { GeminiModel } from "./api/genai/default-config";

export class ChatCompletionAgent {
  private static _instance: ChatCompletionAgent;

  private _model: GeminiModel = "gemini-3.1-pro-preview";
  private _locked: boolean = false;
  private _client = new GeminiCliClient();

  public get isBusy() {
    return this._locked;
  }

  public get model() {
    return this._model;
  }

  public static async getInstance(): Promise<ChatCompletionAgent> {
    if (!ChatCompletionAgent._instance) {
      ChatCompletionAgent._instance = new ChatCompletionAgent();
    }
    return ChatCompletionAgent._instance;
  }

  public async generateContent(systemPrompt: string, userInput: string) {
    if (this._locked)
      throw new Error(
        "El LLM está ocupado. Esperá a que finalice la tarea actual."
      );

    this._locked = true;
    try {
      const modelResponse = await this._client.generateResponse({
        systemPrompt,
        messages: [{ role: "user", content: userInput }],
        config: {
          // abortSignal: AbortSignal.timeout(120 * 1000),
          // maxOutputTokens: 30000,
          temperature: 1,
        },
        model: this._model,
      });
      return modelResponse;
    } finally {
      this._locked = false;
    }
  }
}

```

---

[index.ts](/home/user/ai-web-app/code-advisor/src/services/chat-completion/index.ts)

```ts

```

---

[chat-history.ts](/home/user/ai-web-app/code-advisor/src/services/chat-completion/models/chat-history.ts)

```ts
import { Message } from '../schemas/message.schema';
import { ChatHistoryBase } from '../types';

export class ChatHistory implements ChatHistoryBase<Message, string> {
  private history: Message[] = [];

  constructor(messages: Message[] = []) {
    this.history = messages;
  }

  public getCopy = () => {
    return new ChatHistory([...this.history]);
  };

  public setMessages = (messages: Message[]) => {
    this.history = messages.map((message) => ({
      role: message.role === 'user' ? 'user' : 'assistant',
      content: message.content
    }));
  };

  public getMessages = () => {
    return this.history;
  };

  public addMessage = (message: Message) => {
    this.history.push(message);
  };

  public addUserMessage = (message: string) => {
    this.history.push({ role: 'user', content: message });
  };

  public addAssistantMessage = (message: string) => {
    this.history.push({ role: 'assistant', content: message });
  };

  public addSystemMessage = (message: string) => {
    this.history.push({ role: 'system', content: message });
  };
}

```

---

[message.schema.ts](/home/user/ai-web-app/code-advisor/src/services/chat-completion/schemas/message.schema.ts)

```ts
import { z } from 'zod/v4';

export const MessageContentSchema = z.object({
  functionCall: z
    .object({
      name: z.string().describe('Name of the function to call'),
      args: z
        .record(z.string(), z.unknown())
        .describe('Arguments for the function'),
    })
    .optional(),
  functionResponse: z
    .object({
      name: z.string().describe('Name of the function to call'),
      response: z.record(z.string(), z.unknown()).describe('Function Response'),
    })
    .optional(),
  text: z.string().optional().describe('Message content'),
});

export const MessageSchema = z
  .object({
    role: z
      .enum(['user', 'assistant', 'system'])
      .describe('Role of the message sender'),
    content: z.string(),
  })
  .required();

export type Message = z.infer<typeof MessageSchema>;
export type MessageContent = z.infer<typeof MessageContentSchema>;

```

---

[types.ts](/home/user/ai-web-app/code-advisor/src/services/chat-completion/types.ts)

```ts
export interface ChatHistoryBase<T, U> {
  getCopy(): ChatHistoryBase<T, U>;

  setMessages(messages: T[]): void;

  getMessages(): T[];

  addMessage(message: T): void;

  addUserMessage(content: U): void;

  addAssistantMessage(content: U): void;

  addSystemMessage(content: string): void;
}

```

---

[chat-agent-state.ts](/home/user/ai-web-app/code-advisor/src/types/chat-agent-state.ts)

```ts

```

---

[file-content.ts](/home/user/ai-web-app/code-advisor/src/types/file-content.ts)

```ts
export interface FileContent {
  path: string;
  content: string;
  sourceCode?: string;
  error?: string;
}

```

---

[form-state.ts](/home/user/ai-web-app/code-advisor/src/types/form-state.ts)

```ts
export type FormState = {
  success: boolean;
  message: string;
  timestamp: number;
  fieldErrors?: Record<string, string[]>;
  data?: unknown;
};

/** Estado inicial de un form action. El campo timestamp se usa para detectar cambios en el estado */
export const EMPTY_FORM_STATE: FormState = {
  success: false,
  message: "",
  fieldErrors: {},
  timestamp: 0,
};

```
</context>
---
Instrucciones
<system_instructions>
Eres un asistente experto en análisis de código fuente. Analiza el código proporcionado y responde de forma clara y concisa.
</system_instructions>

Llevar a cabo la siguiente tarea
<task>
Que podría mejorarse en mi app?
</task>