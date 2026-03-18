export interface FileNode {
  name: string;
  path: string;
  type: "file" | "folder";
  extension: string;
  size: number;
  modified: number;
  children: FileNode[] | null;
}

export interface FileTree {
  root: string;
  tree: FileNode;   // single root node; display its .children
}

export interface EditorTab {
  id: string;
  path: string;
  filename: string;
  language: string;
  content: string;
  isDirty: boolean;
}
