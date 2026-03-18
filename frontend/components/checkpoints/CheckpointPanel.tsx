"use client";

import { useEffect, useState } from "react";
import { Save, RotateCcw, Loader2, AlertTriangle, X } from "lucide-react";
import { useCheckpoints, type Checkpoint } from "@/hooks/useCheckpoints";

interface Props {
  onClose: () => void;
  onRestored: () => void;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function CheckpointPanel({ onClose, onRestored }: Props) {
  const { checkpoints, loading, error, fetchCheckpoints, createCheckpoint, restoreCheckpoint } =
    useCheckpoints();
  const [labelInput, setLabelInput] = useState("");
  const [confirmRestore, setConfirmRestore] = useState<Checkpoint | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    fetchCheckpoints();
  }, [fetchCheckpoints]);

  const handleCreate = async () => {
    setActionLoading(true);
    setSuccessMsg(null);
    const result = await createCheckpoint(labelInput.trim() || undefined);
    if (result) {
      setLabelInput("");
      setSuccessMsg(`Checkpoint "${result.name}" saved.`);
      setTimeout(() => setSuccessMsg(null), 3000);
    }
    setActionLoading(false);
  };

  const handleRestore = async (cp: Checkpoint) => {
    setActionLoading(true);
    const ok = await restoreCheckpoint(cp.name);
    if (ok) {
      setConfirmRestore(null);
      setSuccessMsg(`Restored from "${cp.name}".`);
      onRestored();
      setTimeout(() => setSuccessMsg(null), 3000);
    }
    setActionLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-[420px] max-h-[80vh] flex flex-col bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 shrink-0">
          <div className="flex items-center gap-2">
            <Save size={14} className="text-zinc-400" />
            <h2 className="text-sm font-semibold text-zinc-200">Checkpoints</h2>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300 transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Create new checkpoint */}
        <div className="shrink-0 px-4 py-3 border-b border-zinc-800 space-y-2">
          <p className="text-[10px] text-zinc-500 uppercase tracking-widest">Save Current State</p>
          <div className="flex gap-2">
            <input
              type="text"
              value={labelInput}
              onChange={(e) => setLabelInput(e.target.value)}
              placeholder="Label (optional)"
              className="flex-1 bg-zinc-800 border border-zinc-700 rounded px-2.5 py-1.5 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-blue-500"
              onKeyDown={(e) => { if (e.key === "Enter") handleCreate(); }}
            />
            <button
              onClick={handleCreate}
              disabled={actionLoading || loading}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-700 disabled:text-zinc-500 text-white rounded transition-colors"
            >
              {actionLoading ? <Loader2 size={11} className="animate-spin" /> : <Save size={11} />}
              Save
            </button>
          </div>
          {successMsg && (
            <p className="text-[11px] text-emerald-400">{successMsg}</p>
          )}
          {error && (
            <p className="text-[11px] text-red-400">{error}</p>
          )}
        </div>

        {/* Checkpoint list */}
        <div className="flex-1 overflow-y-auto px-4 py-3">
          {loading && checkpoints.length === 0 ? (
            <div className="flex justify-center py-8">
              <Loader2 size={16} className="animate-spin text-zinc-600" />
            </div>
          ) : checkpoints.length === 0 ? (
            <div className="text-center py-8 text-xs text-zinc-600">
              No checkpoints yet. Save one above.
            </div>
          ) : (
            <div className="space-y-1.5">
              <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-2">
                Saved Checkpoints
              </p>
              {checkpoints.map((cp) => (
                <div
                  key={cp.name}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg bg-zinc-800/60 border border-zinc-700/50 hover:border-zinc-600 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-zinc-300 font-mono truncate">{cp.name}</p>
                    <p className="text-[10px] text-zinc-600">
                      {new Date(cp.created_at).toLocaleString()} · {formatSize(cp.size)}
                    </p>
                  </div>
                  <button
                    onClick={() => setConfirmRestore(cp)}
                    className="flex items-center gap-1 px-2 py-1 text-[10px] text-amber-400 hover:bg-amber-900/30 rounded transition-colors"
                    title="Restore this checkpoint"
                  >
                    <RotateCcw size={10} />
                    Restore
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Confirm restore dialog */}
        {confirmRestore && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/70 rounded-xl">
            <div className="bg-zinc-800 border border-zinc-700 rounded-lg p-5 max-w-xs mx-4 space-y-3">
              <div className="flex items-center gap-2 text-amber-400">
                <AlertTriangle size={16} />
                <span className="text-sm font-semibold">Restore Checkpoint?</span>
              </div>
              <p className="text-xs text-zinc-400">
                This will overwrite your current workspace with{" "}
                <span className="text-zinc-200 font-mono">{confirmRestore.name}</span>.
                This action cannot be undone.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => handleRestore(confirmRestore)}
                  disabled={actionLoading}
                  className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs bg-amber-600 hover:bg-amber-500 text-white rounded transition-colors"
                >
                  {actionLoading ? <Loader2 size={11} className="animate-spin" /> : <RotateCcw size={11} />}
                  Restore
                </button>
                <button
                  onClick={() => setConfirmRestore(null)}
                  className="flex-1 py-1.5 text-xs text-zinc-400 hover:text-zinc-200 border border-zinc-700 hover:border-zinc-600 rounded transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
