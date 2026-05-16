"use client";

import { Goal } from "@prisma/client";
import { GoalCard } from "./GoalCard";

export function GoalList({ goals, sheetId, onEdit }: { goals: Goal[], sheetId: string, onEdit: (g: Goal) => void }) {
  if (goals.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center border border-dashed border-zinc-800 rounded-xl bg-zinc-900/20">
        <h3 className="text-sm font-medium text-zinc-300">No goals drafted yet</h3>
        <p className="text-xs text-zinc-500 mt-1 max-w-sm">Draft up to 8 goals summarizing your priorities for the cycle. Ensure your total weightage balances to exactly 100%.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {goals.map((goal) => (
        <GoalCard key={goal.id} goal={goal} sheetId={sheetId} onEdit={onEdit} />
      ))}
    </div>
  );
}
