"use client";

import { GoalSheet, Goal } from "@prisma/client";
import { useTransition, useState } from "react";
import { submitGoalSheet } from "@/app/actions/sheetActions";
import { WeightageProgress } from "@/components/goals/WeightageProgress";
import { GoalForm } from "@/components/goals/GoalForm";
import { GoalList } from "@/components/goals/GoalList";
import { Plus } from "lucide-react";

type SheetWithGoals = GoalSheet & { goals: Goal[] };

export function GoalSheetManager({ sheet }: { sheet: SheetWithGoals }) {
  const [isPending, startTransition] = useTransition();
  const [showForm, setShowForm] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);

  const currentWeightage = sheet.goals.reduce((acc, g) => acc + g.weightage, 0);
  const isReadyToSubmit = currentWeightage === 100 && sheet.goals.length > 0 && sheet.goals.length <= 8;

  const handleSubmitSheet = () => {
    if (!isReadyToSubmit) return;
    startTransition(async () => {
      const res = await submitGoalSheet(sheet.id);
      if (!res.success) {
        alert(res.message);
      }
    });
  };

  const handleEdit = (goal: Goal) => {
    setEditingGoal(goal);
    setShowForm(true);
  };

  if (sheet.status !== "DRAFT") {
    return (
      <div className="p-8 text-center bg-zinc-900/50 border border-zinc-800 rounded-xl">
        <h3 className="text-lg font-medium text-blue-400">Sheet Submitted</h3>
        <p className="text-sm text-zinc-400 mt-2">Your goals are currently {sheet.status.replace("_", " ").toLowerCase()}. You cannot edit them at this time.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Real-time Validation UI */}
      <WeightageProgress current={currentWeightage} />

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium text-zinc-100">Drafted Goals ({sheet.goals.length}/8)</h2>
        {!showForm && sheet.goals.length < 8 && (
          <button 
            onClick={() => { setEditingGoal(null); setShowForm(true); }}
            className="flex items-center gap-2 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 text-sm font-medium rounded-md transition-colors"
          >
            <Plus className="w-4 h-4" /> Add Goal
          </button>
        )}
      </div>

      {showForm ? (
        <GoalForm 
          sheetId={sheet.id} 
          initialData={editingGoal || undefined} 
          onSuccess={() => { setShowForm(false); setEditingGoal(null); }}
          onCancel={() => { setShowForm(false); setEditingGoal(null); }}
        />
      ) : (
        <GoalList goals={sheet.goals} sheetId={sheet.id} onEdit={handleEdit} />
      )}

      {!showForm && (
        <div className="flex justify-end pt-4 border-t border-zinc-800/50">
          <button
            onClick={handleSubmitSheet}
            disabled={!isReadyToSubmit || isPending}
            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-800 disabled:text-zinc-500 text-white font-medium rounded-md transition-colors flex items-center gap-2"
          >
            {isPending ? "Submitting..." : "Submit Goal Sheet"}
          </button>
        </div>
      )}
    </div>
  );
}
