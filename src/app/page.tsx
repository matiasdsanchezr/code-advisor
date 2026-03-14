import { getFilePaths } from "@/services/file-service";
import { ChatShell } from "./_components/chat-shell";

export default async function Home() {
  const filePaths = await getFilePaths();

  return (
    <div className="min-h-dvh font-sans">
      <h1 className="text-xl md:text-4xl text-center p-3 uppercase font-semibold tracking-wider">
        Analizador de codigo fuente
      </h1>
      <ChatShell filePaths={filePaths} />
    </div>
  );
}
