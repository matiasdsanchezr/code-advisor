"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { InferenceProvider } from "@/services/inference/schemas/provider-schema";

interface StreamingChatOptions {
  onReasoningChunk: (chunk: string) => void;
  onChunk: (accumulated: string) => void;
  onDone?: () => void;
  onError?: (error: string) => void;
}

export interface ChatCompletionPayload {
  input: string;
  instruction: string;
  provider: InferenceProvider; // Tipado estricto
  model: string;
  imageUrls: string;
}

interface StreamingState {
  isStreaming: boolean;
  error: string | null;
}

export function useStreamingChat({
  onReasoningChunk,
  onChunk,
  onDone,
  onError,
}: StreamingChatOptions) {
  const [state, setState] = useState<StreamingState>({
    isStreaming: false,
    error: null,
  });

  const callbacks = useRef({ onReasoningChunk, onChunk, onDone, onError });

  useEffect(() => {
    callbacks.current = { onReasoningChunk, onChunk, onDone, onError };
  }, [onReasoningChunk, onChunk, onDone, onError]);

  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => abortControllerRef.current?.abort();
  }, []);

  const abort = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setState((prev) => ({ ...prev, isStreaming: false }));
    }
  }, []);

  const start = useCallback(async (payload: ChatCompletionPayload) => {
    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setState({ isStreaming: true, error: null });

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || `Error servidor: ${response.status}`,
        );
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("La respuesta no tiene un stream legible.");

      const decoder = new TextDecoder();
      let accumulatedReasoning = "";
      let accumulatedText = "";
      let buffer = "";

      function processLine(line: string) {
        if (!line.startsWith("data: ") && !line.startsWith("reasoning: "))
          return;

        if (line.startsWith("reasoning: ")) {
          const rawData = line.slice(11);

          try {
            const content = JSON.parse(rawData);
            accumulatedReasoning += content;
            callbacks.current.onReasoningChunk(accumulatedReasoning);
          } catch {
            accumulatedReasoning += rawData;
            callbacks.current.onReasoningChunk(accumulatedReasoning);
          }
        } else if (line.startsWith("data: ")) {
          const rawData = line.slice(6);
          if (rawData.trim() === "[DONE]") return;

          try {
            const content = JSON.parse(rawData);
            accumulatedText += content;
            callbacks.current.onChunk(accumulatedText);
          } catch {
            accumulatedText += rawData;
            callbacks.current.onChunk(accumulatedText);
          }
        }
      }

      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          const trimmedBuffer = buffer.trim();
          if (trimmedBuffer) {
            processLine(trimmedBuffer);
          }
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          processLine(line);
        }
      }
    } catch (err: unknown) {
      // Ignorar si el error fue provocado por el usuario al abortar
      if (err instanceof Error && err.name === "AbortError") return;

      const errorMessage =
        err instanceof Error ? err.message : "Error inesperado en el stream";
      setState({ isStreaming: false, error: errorMessage });
      callbacks.current.onError?.(errorMessage);
    } finally {
      // Solo actualizamos si no ha sido abortado por una nueva petición
      if (!controller.signal.aborted) {
        setState((prev) => ({ ...prev, isStreaming: false }));
      }
    }
  }, []);

  return {
    start,
    abort,
    isStreaming: state.isStreaming,
    error: state.error,
  };
}
