import { FileCode, LoaderCircle } from "lucide-react";

type NavbarProps = {
  chatAgentInfo: { isBusy: boolean; model: string; provider: string };
};

export const Navbar = ({ chatAgentInfo }: NavbarProps) => {
  const statusLabel = chatAgentInfo.isBusy ? "Procesando" : "Disponible";

  return (
    <header className="border-b border-zinc-200 bg-white/80 backdrop-blur supports-backdrop-filter:bg-white/70 dark:border-zinc-800 dark:bg-zinc-950/80">
      <div className="mx-auto flex min-h-16 w-full max-w-7xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-zinc-900 text-zinc-100 dark:bg-zinc-100 dark:text-zinc-900">
            <FileCode className="size-5" />
          </div>

          <div className="min-w-0">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-zinc-900 dark:text-zinc-100">
              Code Advisor
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Estado del agente y configuración actual
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
          <div
            role="status"
            aria-live="polite"
            className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-zinc-100 px-3 py-1.5 text-xs font-medium text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
          >
            {chatAgentInfo.isBusy ? (
              <LoaderCircle
                className="size-4 animate-spin text-amber-500"
                aria-hidden="true"
              />
            ) : (
              <span
                className="size-2 rounded-full bg-emerald-500"
                aria-hidden="true"
              />
            )}
            <span>{statusLabel}</span>
          </div>

          <div className="inline-flex items-center gap-1 rounded-full border border-zinc-200 bg-zinc-100 px-3 py-1.5 text-xs text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
            <span className="text-zinc-500 dark:text-zinc-400">Proveedor:</span>
            <span className="font-medium text-zinc-900 dark:text-zinc-100">
              {chatAgentInfo.provider}
            </span>
          </div>

          <div className="inline-flex max-w-full items-center gap-1 rounded-full border border-zinc-200 bg-zinc-100 px-3 py-1.5 text-xs text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
            <span className="text-zinc-500 dark:text-zinc-400">Modelo:</span>
            <span className="max-w-[220px] truncate font-medium text-zinc-900 dark:text-zinc-100 sm:max-w-none">
              {chatAgentInfo.model}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};
