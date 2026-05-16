"use client";

import { useTransition, useState } from "react";
import { approveGoalSheet, rejectGoalSheet } from "@/app/actions/managerActions";
import { useRouter } from "next/navigation";
import { CheckCircle, XCircle, AlertTriangle } from "lucide-react";

export function ManagerReviewActions({ sheetId, totalWeight }: { sheetId: string; totalWeight: number }) {
  const [isPending, startTransition] = useTransition();
  const [showConfirmApprove, setShowConfirmApprove] = useState(false);
  const [showConfirmReject, setShowConfirmReject] = useState(false);
  const router = useRouter();

  const handleApprove = () => {
    if (totalWeight !== 100) {
      alert(`Cannot approve: Total weightage must be 100% (currently ${totalWeight}%). Please adjust goals first.`);
      return;
    }

    startTransition(async () => {
      const res = await approveGoalSheet(sheetId);
      if (res.success) {
        router.push("/manager/review");
      } else {
        alert(res.message);
        setShowConfirmApprove(false);
      }
    });
  };

  const handleReject = () => {
    startTransition(async () => {
      const res = await rejectGoalSheet(sheetId);
      if (res.success) {
        router.push("/manager/review");
      } else {
        alert(res.message);
        setShowConfirmReject(false);
      }
    });
  };

  if (showConfirmApprove) {
    return (
      <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex gap-3">
          <CheckCircle className="text-emerald-500 shrink-0 mt-0.5" size={20} />
          <div>
            <h4 className="text-emerald-500 font-medium">Approve and Lock Goal Sheet?</h4>
            <p className="text-sm text-zinc-400 mt-1">This will lock the goals permanently for the cycle. Neither you nor the employee will be able to edit them without Admin intervention.</p>
          </div>
        </div>
        <div className="flex gap-3 shrink-0 w-full md:w-auto">
          <button 
            onClick={() => setShowConfirmApprove(false)}
            disabled={isPending}
            className="flex-1 md:flex-none px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm font-medium rounded-md transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={handleApprove}
            disabled={isPending}
            className="flex-1 md:flex-none px-6 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800 text-white text-sm font-medium rounded-md transition-colors flex items-center justify-center gap-2"
          >
            {isPending ? "Approving..." : "Yes, Approve & Lock"}
          </button>
        </div>
      </div>
    );
  }

  if (showConfirmReject) {
    return (
      <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex gap-3">
          <AlertTriangle className="text-amber-500 shrink-0 mt-0.5" size={20} />
          <div>
            <h4 className="text-amber-500 font-medium">Return for Rework?</h4>
            <p className="text-sm text-zinc-400 mt-1">This will unlock the sheet and send it back to the employee's drafts. Ensure you have left comments explaining what needs changing.</p>
          </div>
        </div>
        <div className="flex gap-3 shrink-0 w-full md:w-auto">
          <button 
            onClick={() => setShowConfirmReject(false)}
            disabled={isPending}
            className="flex-1 md:flex-none px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm font-medium rounded-md transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={handleReject}
            disabled={isPending}
            className="flex-1 md:flex-none px-6 py-2 bg-amber-600 hover:bg-amber-500 disabled:bg-amber-800 text-white text-sm font-medium rounded-md transition-colors flex items-center justify-center gap-2"
          >
            {isPending ? "Returning..." : "Yes, Return to Employee"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col sm:flex-row gap-4 items-center justify-end border-t border-zinc-800/80 pt-6">
      <button 
        onClick={() => setShowConfirmReject(true)}
        className="w-full sm:w-auto px-6 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium rounded-md transition-colors flex items-center justify-center gap-2"
      >
        <XCircle size={18} /> Return for Rework
      </button>
      <button 
        onClick={() => setShowConfirmApprove(true)}
        className="w-full sm:w-auto px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-md transition-colors flex items-center justify-center gap-2"
      >
        <CheckCircle size={18} /> Approve & Lock Goals
      </button>
    </div>
  );
}
