"use client";

import { Goal } from "@prisma/client";
import { Edit2, Trash2, Target, BarChart, CheckCircle } from "lucide-react";
import { deleteGoal } from "@/app/actions/goalActions";
import { useTransition } from "react";

export function GoalCard({ goal, sheetId, onEdit }: { goal: Goal, sheetId: string, onEdit: (g: Goal) => void }) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    if (confirm("Are you sure you want to delete this goal?")) {
      startTransition(async () => {
        await deleteGoal(goal.id, sheetId);
      });
    }
  };

  return (
    <div className="flex flex-col gap-4 p-5 bg-zinc-900/40 hover:bg-zinc-900/60 border border-zinc-800 rounded-xl transition-colors group">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h4 className="text-base font-medium text-zinc-100">{goal.title}</h4>
          <p className="text-sm text-zinc-400 line-clamp-2">{goal.description || "No description provided."}</p>
        </div>
        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={() => onEdit(goal)} className="p-1.5 text-zinc-400 hover:text-blue-400 rounded-md hover:bg-zinc-800 transition-colors">
            <Edit2 className="w-4 h-4" />
          </button>
          <button disabled={isPending} onClick={handleDelete} className="p-1.5 text-zinc-400 hover:text-rose-400 rounded-md hover:bg-zinc-800 transition-colors disabled:opacity-50">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      <div className="flex flex-wrap items-center gap-4 pt-3 border-t border-zinc-800/50">
        <div className="flex items-center gap-1.5 text-xs font-medium text-amber-400 bg-amber-400/10 px-2.5 py-1 rounded-md">
          <BarChart className="w-3.5 h-3.5" />
          {goal.weightage}% Weight
        </div>
        <div className="flex items-center gap-1.5 text-xs font-medium text-zinc-400 bg-zinc-800 px-2.5 py-1 rounded-md">
          <Target className="w-3.5 h-3.5" />
          {goal.thrustArea}
        </div>
        <div className="flex items-center gap-1.5 text-xs font-medium text-zinc-400 bg-zinc-800 px-2.5 py-1 rounded-md">
          <CheckCircle className="w-3.5 h-3.5" />
          {goal.uomType} {goal.targetValue !== null ? `(${goal.targetValue})` : ''}
        </div>
      </div>
    </div>
  );
}
