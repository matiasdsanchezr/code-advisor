import { getFilePaths } from "@/services/file-service";
import { loadPrompts } from "@/actions/prompt";
import { ChatShell } from "./_components/chat-shell";
import { Suspense } from "react";

async function ChatDataWrapper() {
  const [filePaths, systemPrompts] = await Promise.all([
    getFilePaths(),
    loadPrompts(),
  ]);

  return <ChatShell filePaths={filePaths} initialPrompts={systemPrompts} />;
}

export default function Home() {
  return (
    <div className="min-h-dvh font-sans bg-background">
      <header className="flex flex-col items-center gap-1 py-10 px-4 border-b bg-muted/20">
        <div className="flex items-center gap-3">
          <span className="icon-[fa6-solid--magnifying-glass-code] text-4xl md:text-6xl text-primary" />
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight bg-linear-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Code Advisor
          </h1>
        </div>
        <p className="text-sm md:text-lg text-muted-foreground max-w-2xl text-center">
          Analiza grafos de dependencias y optimiza tu código con IA
        </p>
      </header>

      <main className="container mx-auto max-w-550">
        <Suspense
          fallback={
            <div className="flex flex-col items-center justify-center p-20 gap-4 text-muted-foreground">
              <span className="icon-[fa6-solid--spinner] text-4xl animate-spin" />
              <p className="animate-pulse">Preparando entorno de análisis...</p>
            </div>
          }
        >
          <ChatDataWrapper />
        </Suspense>
      </main>
    </div>
  );
}
