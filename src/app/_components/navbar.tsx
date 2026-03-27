"use client";

import {
  InferenceProvider,
  InferenceProviderEnum,
} from "@/services/inference/schemas/provider-schema";
import { useChatStore } from "@/stores/chat-store";
import { useShallow } from "zustand/shallow";
import { NavSelector } from "./nav-selector";
import {
  getModelsForProvider,
  InferenceModel,
} from "@/services/inference/types/inference-model";
import { formatProviderName } from "@/services/inference/utils/model-formatter";
// import { NavSelector } from "./nav-selector";

export const Navbar = () => {
  const { config, setConfig } = useChatStore(
    useShallow((s) => ({
      config: s.config,
      setConfig: s.setConfig,
    })),
  );

  const statusLabel = "Disponible";
  const availableModels = getModelsForProvider(config.provider);
  const modelOptions = availableModels.map((m) => ({ label: m, value: m }));
  const providerOptions = InferenceProviderEnum.options.map((p) => ({
    label: formatProviderName(p),
    value: p,
  }));

  const handleProviderChange = (newProvider: string) => {
    const p = newProvider as InferenceProvider;
    const firstModel = getModelsForProvider(p)[0];
    setConfig({ provider: p, model: firstModel } as InferenceModel);
  };

  return (
    <header className="border-b border-zinc-200 bg-white/80 backdrop-blur supports-backdrop-filter:bg-white/70 dark:border-zinc-800 dark:bg-zinc-950/80">
      <div className="mx-auto flex min-h-16 w-full max-w-7xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-zinc-900 text-zinc-100 dark:bg-zinc-100 dark:text-zinc-900">
            <span className="icon-[mingcute--chat-4-ai-line] size-5"></span>
          </div>

          <div className="min-w-0">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-zinc-900 dark:text-zinc-100">
              Code Advisor
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Análisis de código inteligente
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
          {/* Status Indicator */}
          <div
            role="status"
            className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-zinc-100 px-3 py-1.5 text-xs font-medium text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
          >
            <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>{statusLabel}</span>
          </div>

          {/* Selector de Proveedor */}
          <NavSelector
            label="Proveedor"
            value={config.provider}
            options={providerOptions}
            onChange={handleProviderChange}
          />

          <NavSelector
            label="Modelo"
            value={config.model}
            options={modelOptions}
            onChange={(val) =>
              setConfig({ ...config, model: val } as InferenceModel)
            }
          />
        </div>
      </div>
    </header>
  );
};
