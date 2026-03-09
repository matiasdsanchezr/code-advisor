import { loadFiles } from "@/lib/actions/get-files";
import { ChatShell } from "./_components/chat-shell";

export default async function Home() {
  const filePaths = await loadFiles();

  return (
    <div className="min-h-dvh bg-zinc-50 font-sans dark:bg-black">
      <h1 className="text-xl md:text-4xl text-center p-3 uppercase font-semibold tracking-wider">
        Analizador de codigo fuente
      </h1>
      <ChatShell filePaths={filePaths} />
    </div>
  );
}
