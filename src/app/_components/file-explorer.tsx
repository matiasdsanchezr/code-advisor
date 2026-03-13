"use client";

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
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
  File,
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

function getCommonBase(paths: string[]): string {
  if (!paths.length) return "";
  const split = paths.map((p) => p.split("/"));
  const minLen = Math.min(...split.map((s) => s.length));
  const common: string[] = [];
  for (let i = 0; i < minLen; i++) {
    if (split.every((s) => s[i] === split[0][i])) common.push(split[0][i]);
    else break;
  }
  return common.join("/");
}

function buildTree(filePaths: string[]): {
  roots: TreeNode[];
  folderToFiles: Map<string, string[]>;
  fileIdToPath: Map<string, string>;
} {
  const base = getCommonBase(filePaths);
  const roots: TreeNode[] = [];
  const nodeMap = new Map<string, TreeNode>();
  const fileIdToPath = new Map<string, string>();

  for (const absPath of filePaths) {
    const relative = absPath.slice(base.length).replace(/^\//, "");
    const parts = relative.split("/").filter(Boolean);
    let parentNode: TreeNode | undefined = undefined;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isFile = i === parts.length - 1;
      const pathSegments = parts.slice(0, i + 1);
      const nodeId = `${base}/${pathSegments.join("/")}`;

      if (!nodeMap.has(nodeId)) {
        const newNode: TreeNode = {
          id: nodeId,
          name: part,
          isFile,
          children: [],
          filePath: isFile ? absPath : undefined,
        };
        nodeMap.set(nodeId, newNode);
        if (isFile) {
          fileIdToPath.set(nodeId, absPath);
        }

        if (parentNode) {
          parentNode.children.push(newNode);
        } else {
          if (i === 0) {
            roots.push(newNode);
          }
        }
      }

      parentNode = nodeMap.get(nodeId);
    }
  }

  const folderToFiles = new Map<string, string[]>();
  function collectFiles(node: TreeNode): string[] {
    if (node.isFile) return node.filePath ? [node.filePath] : [];
    const files = node.children.flatMap(collectFiles);
    folderToFiles.set(node.id, files);
    return files;
  }
  roots.forEach(collectFiles);

  return { roots, folderToFiles, fileIdToPath };
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
  const ref = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (ref.current) {
      const input = ref.current.querySelector("input");
      if (input) {
        input.indeterminate = indeterminate && !checked;
      }
    }
  }, [indeterminate, checked]);

  return (
    <Checkbox
      ref={ref}
      checked={indeterminate ? false : checked}
      indeterminate={indeterminate}
      onCheckedChange={(val) => onCheckedChange(!!val)}
      className={cn("shrink-0 h-5 w-5 md:h-4 md:w-4", className)}
      onClick={(e) => e.stopPropagation()}
      disabled={disabled}
    />
  );
}

function TreeNodeRow({
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
        checked: selectedSet.has(node.filePath!),
        indeterminate: false,
      };
    }
    const files = folderToFiles.get(node.id) ?? [];
    if (!files.length) return { checked: false, indeterminate: false };
    const selectedCount = files.filter((f) => selectedSet.has(f)).length;
    return {
      checked: selectedCount === files.length,
      indeterminate: selectedCount > 0 && selectedCount < files.length,
    };
  }, [node, selectedSet, folderToFiles]);

  const hasChildren = !node.isFile && node.children.length > 0;

  const handleClickOpen = useCallback(
    (e: React.MouseEvent<HTMLLIElement, MouseEvent>) => {
      if (hasChildren && e.currentTarget === e.target) {
        e.stopPropagation();
        setOpen((o) => !o);
      }
    },
    [hasChildren]
  );

  return (
    <li onClick={handleClickOpen} className="select-none">
      <div
        className={cn(
          "flex items-center gap-2 px-2 py-3 md:py-1.5 rounded-lg md:rounded-md cursor-pointer",
          "hover:bg-black/10 transition-colors group",
          "text-sm md:text-xs"
        )}
        style={{ paddingLeft: `${Math.min(depth * 12 + 8, 200)}px` }}
      >
        {/* Expand/collapse arrow */}
        {!node.isFile ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setOpen((o) => !o);
            }}
            className="p-1 -m-1 rounded hover:bg-muted touch-manipulation"
            aria-label={open ? "Colapsar carpeta" : "Expandir carpeta"}
          >
            <ChevronRight
              className={cn(
                "h-4 w-4 text-muted-foreground shrink-0 transition-transform duration-200",
                open && "rotate-90"
              )}
            />
          </button>
        ) : (
          <span className="w-6 md:w-4 shrink-0" />
        )}

        {/* Icon */}
        {node.isFile ? (
          <FileCode className="h-4 w-4 opacity-50 shrink-0" />
        ) : open ? (
          <FolderOpen className="h-4 w-4 shrink-0 text-yellow-500" />
        ) : (
          <Folder className="h-4 w-4 shrink-0 text-yellow-600" />
        )}

        <span
          className={cn(
            "truncate flex-1",
            node.isFile ? "text-muted-foreground" : "font-medium"
          )}
        >
          {node.name}
        </span>

        <IndeterminateCheckbox
          checked={checked}
          indeterminate={indeterminate}
          onCheckedChange={() => onToggle(node)}
          disabled={disabled}
        />
      </div>

      {hasChildren && open && (
        <ul className="space-y-0.5">
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
}

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

      const affected: string[] = node.isFile
        ? node.filePath
          ? [node.filePath]
          : []
        : folderToFiles.get(node.id) ?? [];

      if (!affected.length) return;

      const next = new Set(selectedFiles);
      const allSelected = affected.every((f) => next.has(f));
      affected.forEach((f) => (allSelected ? next.delete(f) : next.add(f)));
      setSelectedFiles([...next]);
    },
    [disabled, folderToFiles, selectedFiles, setSelectedFiles]
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
        <button
          onClick={() => setActiveTab("tree")}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-colors",
            activeTab === "tree"
              ? "bg-background shadow-sm"
              : "text-muted-foreground"
          )}
        >
          <span className="icon-[fa7-solid--sitemap] h-4 w-4"></span>
          Estructura
          <Badge variant="secondary" className="ml-1">
            {filePaths.length}
          </Badge>
        </button>
        <button
          onClick={() => setActiveTab("selected")}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-colors",
            activeTab === "selected"
              ? "bg-background shadow-sm"
              : "text-muted-foreground"
          )}
        >
          <SquareCheck className="h-4 w-4" />
          Seleccionados
          <Badge className="ml-1">{selectedFiles.length}</Badge>
        </button>
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
          <ScrollArea className="flex-1 p-2 overflow-scroll">
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

          <ScrollArea className="flex-1 p-3 overflow-scroll">
            {selectedFiles.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 gap-3 text-muted-foreground">
                <span className="icon-[fa7-solid--arrow-pointer] h-8 w-8 opacity-50"></span>
                <p className="text-sm text-center px-4">
                  Selecciona archivos o carpetas del árbol para comenzar
                </p>
              </div>
            ) : (
              <ul className="space-y-2">
                {[...selectedFiles].sort().map((file) => (
                  <li
                    key={file}
                    className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors group"
                  >
                    <File className="h-4 w-4 text-primary shrink-0" />
                    <span className="text-xs font-mono truncate flex-1 break-all">
                      {file}
                    </span>
                    <button
                      onClick={() => {
                        const next = new Set(selectedFiles);
                        next.delete(file);
                        setSelectedFiles([...next]);
                      }}
                      disabled={disabled}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:bg-destructive/10 rounded transition-all"
                      aria-label="Deseleccionar archivo"
                    >
                      <span className="icon-[fa7-solid--xmark] text-destructive" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}
