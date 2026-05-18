"use client";

import { Goal, CheckIn, CheckInPeriod, GoalStatus } from "@prisma/client";
import { useState, useTransition } from "react";
import { upsertCheckIn } from "@/app/actions/checkInActions";
import { Save, MessageSquare, Info } from "lucide-react";

type GoalWithCheckIns = Goal & { checkIns: CheckIn[] };

export function CheckInCard({ goal, activePeriod, readOnly }: { goal: GoalWithCheckIns; activePeriod: CheckInPeriod; readOnly?: boolean }) {
  const [isPending, startTransition] = useTransition();
  const currentCheckIn = goal.checkIns.find((c) => c.period === activePeriod);
  
  const [actualValue, setActualValue] = useState(currentCheckIn?.actualValue?.toString() || "");
  const [employeeComment, setEmployeeComment] = useState(currentCheckIn?.employeeComment || "");
  const [statusOverride, setStatusOverride] = useState<GoalStatus | undefined>(currentCheckIn?.status || undefined);

  const handleSave = () => {
    startTransition(async () => {
      const res = await upsertCheckIn(goal.id, activePeriod, {
        actualValue: actualValue ? parseFloat(actualValue) : undefined,
        employeeComment: employeeComment || undefined,
        statusOverride: statusOverride || undefined
      });
      if (!res.success) {
        alert(res.message);
      }
    });
  };

  const hasChanges = actualValue !== (currentCheckIn?.actualValue?.toString() || "") ||
                     employeeComment !== (currentCheckIn?.employeeComment || "") ||
                     statusOverride !== (currentCheckIn?.status || undefined);

  return (
    <div className="p-5 bg-zinc-900/60 border border-zinc-900 rounded-xl space-y-4 shadow-md select-none">
      <div className="flex justify-between items-start gap-4 border-b border-zinc-950 pb-4">
        <div>
          <h4 className="text-zinc-150 font-semibold text-sm">{goal.title}</h4>
          <div className="flex gap-4 mt-2 text-xs">
            <div>
              <span className="block text-[9px] uppercase tracking-wider text-zinc-550 mb-0.5 font-bold">Target Target</span>
              <span className="font-semibold text-zinc-350">
                {goal.targetValue ?? "N/A"} {goal.uomType === "PERCENTAGE" ? "%" : ""}
              </span>
            </div>
            <div className="w-px bg-zinc-900"></div>
            <div>
              <span className="block text-[9px] uppercase tracking-wider text-zinc-550 mb-0.5 font-bold">Progress Rate</span>
              <span className={`font-mono font-bold ${currentCheckIn?.progressScore && currentCheckIn.progressScore >= 100 ? "text-emerald-450" : currentCheckIn?.progressScore && currentCheckIn.progressScore >= 50 ? "text-amber-450" : "text-zinc-350"}`}>
                {currentCheckIn?.progressScore ?? 0}%
              </span>
            </div>
          </div>
        </div>
        <div className="text-right">
          <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full border ${
            currentCheckIn?.status === "COMPLETED" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
            currentCheckIn?.status === "IN_PROGRESS" ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
            "bg-zinc-800 text-zinc-400 border-zinc-700"
          }`}>
            {currentCheckIn?.status?.replace("_", " ") || "NOT STARTED"}
          </span>
        </div>
      </div>

      <div className="space-y-4 pt-1">
        {readOnly ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              <div className="bg-zinc-950/40 p-3 rounded-lg border border-zinc-900">
                <span className="block text-[9px] font-bold uppercase tracking-wider text-zinc-550 mb-1">Actual Value</span>
                <p className="text-xs font-semibold text-zinc-300">
                  {currentCheckIn?.actualValue !== undefined && currentCheckIn?.actualValue !== null 
                    ? `${currentCheckIn.actualValue}${goal.uomType === "PERCENTAGE" ? "%" : ""}`
                    : "No logged values"
                  }
                </p>
              </div>
              <div className="bg-zinc-950/40 p-3 rounded-lg border border-zinc-900">
                <span className="block text-[9px] font-bold uppercase tracking-wider text-zinc-550 mb-1">Status Mode</span>
                <p className="text-xs font-semibold text-zinc-300">
                  {currentCheckIn ? (currentCheckIn.status ? "Override" : "Automated") : "Pending"}
                </p>
              </div>
            </div>

            <div className="space-y-1">
              <span className="block text-[9px] font-bold uppercase tracking-wider text-zinc-550 mb-1">Employee Reflection</span>
              {currentCheckIn?.employeeComment ? (
                <p className="text-xs text-zinc-400 p-3 bg-zinc-950/40 rounded-lg border border-zinc-900 leading-relaxed">
                  {currentCheckIn.employeeComment}
                </p>
              ) : (
                <p className="text-xs text-zinc-650 italic p-3 bg-zinc-950/20 rounded-lg border border-zinc-900">No reflections logged for this cycle.</p>
              )}
            </div>
          </>
        ) : (
          <>
            <div className="space-y-2">
              <label className="text-[10px] text-zinc-450 font-bold uppercase tracking-wider flex items-center gap-1">
                <Info size={12} className="text-zinc-600" /> Update Current Actual
              </label>
              <div className="flex gap-2">
                <input 
                  type="number"
                  placeholder={`Enter actual ${goal.uomType.toLowerCase()} value`}
                  value={actualValue}
                  onChange={(e) => setActualValue(e.target.value)}
                  className="flex-1 bg-zinc-950 border border-zinc-900 rounded-lg px-3 py-2 text-xs text-zinc-200 placeholder:text-zinc-650 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                />
                <select
                  value={statusOverride || ""}
                  onChange={(e) => setStatusOverride(e.target.value ? (e.target.value as GoalStatus) : undefined)}
                  className="w-40 bg-zinc-950 border border-zinc-900 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="">Auto-calculate</option>
                  <option value="NOT_STARTED">Not Started</option>
                  <option value="IN_PROGRESS">On Track</option>
                  <option value="COMPLETED">Completed</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] text-zinc-450 font-bold uppercase tracking-wider">Commentary & Insights</label>
              <textarea 
                placeholder="Share specific outcomes achieved, blockers, or support required..."
                value={employeeComment}
                onChange={(e) => setEmployeeComment(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-900 rounded-lg px-3 py-2 text-xs text-zinc-250 min-h-[60px] resize-y focus:outline-none focus:ring-1 focus:ring-blue-500 leading-relaxed"
              />
            </div>
          </>
        )}

        {currentCheckIn?.managerComment && (
          <div className="flex items-start gap-2.5 text-xs text-blue-400 bg-blue-500/5 px-3 py-3 rounded-lg border border-blue-500/15 leading-relaxed">
            <MessageSquare size={14} className="mt-0.5 shrink-0" />
            <div>
              <span className="block text-[9px] font-bold uppercase tracking-wider mb-1 opacity-90 text-blue-300">Manager Sign-off Feedback</span>
              <p className="text-zinc-350 text-xs leading-relaxed">{currentCheckIn.managerComment}</p>
            </div>
          </div>
        )}

        {!readOnly && (
          <div className="flex justify-end pt-2">
            <button 
              onClick={handleSave}
              disabled={!hasChanges || isPending}
              className="px-4 py-2 text-xs bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-900 disabled:text-zinc-600 border border-transparent disabled:border-zinc-950 text-white rounded-lg transition-all font-bold flex items-center gap-1.5 active:scale-[0.98] shadow-lg shadow-blue-900/10"
              type="button"
            >
              <Save size={14} /> {isPending ? "Saving..." : "Save Update"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
