"use client";

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
import { useState } from "react";

export const SystemPromptDialog = ({ disabled }: { disabled?: boolean }) => {
  const systemPrompt = useChatStore((state) => state.systemPrompt);
  const setSystemPrompt = useChatStore((state) => state.setSystemPrompt);
  const resetSystemPrompt = useChatStore((state) => state.resetSystemPrompt);

  const [systemPromptDraft, setSystemPromptDraft] = useState(systemPrompt);
  const [isSystemPromptOpen, setIsSystemPromptOpen] = useState(false);

  const handleOpenSystemPrompt = (open: boolean) => {
    if (open) setSystemPromptDraft(systemPrompt);
    setIsSystemPromptOpen(open);
  };

  const handleSaveSystemPrompt = () => {
    setSystemPrompt(systemPromptDraft);
    setIsSystemPromptOpen(false);
  };

  const handleResetSystemPrompt = () => {
    resetSystemPrompt();
    setSystemPromptDraft(useChatStore.getState().systemPrompt);
  };

  return (
    <Dialog open={isSystemPromptOpen} onOpenChange={handleOpenSystemPrompt}>
      <DialogTrigger
        render={
          <Button variant="outline" size="sm" disabled={disabled}>
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
          <Button variant="ghost" onClick={() => setIsSystemPromptOpen(false)}>
            Cancelar
          </Button>
          <Button variant="outline" onClick={handleResetSystemPrompt}>
            Restaurar predeterminado
          </Button>
          <Button onClick={handleSaveSystemPrompt}>Guardar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
