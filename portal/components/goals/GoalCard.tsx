"use client";

import { Goal } from "@prisma/client";
import { Edit2, Trash2, Target, BarChart3, CheckCircle, Users, Calendar } from "lucide-react";
import { deleteGoal } from "@/app/actions/goalActions";
import { useTransition } from "react";

export function GoalCard({ goal, sheetId, onEdit }: { goal: Goal, sheetId: string, onEdit: (g: Goal) => void }) {
  const [isPending, startTransition] = useTransition();
  const isShared = goal.goalType === "SHARED";

  const handleDelete = () => {
    if (confirm("Are you sure you want to delete this goal?")) {
      startTransition(async () => {
        await deleteGoal(goal.id, sheetId);
      });
    }
  };

  return (
    <div className={`p-4 bg-zinc-950/20 hover:bg-zinc-950/40 border ${isShared ? 'border-violet-500/20 bg-violet-950/5' : 'border-zinc-900'} rounded-xl transition-all duration-200 group flex flex-col md:flex-row md:items-center justify-between gap-4 select-none`}>
      {/* LEFT Zone: Goal Identity & Description */}
      <div className="flex-1 min-w-0 space-y-1.5">
        <div className="flex flex-wrap items-center gap-2">
          <h4 className="text-xs font-bold text-zinc-150 group-hover:text-zinc-100 transition-colors truncate">
            {goal.title}
          </h4>
          {isShared && (
            <span className="px-1.5 py-0.5 bg-violet-500/10 text-violet-400 border border-violet-500/20 text-[9px] uppercase tracking-wider font-extrabold rounded-md flex items-center gap-1 shrink-0">
              <Users size={8} /> Cascaded Target
            </span>
          )}
        </div>
        <p className="text-[11px] text-zinc-500 leading-relaxed max-w-2xl line-clamp-2">
          {goal.description || "No description provided."}
        </p>
      </div>

      {/* RIGHT Zone: Compact Status & Contribution Metadata */}
      <div className="flex flex-wrap items-center gap-2.5 shrink-0 md:justify-end">
        {/* Status Badge */}
        <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider border ${
          goal.status === "COMPLETED" 
            ? "bg-emerald-500/10 text-emerald-450 border-emerald-500/20"
            : goal.status === "ON_TRACK"
            ? "bg-blue-500/10 text-blue-450 border-blue-500/20"
            : "bg-zinc-900 text-zinc-550 border-zinc-800"
        }`}>
          {goal.status === "COMPLETED" ? "Completed" : goal.status === "ON_TRACK" ? "On Track" : "Not Started"}
        </span>

        {/* Contribution Score Badge */}
        <span className="px-2 py-0.5 bg-zinc-900/50 border border-zinc-900 text-zinc-400 font-mono text-[9px] font-bold rounded-md flex items-center gap-1 select-none">
          <BarChart3 size={10} className="text-zinc-500" />
          {goal.weightage}% Contribution
        </span>

        {/* Thrust Area and UoM Badges */}
        <span className="px-2 py-0.5 bg-zinc-900/40 border border-zinc-900/60 text-zinc-500 text-[9px] font-bold rounded-md flex items-center gap-1">
          <Target size={10} className="text-zinc-650" />
          {goal.thrustArea}
        </span>

        {/* Dynamic Actions */}
        <div className="flex items-center gap-1.5 ml-1 border-l border-zinc-900 pl-2.5">
          <button 
            onClick={() => onEdit(goal)} 
            className="p-1 text-zinc-550 hover:text-blue-450 hover:bg-zinc-900/50 rounded-lg transition-colors cursor-pointer" 
            type="button" 
            title="Edit Goal"
          >
            <Edit2 size={11} />
          </button>
          {!isShared && (
            <button 
              disabled={isPending} 
              onClick={handleDelete} 
              className="p-1 text-zinc-555 hover:text-rose-450 hover:bg-zinc-900/50 rounded-lg transition-colors disabled:opacity-50 cursor-pointer" 
              type="button" 
              title="Delete Goal"
            >
              <Trash2 size={11} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
