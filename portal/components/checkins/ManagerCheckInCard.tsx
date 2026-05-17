"use client";

import { Goal, CheckIn, CheckInPeriod } from "@prisma/client";
import { useState, useTransition } from "react";
import { addManagerCheckInComment } from "@/app/actions/checkInActions";
import { Save } from "lucide-react";

type GoalWithCheckIns = Goal & { checkIns: CheckIn[] };

export function ManagerCheckInCard({ goal, activePeriod, readOnly }: { goal: GoalWithCheckIns; activePeriod: CheckInPeriod; readOnly?: boolean }) {
  const [isPending, startTransition] = useTransition();
  const currentCheckIn = goal.checkIns.find((c) => c.period === activePeriod);
  
  const [managerComment, setManagerComment] = useState(currentCheckIn?.managerComment || "");

  const handleSave = () => {
    if (!currentCheckIn) return;
    startTransition(async () => {
      const res = await addManagerCheckInComment(currentCheckIn.id, managerComment);
      if (!res.success) {
        alert(res.message);
      }
    });
  };

  const hasChanges = managerComment !== (currentCheckIn?.managerComment || "");

  return (
    <div className="p-5 bg-zinc-900 border border-zinc-800 rounded-xl space-y-4">
      <div className="flex justify-between items-start gap-4 border-b border-zinc-800/50 pb-4">
        <div>
          <h4 className="text-zinc-100 font-medium">{goal.title}</h4>
          <div className="flex gap-4 mt-2 text-sm">
            <div className="text-zinc-400">
              <span className="block text-xs uppercase tracking-wider text-zinc-500 mb-0.5">Target</span>
              <span className="font-medium text-zinc-200">
                {goal.targetValue ?? "N/A"} {goal.uomType === "PERCENTAGE" ? "%" : ""}
              </span>
            </div>
            <div className="w-px bg-zinc-800"></div>
            <div className="text-zinc-400">
              <span className="block text-xs uppercase tracking-wider text-zinc-500 mb-0.5">Actual</span>
              <span className="font-medium text-blue-400">
                {currentCheckIn?.actualValue ?? "Not provided"} {currentCheckIn?.actualValue && goal.uomType === "PERCENTAGE" ? "%" : ""}
              </span>
            </div>
            <div className="w-px bg-zinc-800"></div>
            <div className="text-zinc-400">
              <span className="block text-xs uppercase tracking-wider text-zinc-500 mb-0.5">Score</span>
              <span className={`font-medium ${currentCheckIn?.progressScore && currentCheckIn.progressScore >= 100 ? "text-emerald-400" : currentCheckIn?.progressScore && currentCheckIn.progressScore >= 50 ? "text-amber-400" : "text-zinc-200"}`}>
                {currentCheckIn?.progressScore ?? 0}%
              </span>
            </div>
          </div>
        </div>
        <div className="text-right">
          <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${
            currentCheckIn?.status === "COMPLETED" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
            currentCheckIn?.status === "ON_TRACK" ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" :
            "bg-zinc-800 text-zinc-400 border border-zinc-700"
          }`}>
            {currentCheckIn?.status?.replace("_", " ") || "NOT STARTED"}
          </span>
        </div>
      </div>

      <div className="space-y-4 pt-2">
        {currentCheckIn?.employeeComment ? (
          <div className="space-y-1">
            <span className="block text-xs font-medium uppercase tracking-wider text-zinc-500 mb-0.5">Employee Comment</span>
            <p className="text-sm text-zinc-300 p-3 bg-zinc-950 rounded-md border border-zinc-800/50 leading-relaxed">
              {currentCheckIn.employeeComment}
            </p>
          </div>
        ) : (
          <p className="text-xs text-zinc-500 italic">Employee has not left a comment for this check-in.</p>
        )}

        {readOnly ? (
          <div className="space-y-1 mt-4 pt-4 border-t border-zinc-800/50">
            <span className="block text-xs font-medium uppercase tracking-wider text-zinc-500 mb-0.5 font-semibold">Manager Feedback</span>
            {currentCheckIn?.managerComment ? (
              <p className="text-sm text-blue-400 p-3 bg-blue-500/5 rounded-md border border-blue-500/10 leading-relaxed">
                {currentCheckIn.managerComment}
              </p>
            ) : (
              <p className="text-xs text-zinc-500 italic p-3 bg-zinc-950 rounded-md border border-zinc-850">No manager feedback was provided for this period.</p>
            )}
          </div>
        ) : (
          currentCheckIn && (
            <div className="space-y-2 mt-4 pt-4 border-t border-zinc-800/50">
              <label className="text-xs text-zinc-400 font-medium uppercase tracking-wider">Add Manager Feedback</label>
              <textarea 
                placeholder="Leave feedback on their progress..."
                value={managerComment}
                onChange={(e) => setManagerComment(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-md px-3 py-2 text-sm text-zinc-100 min-h-[80px] resize-y focus:outline-none focus:border-blue-500"
              />
              <div className="flex justify-end pt-2">
                <button 
                  onClick={handleSave}
                  disabled={!hasChanges || isPending}
                  className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-800 disabled:text-zinc-500 text-white rounded-md transition-colors flex items-center gap-2 font-medium"
                >
                  <Save size={16} /> {isPending ? "Saving..." : "Save Feedback"}
                </button>
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
}
