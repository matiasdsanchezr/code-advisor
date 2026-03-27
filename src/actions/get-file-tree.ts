"use server";

export interface FileTreeNode {
  id: string;
  name: string;
  isFile: boolean;
  filePath?: string;
  children: FileTreeNode[];
}

/**
 * Construye el árbol de directorios en el servidor.
 * Esto evita el bloqueo del hilo principal en el cliente con cientos de archivos.
 */
export async function buildFileTree(
  filePaths: string[],
): Promise<FileTreeNode[]> {
  if (!filePaths || filePaths.length === 0) return [];

  const base = getCommonRootDirectory(filePaths);
  const roots: FileTreeNode[] = [];
  const nodeMap = new Map<string, FileTreeNode>();

  filePaths.forEach((absPath) => {
    const relative = absPath.slice(base.length).replace(/^\//, "");
    const parts = relative.split("/").filter(Boolean);

    let parentNode: FileTreeNode | undefined;

    parts.forEach((part, i) => {
      const isFile = i === parts.length - 1;
      const nodeId = `${base}/${parts.slice(0, i + 1).join("/")}`;

      if (!nodeMap.has(nodeId)) {
        const newNode: FileTreeNode = {
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

  // Ordenar hijos para consistencia visual
  const sortNodes = (nodes: FileTreeNode[]) => {
    nodes.sort((a, b) => {
      if (a.isFile === b.isFile) return a.name.localeCompare(b.name);
      return a.isFile ? 1 : -1;
    });
    nodes.forEach((node) => sortNodes(node.children));
  };

  sortNodes(roots);
  return roots;
}

function getCommonRootDirectory(paths: string[]): string {
  if (!paths.length) return "";
  const segmentedPaths = paths.map((p) => p.split("/"));
  const minLen = Math.min(...segmentedPaths.map((s) => s.length));
  const common: string[] = [];

  for (let i = 0; i < minLen; i++) {
    if (segmentedPaths.every((s) => s[i] === segmentedPaths[0][i])) {
      common.push(segmentedPaths[0][i]);
    } else {
      break;
    }
  }
  return common.join("/");
}

export async function generateTreeStructure(filePaths: string[]) {
  return await buildFileTree(filePaths);
}
