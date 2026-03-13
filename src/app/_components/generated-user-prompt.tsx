"use client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Textarea } from "@/components/ui/textarea";
import { useChatStore } from "@/stores/chat-store";
import { buildPrompt } from "@/utils/build-prompt";
import { Check, ChevronDown, Copy, FileCode2 } from "lucide-react";
import { useState } from "react";

export const GeneratedUserPrompt = () => {
  const systemPrompt = useChatStore((state) => state.systemPrompt);
  const userQuery = useChatStore((state) => state.userQuery);
  const fileContents = useChatStore((state) => state.fileContents);

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
          className="font-mono text-xs resize-y min-h-64 max-h-125 bg-background"
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
