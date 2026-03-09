import { FileContent } from "@/types/file-content"

export const FileContentCard = ({fileContents} : {fileContents: FileContent[]} ) =>{
    return (<div className="flex flex-col gap-6">
        {fileContents.map(({ path, content, error }) => (
          <div
            key={path}
            className="rounded-lg border border-zinc-700 overflow-hidden"
          >
            <div className="flex items-center gap-2 bg-zinc-800 px-4 py-2">
              <span className="icon-[fa7-solid--file-code] text-zinc-400" />
              <span className="font-mono text-sm text-zinc-300 truncate">
                {path}
              </span>
            </div>
            {error ? (
              <p className="p-4 text-sm text-red-400">{error}</p>
            ) : (
              <pre className="overflow-auto p-4 text-xs leading-relaxed text-zinc-100 bg-zinc-950">
                <code>{content}</code>
              </pre>
            )}
          </div>
        ))}
      </div>)
}