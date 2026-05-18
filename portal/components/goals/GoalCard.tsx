"use client";

import { Goal } from "@prisma/client";
import { Edit2, Trash2, Target, BarChart, CheckCircle, Users } from "lucide-react";
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
    <div className={`p-5 bg-zinc-900/40 hover:bg-zinc-900/60 border ${isShared ? 'border-violet-500/25 bg-violet-950/5' : 'border-zinc-900'} rounded-xl transition-all duration-200 group relative flex flex-col justify-between gap-4 active:scale-[0.99]`}>
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1.5 flex-1 min-w-0">
          {isShared && (
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2 py-0.5 bg-violet-500/10 text-violet-400 border border-violet-500/20 text-[9px] uppercase tracking-wider font-semibold rounded flex items-center gap-1">
                <Users size={10} /> Cascaded Goal
              </span>
            </div>
          )}
          <h4 className="text-sm font-semibold text-zinc-150 group-hover:text-zinc-100 transition-colors truncate">{goal.title}</h4>
          <p className="text-xs text-zinc-450 leading-relaxed line-clamp-2">{goal.description || "No description provided."}</p>
        </div>
        
        {/* Alignment controls - right side aligned metadata & actions */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 bg-zinc-950/60 border border-zinc-900 p-0.5 rounded-lg">
            <button onClick={() => onEdit(goal)} className="p-1 text-zinc-500 hover:text-blue-400 rounded transition-colors" type="button" title="Edit Goal">
              <Edit2 className="w-3.5 h-3.5" />
            </button>
            {!isShared && (
              <button disabled={isPending} onClick={handleDelete} className="p-1 text-zinc-500 hover:text-rose-450 rounded transition-colors disabled:opacity-50" type="button" title="Delete Goal">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
      
      {/* Bottom metadata tag layout - very neat and clean */}
      <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-zinc-950/40 text-[10px] font-semibold text-zinc-400">
        <div className="flex items-center gap-1 bg-zinc-950/80 px-2 py-1 border border-zinc-900 rounded-md text-amber-500/90 font-mono">
          <BarChart className="w-3 h-3 text-amber-500/70" />
          <span>Contribution: {goal.weightage}%</span>
        </div>
        <div className="flex items-center gap-1 bg-zinc-950/80 px-2 py-1 border border-zinc-900 rounded-md font-medium text-zinc-400">
          <Target className="w-3 h-3 text-zinc-500" />
          <span>{goal.thrustArea}</span>
        </div>
        <div className="flex items-center gap-1 bg-zinc-950/80 px-2 py-1 border border-zinc-900 rounded-md font-medium text-zinc-400">
          <CheckCircle className="w-3 h-3 text-zinc-500" />
          <span>{goal.uomType === "NUMERIC" ? "Numeric" : goal.uomType === "PERCENTAGE" ? "Percentage" : "Zero-Based"} {goal.targetValue !== null ? `(${goal.targetValue})` : ''}</span>
        </div>
      </div>
    </div>
  );
}
