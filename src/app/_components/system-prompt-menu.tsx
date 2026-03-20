"use client";

import { loadPrompt } from "@/actions/prompt";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useChatStore } from "@/stores/chat-store";
import { useState, useTransition } from "react";

interface Props {
  disabled?: boolean;
  availablePrompts: string[];
}

export const SystemPromptMenu = ({ disabled, availablePrompts }: Props) => {
  const { systemPrompt, setSystemPrompt, resetSystemPrompt } = useChatStore();
  const [draft, setDraft] = useState(systemPrompt);
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleSelectTemplate = (promptId: string) => {
    startTransition(async () => {
      const content = await loadPrompt(promptId);
      setDraft(content);
    });
  };

  const handleSave = () => {
    setSystemPrompt(draft);
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger
        render={
          <Button variant="outline" size="sm" disabled={disabled || isPending}>
            <span className="icon-[fa7-solid--sliders] mr-2" />
            Configurar Agente
          </Button>
        }
      />
      <DialogContent className="sm:max-w-5xl">
        <DialogHeader>
          <DialogTitle>Comportamiento del Sistema</DialogTitle>
          <DialogDescription>
            Selecciona una plantilla o escribe instrucciones personalizadas.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label>Plantillas</Label>
            <div className="flex flex-wrap gap-2">
              {availablePrompts.map((p) => (
                <Button
                  key={p}
                  variant="secondary"
                  size="xs"
                  onClick={() => handleSelectTemplate(p)}
                >
                  {p.replace(".md", "")}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="prompt">Instrucciones</Label>
            <Textarea
              id="prompt"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              className="font-mono text-xs h-[calc(100vh-20rem)]"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => resetSystemPrompt()}>
            Restaurar
          </Button>
          <Button onClick={handleSave}>Aplicar Cambios</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
