"use client";

import { useState, useCallback } from "react";
import { FileNode, FileTree } from "@/types/filesystem";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export function useFileSystem() {
  const [tree, setTree] = useState<FileNode[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTree = useCallback(async (root?: string) => {
    setLoading(true);
    setError(null);
    try {
      const url = root
        ? `${API_URL}/api/files/tree?root=${encodeURIComponent(root)}`
        : `${API_URL}/api/files/tree`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Tree fetch failed: ${res.statusText}`);
      const data: FileTree = await res.json();
      setTree(data.tree?.children ?? []);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  const readFile = useCallback(async (path: string): Promise<string> => {
    const res = await fetch(`${API_URL}/api/files/read`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail ?? `Read failed: ${res.statusText}`);
    }
    const data = await res.json();
    return data.content as string;
  }, []);

  const writeFile = useCallback(async (path: string, content: string): Promise<void> => {
    const res = await fetch(`${API_URL}/api/files/write`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path, content }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail ?? `Write failed: ${res.statusText}`);
    }
  }, []);

  const createFile = useCallback(
    async (path: string, type: "file" | "folder" = "file"): Promise<void> => {
      const res = await fetch(`${API_URL}/api/files/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path, type }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail ?? `Create failed: ${res.statusText}`);
      }
    },
    []
  );

  const deleteFile = useCallback(async (path: string): Promise<void> => {
    const res = await fetch(
      `${API_URL}/api/files/delete?path=${encodeURIComponent(path)}`,
      { method: "DELETE" }
    );
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail ?? `Delete failed: ${res.statusText}`);
    }
  }, []);

  const renameFile = useCallback(
    async (oldPath: string, newPath: string): Promise<void> => {
      const res = await fetch(`${API_URL}/api/files/rename`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ old_path: oldPath, new_path: newPath }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail ?? `Rename failed: ${res.statusText}`);
      }
    },
    []
  );

  return {
    tree,
    loading,
    error,
    fetchTree,
    readFile,
    writeFile,
    createFile,
    deleteFile,
    renameFile,
  };
}
