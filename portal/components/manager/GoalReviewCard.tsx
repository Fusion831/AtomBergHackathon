"use client";

import { Goal } from "@prisma/client";
import { useState, useTransition } from "react";
import { editGoalDuringReview } from "@/app/actions/managerActions";
import { MessageSquare, Save, X } from "lucide-react";

export function GoalReviewCard({ goal, isReadOnly }: { goal: Goal; isReadOnly: boolean }) {
  const [isEditing, setIsEditing] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [targetValue, setTargetValue] = useState(goal.targetValue?.toString() || "");
  const [weightage, setWeightage] = useState(goal.weightage.toString());
  const [comment, setComment] = useState(goal.managerComment || "");

  const handleSave = () => {
    startTransition(async () => {
      const res = await editGoalDuringReview(goal.id, {
        targetValue: targetValue ? parseFloat(targetValue) : undefined,
        weightage: parseInt(weightage, 10),
        managerComment: comment || undefined
      });
      if (res.success) {
        setIsEditing(false);
      } else {
        alert(res.message);
      }
    });
  };

  const hasChanges = targetValue !== (goal.targetValue?.toString() || "") || 
                     weightage !== goal.weightage.toString() || 
                     comment !== (goal.managerComment || "");

  return (
    <div className={`p-5 bg-zinc-900 border ${goal.managerComment ? "border-amber-500/30" : "border-zinc-800"} rounded-xl space-y-4`}>
      <div className="flex justify-between items-start gap-4">
        <div>
          <h4 className="text-zinc-100 font-medium">{goal.title}</h4>
          <p className="text-sm text-zinc-400 mt-1">{goal.description}</p>
        </div>
        <div className="flex gap-2">
          <span className="px-2 py-1 bg-zinc-800 text-zinc-300 text-xs rounded-md whitespace-nowrap">
            Weight: {goal.weightage}%
          </span>
          <span className="px-2 py-1 bg-zinc-800 text-zinc-300 text-xs rounded-md whitespace-nowrap">
            Target: {goal.targetValue ?? "N/A"} {goal.uomType === "PERCENTAGE" ? "%" : ""}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-4 text-xs text-zinc-500">
        <span>Thrust Area: {goal.thrustArea}</span>
        <span className="w-1 h-1 rounded-full bg-zinc-700"></span>
        <span>Type: {goal.goalType}</span>
        <span className="w-1 h-1 rounded-full bg-zinc-700"></span>
        <span>UoM: {goal.uomType}</span>
      </div>

      {!isReadOnly && (
        <div className="pt-4 border-t border-zinc-800/50">
          {!isEditing ? (
            <div className="flex items-center justify-between">
              {goal.managerComment ? (
                <div className="flex items-start gap-2 text-sm text-amber-400 bg-amber-500/10 px-3 py-2 rounded-md">
                  <MessageSquare size={16} className="mt-0.5 shrink-0" />
                  <span>{goal.managerComment}</span>
                </div>
              ) : (
                <div /> // Spacer
              )}
              <button 
                onClick={() => setIsEditing(true)}
                className="text-sm text-blue-400 hover:text-blue-300 font-medium transition-colors"
              >
                {goal.managerComment ? "Edit Review" : "Add Review / Adjust"}
              </button>
            </div>
          ) : (
            <div className="space-y-4 bg-zinc-950/50 p-4 rounded-lg border border-zinc-800/50">
              <div className="flex gap-4">
                <div className="flex-1 space-y-2">
                  <label className="text-xs text-zinc-400 font-medium">Adjust Target Value</label>
                  <input 
                    type="number" 
                    value={targetValue}
                    onChange={(e) => setTargetValue(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-md px-3 py-1.5 text-sm text-zinc-100 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div className="flex-1 space-y-2">
                  <label className="text-xs text-zinc-400 font-medium">Adjust Weightage (%)</label>
                  <input 
                    type="number" 
                    value={weightage}
                    onChange={(e) => setWeightage(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-md px-3 py-1.5 text-sm text-zinc-100 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-xs text-zinc-400 font-medium">Manager Comment (visible to employee if returned)</label>
                <textarea 
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Explain why target/weightage was adjusted, or what needs rework..."
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-md px-3 py-2 text-sm text-zinc-100 min-h-[80px] resize-y focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button 
                  onClick={() => setIsEditing(false)}
                  disabled={isPending}
                  className="px-3 py-1.5 text-sm text-zinc-400 hover:text-zinc-200 transition-colors flex items-center gap-1.5"
                >
                  <X size={14} /> Cancel
                </button>
                <button 
                  onClick={handleSave}
                  disabled={!hasChanges || isPending}
                  className="px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-800 disabled:text-zinc-500 text-white rounded-md transition-colors flex items-center gap-1.5 font-medium"
                >
                  <Save size={14} /> {isPending ? "Saving..." : "Save Adjustments"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
      {isReadOnly && goal.managerComment && (
        <div className="pt-4 border-t border-zinc-800/50 flex items-start gap-2 text-sm text-amber-400 bg-amber-500/10 px-3 py-2 rounded-md">
          <MessageSquare size={16} className="mt-0.5 shrink-0" />
          <span>{goal.managerComment}</span>
        </div>
      )}
    </div>
  );
}
