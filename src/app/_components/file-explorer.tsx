"use client";

import { useState, useMemo, useCallback, memo } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import {
  ChevronRight,
  Folder,
  FolderOpen,
  FileCode,
  SquareCheck,
  Trash2,
} from "lucide-react";
import { useChatStore } from "@/stores/chat-store";

interface FileExplorerProps {
  filePaths: string[];
  disabled?: boolean;
}

interface TreeNode {
  id: string;
  name: string;
  isFile: boolean;
  children: TreeNode[];
  filePath?: string;
}

function getCommonRootDirectory(paths: string[]): string {
  if (!paths.length) return "";
  const segmentedPaths = paths.map((p) => p.split("/"));
  const minLen = Math.min(...segmentedPaths.map((s) => s.length));
  const common: string[] = [];
  for (let i = 0; i < minLen; i++) {
    if (segmentedPaths.every((s) => s[i] === segmentedPaths[0][i]))
      common.push(segmentedPaths[0][i]);
    else break;
  }
  return common.join("/");
}

function buildTree(filePaths: string[]): {
  roots: TreeNode[];
  folderToFiles: Map<string, string[]>;
} {
  const base = getCommonRootDirectory(filePaths);
  const roots: TreeNode[] = [];
  const nodeMap = new Map<string, TreeNode>();

  filePaths.forEach((absPath) => {
    const relative = absPath.slice(base.length).replace(/^\//, "");
    const parts = relative.split("/").filter(Boolean);
    let parentNode: TreeNode | undefined;

    parts.forEach((part, i) => {
      const isFile = i === parts.length - 1;
      const nodeId = `${base}/${parts.slice(0, i + 1).join("/")}`;

      if (!nodeMap.has(nodeId)) {
        const newNode: TreeNode = {
          id: nodeId,
          name: part,
          isFile,
          children: [],
          filePath: isFile ? absPath : undefined,
        };
        nodeMap.set(nodeId, newNode);

        if (parentNode) {
          parentNode.children.push(newNode);
        } else if (i === 0) {
          roots.push(newNode);
        }
      }
      parentNode = nodeMap.get(nodeId);
    });
  });

  const folderToFiles = new Map<string, string[]>();
  const collectFiles = (node: TreeNode): string[] => {
    const files = node.isFile
      ? node.filePath
        ? [node.filePath]
        : []
      : node.children.flatMap(collectFiles);

    if (!node.isFile) folderToFiles.set(node.id, files);
    return files;
  };

  roots.forEach(collectFiles);
  return { roots, folderToFiles };
}

function IndeterminateCheckbox({
  checked,
  indeterminate,
  onCheckedChange,
  className,
  disabled,
}: {
  checked: boolean;
  indeterminate: boolean;
  onCheckedChange: (checked: boolean) => void;
  className?: string;
  disabled?: boolean;
}) {
  return (
    <Checkbox
      checked={indeterminate ? false : checked}
      indeterminate={indeterminate}
      onCheckedChange={(val) => onCheckedChange(!!val)}
      className={cn("shrink-0 h-5 w-5 md:h-4 md:w-4", className)}
      onClick={(e) => e.stopPropagation()}
      disabled={disabled}
    />
  );
}

const NodeIcon = ({ isFile, isOpen }: { isFile: boolean; isOpen: boolean }) => {
  if (isFile) return <FileCode className="h-4 w-4 opacity-50 shrink-0" />;
  return isOpen ? (
    <FolderOpen className="h-4 w-4 shrink-0 text-yellow-500" />
  ) : (
    <Folder className="h-4 w-4 shrink-0 text-yellow-600" />
  );
};

const TreeNodeRow = memo(function TreeNodeRow({
  node,
  depth,
  selectedSet,
  folderToFiles,
  onToggle,
  disabled,
}: {
  node: TreeNode;
  depth: number;
  selectedSet: Set<string>;
  folderToFiles: Map<string, string[]>;
  onToggle: (node: TreeNode) => void;
  disabled: boolean;
}) {
  const [open, setOpen] = useState(false);

  const { checked, indeterminate } = useMemo(() => {
    if (node.isFile) {
      return {
        checked: selectedSet.has(node.filePath ?? ""),
        indeterminate: false,
      };
    }
    const files = folderToFiles.get(node.id) ?? [];
    if (files.length === 0) return { checked: false, indeterminate: false };

    let selectedCount = 0;
    for (const f of files) {
      if (selectedSet.has(f)) selectedCount++;
    }

    return {
      checked: selectedCount === files.length,
      indeterminate: selectedCount > 0 && selectedCount < files.length,
    };
  }, [node.id, node.isFile, node.filePath, selectedSet, folderToFiles]);

  const toggleOpen = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!node.isFile) setOpen(!open);
    else onToggle(node);
  };

  return (
    <li className="select-none">
      <div className="hover:bg-black/10 dark:hover:bg-muted relative">
        <div
          onClick={toggleOpen}
          className={cn(
            "flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer",
            "transition-colors group text-xs"
          )}
          style={{ paddingLeft: `${depth * 12 + 8}px` }}
        >
          <div className="w-4 h-4 flex items-center justify-center">
            {!node.isFile && (
              <ChevronRight
                className={cn(
                  "h-3 w-3 transition-transform",
                  open && "rotate-90"
                )}
              />
            )}
          </div>

          <NodeIcon isFile={node.isFile} isOpen={open} />
          <span
            className={cn(
              "truncate flex-1",
              node.isFile ? "text-muted-foreground" : "font-medium"
            )}
          >
            {node.name}
          </span>
        </div>
        <IndeterminateCheckbox
          checked={checked}
          indeterminate={indeterminate}
          onCheckedChange={() => onToggle(node)}
          disabled={disabled}
          className="absolute top-1/2 -translate-y-1/2 right-5 -translate-x-1/2"
        />
      </div>

      {open && node.children.length > 0 && (
        <ul className="mt-0.5 border-l border-border/40 ml-4">
          {node.children.map((child) => (
            <TreeNodeRow
              key={child.id}
              node={child}
              depth={depth + 1}
              selectedSet={selectedSet}
              folderToFiles={folderToFiles}
              onToggle={onToggle}
              disabled={disabled}
            />
          ))}
        </ul>
      )}
    </li>
  );
});

export function FileExplorer({
  filePaths,
  disabled = false,
}: FileExplorerProps) {
  const selectedFiles = useChatStore((state) => state.selectedFiles);
  const setSelectedFiles = useChatStore((state) => state.setSelectedFiles);
  const [activeTab, setActiveTab] = useState<"tree" | "selected">("tree");

  const { roots, folderToFiles } = useMemo(
    () => buildTree(filePaths),
    [filePaths]
  );

  const selectedSet = useMemo(() => new Set(selectedFiles), [selectedFiles]);

  const handleToggle = useCallback(
    (node: TreeNode) => {
      if (disabled) return;

      const targetFiles = node.isFile
        ? node.filePath
          ? [node.filePath]
          : []
        : folderToFiles.get(node.id) ?? [];

      if (!targetFiles.length) return;

      const currentSelected = useChatStore.getState().selectedFiles;
      const updatedSelection = new Set(currentSelected);
      const allSelected = targetFiles.every((f) => updatedSelection.has(f));

      targetFiles.forEach((f) =>
        allSelected ? updatedSelection.delete(f) : updatedSelection.add(f)
      );

      setSelectedFiles(Array.from(updatedSelection));
    },
    [disabled, folderToFiles, setSelectedFiles]
  );

  const handleClearSelection = () => {
    if (disabled) return;
    if (window.confirm("¿Estás seguro de limpiar toda la selección?")) {
      setSelectedFiles([]);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Vista móvil: Tabs */}
      <div className="flex md:hidden bg-muted rounded-lg p-1 gap-1">
        <Button
          onClick={() => setActiveTab("tree")}
          variant="outline"
          className={`${
            activeTab !== "tree" ? "text-muted-foreground" : ""
          } flex-1`}
        >
          <span className="icon-[fa7-solid--sitemap] h-4 w-4"></span>
          Estructura
          <Badge variant="secondary" className="ml-1">
            {filePaths.length}
          </Badge>
        </Button>
        <Button
          onClick={() => setActiveTab("selected")}
          variant="outline"
          className={`${
            activeTab !== "selected" ? "text-muted-foreground" : ""
          } flex-1`}
        >
          <SquareCheck className="h-4 w-4" />
          Seleccionados
          <Badge variant="secondary" className="ml-1">
            {selectedFiles.length}
          </Badge>
        </Button>
      </div>

      {/* Contenedor principal */}
      <div className="flex flex-col md:flex-row gap-3 min-h-75 md:min-h-0 md:h-125 border rounded-xl overflow-hidden bg-card">
        {/* Panel del árbol */}
        <div
          className={cn(
            "flex-col flex-1 md:w-1/2 lg:w-2/5 border-b md:border-b-0 md:border-r",
            activeTab === "tree" ? "flex" : "hidden md:flex"
          )}
        >
          <div className="px-3 py-2.5 md:py-2 border-b flex items-center justify-between bg-muted/30">
            <span className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <span className="icon-[fa7-solid--sitemap] h-4 w-4"></span>
              Estructura
            </span>
            <Badge variant="secondary" className="hidden sm:inline-flex">
              {filePaths.length} archivos
            </Badge>
          </div>
          <ScrollArea className="flex-1 p-2 min-h-0">
            <ul className="space-y-0.5">
              {roots.map((node) => (
                <TreeNodeRow
                  key={node.id}
                  node={node}
                  depth={0}
                  selectedSet={selectedSet}
                  folderToFiles={folderToFiles}
                  onToggle={handleToggle}
                  disabled={disabled}
                />
              ))}
            </ul>
          </ScrollArea>
        </div>

        {/* Panel de seleccionados */}
        <div
          className={cn(
            "flex-col flex-1 md:w-1/2 lg:w-3/5",
            activeTab === "selected" ? "flex" : "hidden md:flex"
          )}
        >
          <div className="px-3 py-2.5 md:py-2 border-b flex items-center justify-between bg-muted/30">
            <span className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <SquareCheck className="h-4 w-4" />
              Seleccionados
            </span>
            <div className="flex items-center gap-2">
              <Badge>{selectedFiles.length}</Badge>
              {selectedFiles.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 md:h-6 md:w-auto md:px-2"
                  onClick={handleClearSelection}
                  disabled={disabled}
                  title="Limpiar selección"
                >
                  <Trash2 className="h-4 w-4 md:mr-1" />
                  <span className="hidden md:inline text-xs">Limpiar</span>
                </Button>
              )}
            </div>
          </div>

          <ScrollArea className="flex-1 p-3 min-h-0">
            {selectedFiles.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 gap-3 text-muted-foreground">
                <span className="icon-[fa7-solid--arrow-pointer] h-8 w-8 opacity-50"></span>
                <p className="text-sm text-center px-4">
                  Selecciona archivos o carpetas del árbol para comenzar
                </p>
              </div>
            ) : (
              <ul className="space-y-1.5">
                {[...selectedFiles].sort().map((file) => {
                  const parts = file.split("/");
                  const fileName = parts.pop();
                  const folderPath = parts.join("/");

                  return (
                    <li
                      key={file}
                      className="flex flex-col gap-0.5 p-2 rounded-md border bg-card hover:shadow-sm transition-all group relative overflow-hidden"
                    >
                      <div className="flex items-center gap-2">
                        <FileCode className="h-3.5 w-3.5 text-primary shrink-0" />
                        <span className="text-[13px] font-medium truncate flex-1">
                          {fileName}
                        </span>
                        <button
                          onClick={() => {
                            const next = new Set(selectedFiles);
                            next.delete(file);
                            setSelectedFiles([...next]);
                          }}
                          disabled={disabled}
                          className="p-1 hover:bg-destructive/10 rounded-md transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5 text-destructive/70 hover:text-destructive" />
                        </button>
                      </div>
                      {folderPath && (
                        <span className="text-[10px] text-muted-foreground font-mono truncate pl-5">
                          {folderPath}/
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}
