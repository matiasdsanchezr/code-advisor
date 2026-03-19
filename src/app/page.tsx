import { getFilePaths } from "@/services/file-service";
import { ChatShell } from "./_components/chat-shell";

export default async function Home() {
  const filePaths = await getFilePaths();

  return (
    <div className="min-h-dvh font-sans">
      <header className="flex flex-col items-center gap-1 py-6 px-4 border-b border-border">
        <div className="flex items-center gap-3">
          <span className="icon-[fa6-solid--magnifying-glass-code] text-3xl md:text-5xl text-primary" />
          <h1 className="text-2xl md:text-4xl font-semibold tracking-tight">
            Analizador de Codigo Fuente
          </h1>
        </div>
        <p className="text-sm md:text-base text-muted-foreground tracking-wide">
          Analizá y mejorá tu código fuente con IA
        </p>
      </header>
      <ChatShell filePaths={filePaths} />
    </div>
  );
}
