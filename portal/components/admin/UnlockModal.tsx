"use client";

import { useState, useTransition } from "react";
import { unlockGoalSheet } from "@/app/actions/adminActions";
import { Unlock, X, AlertTriangle } from "lucide-react";

export function UnlockModal({ sheetId, userName }: { sheetId: string, userName: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleUnlock = () => {
    if (!reason.trim()) {
      alert("A reason is required to preserve the audit trail.");
      return;
    }

    startTransition(async () => {
      const res = await unlockGoalSheet(sheetId, reason);
      if (res.success) {
        setIsOpen(false);
        setReason("");
      } else {
        alert(res.message);
      }
    });
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium rounded transition-colors flex items-center gap-1.5"
      >
        <Unlock size={14} /> Admin Unlock
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl w-full max-w-md shadow-xl overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-zinc-800/80">
              <h3 className="text-lg font-medium text-zinc-100 flex items-center gap-2">
                <AlertTriangle className="text-amber-500" size={18} /> Admin Override
              </h3>
              <button onClick={() => setIsOpen(false)} className="text-zinc-500 hover:text-zinc-300 transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-5 space-y-4">
              <p className="text-sm text-zinc-300 leading-relaxed">
                You are about to unlock the Goal Sheet for <strong className="text-white">{userName}</strong>. This will return the sheet to a <strong>DRAFT</strong> state, allowing the employee to modify targets and weightages.
              </p>
              
              <div className="space-y-2">
                <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Required Audit Reason</label>
                <textarea 
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g., Authorized mid-year KPI adjustment by HR..."
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-md px-3 py-2 text-sm text-zinc-100 min-h-[80px] focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div className="p-4 border-t border-zinc-800/80 bg-zinc-950/50 flex justify-end gap-3">
              <button 
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 text-sm font-medium text-zinc-400 hover:text-zinc-200 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleUnlock}
                disabled={!reason.trim() || isPending}
                className="px-4 py-2 text-sm font-medium bg-amber-600 hover:bg-amber-500 disabled:bg-zinc-800 disabled:text-zinc-500 text-white rounded-md transition-colors flex items-center gap-1.5"
              >
                <Unlock size={14} /> {isPending ? "Unlocking..." : "Unlock Sheet"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
