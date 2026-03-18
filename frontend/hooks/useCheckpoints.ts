"use client";

import { useState, useCallback } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export interface Checkpoint {
  name: string;
  filename: string;
  size: number;
  created_at: string;
}

export function useCheckpoints() {
  const [checkpoints, setCheckpoints] = useState<Checkpoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCheckpoints = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/api/files/checkpoints`);
      if (!res.ok) throw new Error("Failed to fetch checkpoints");
      const data = await res.json();
      setCheckpoints(data.checkpoints ?? []);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  const createCheckpoint = useCallback(async (label?: string): Promise<Checkpoint | null> => {
    setLoading(true);
    setError(null);
    try {
      const url = label
        ? `${API_URL}/api/files/checkpoint?label=${encodeURIComponent(label)}`
        : `${API_URL}/api/files/checkpoint`;
      const res = await fetch(url, { method: "POST" });
      if (!res.ok) throw new Error("Failed to create checkpoint");
      const data = await res.json();
      await fetchCheckpoints();
      return data;
    } catch (e) {
      setError(String(e));
      return null;
    } finally {
      setLoading(false);
    }
  }, [fetchCheckpoints]);

  const restoreCheckpoint = useCallback(async (name: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/api/files/restore/${encodeURIComponent(name)}`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Failed to restore checkpoint");
      return true;
    } catch (e) {
      setError(String(e));
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return { checkpoints, loading, error, fetchCheckpoints, createCheckpoint, restoreCheckpoint };
}
