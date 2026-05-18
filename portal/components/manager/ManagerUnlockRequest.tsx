"use client";

import { useState, useTransition } from "react";
import { Unlock, FileText, AlertTriangle } from "lucide-react";
import { requestManagerUnlock } from "@/app/actions/sheetActions";
import { useRouter } from "next/navigation";

interface ManagerUnlockRequestProps {
  sheetId: string;
  employeeName: string;
  quarter: string;
  departmentName: string;
  initialUnlockRequested: boolean;
  initialUnlockReason?: string | null;
}

export function ManagerUnlockRequest({
  sheetId,
  employeeName,
  quarter,
  departmentName,
  initialUnlockRequested,
  initialUnlockReason,
}: ManagerUnlockRequestProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleRequest = () => {
    if (!reason.trim()) {
      setError("Please provide a business justification reason.");
      return;
    }
    setError("");

    startTransition(async () => {
      const res = await requestManagerUnlock(sheetId, reason, notes);
      if (res.success) {
        setIsOpen(false);
        router.refresh();
      } else {
        setError(res.message || "Failed to submit request.");
      }
    });
  };

  if (initialUnlockRequested) {
    return (
      <div className="p-5 bg-amber-500/5 border border-amber-500/10 rounded-xl flex items-start gap-3.5">
        <Unlock className="text-amber-400 shrink-0 mt-0.5" size={18} />
        <div>
          <h4 className="text-amber-400 font-semibold text-sm">Unlock Request Pending</h4>
          <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
            An administrator review is currently pending for this sheet.
          </p>
          {initialUnlockReason && (
            <p className="text-xs text-amber-500/80 mt-2 bg-amber-500/5 px-3 py-2 border border-amber-500/10 rounded font-mono break-words max-w-2xl">
              {initialUnlockReason}
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="p-5 bg-zinc-900 border border-zinc-800 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h4 className="text-zinc-300 font-semibold text-sm flex items-center gap-1.5">
            <Unlock size={15} className="text-zinc-400" /> Recommend Mid-Cycle Adjustment
          </h4>
          <p className="text-xs text-zinc-500 mt-1 max-w-xl">
            As {employeeName}'s manager, you can request an Admin to temporarily unlock this {quarter} sheet to allow goals or targets updates.
          </p>
        </div>
        <button
          onClick={() => {
            setError("");
            setReason("");
            setNotes("");
            setIsOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-amber-600/10 hover:bg-amber-600/20 text-amber-500 hover:text-amber-400 border border-amber-600/20 rounded-lg transition-all font-semibold text-xs active:scale-[0.98] shrink-0"
          type="button"
        >
          <Unlock size={14} /> Request Unlock for Employee
        </button>
      </div>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsOpen(false)}></div>

          {/* Dialog Container */}
          <div className="relative z-10 w-full max-w-lg bg-zinc-950 border border-zinc-900 rounded-2xl p-6 shadow-2xl animate-scale-up font-sans">
            <div className="flex items-center gap-2 mb-4 text-amber-400">
              <Unlock size={20} />
              <h3 className="text-base font-bold text-zinc-100">Recommend Goal Sheet Unlock</h3>
            </div>

            {/* Employee Metadata Info */}
            <div className="mb-4 p-3 bg-zinc-900/60 border border-zinc-900 rounded-lg text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-zinc-500">Employee:</span>
                <span className="text-zinc-300 font-medium">{employeeName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Department:</span>
                <span className="text-zinc-300">{departmentName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Quarter Cycle:</span>
                <span className="text-zinc-300 font-semibold">{quarter}</span>
              </div>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs rounded-lg flex items-center gap-2">
                <AlertTriangle size={14} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
                  Business Justification (Required)
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Provide a precise reason why this employee requires mid-cycle goals changes..."
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-amber-500/40 h-20 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
                  Recommendation / Adjustment Notes (Optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Target metrics updates, strategic revisions recommendations..."
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-amber-500/40 h-20 resize-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setIsOpen(false)}
                disabled={isPending}
                className="px-4 py-2 text-xs font-semibold text-zinc-500 hover:text-zinc-300 transition-colors"
                type="button"
              >
                Cancel
              </button>
              <button
                onClick={handleRequest}
                disabled={isPending || !reason.trim()}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white text-xs font-semibold rounded-lg transition-colors shadow-lg shadow-amber-950/20 active:scale-[0.98]"
                type="button"
              >
                {isPending ? "Submitting..." : "Submit Recommendation"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
