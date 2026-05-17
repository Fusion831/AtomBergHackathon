"use client";

import { GoalSheet, Goal } from "@prisma/client";
import { useTransition, useState } from "react";
import { submitGoalSheet, requestUnlock } from "@/app/actions/sheetActions";
import { WeightageProgress } from "@/components/goals/WeightageProgress";
import { GoalForm } from "@/components/goals/GoalForm";
import { GoalList } from "@/components/goals/GoalList";
import { Plus, AlertTriangle, Unlock } from "lucide-react";
import { CheckInCard } from "@/components/checkins/CheckInCard";
import { CheckInPeriod } from "@prisma/client";

type SheetWithGoals = GoalSheet & { goals: any[] };

export function GoalSheetManager({ 
  sheet, 
  activePeriod, 
  planningPeriod 
}: { 
  sheet: SheetWithGoals; 
  activePeriod?: CheckInPeriod; 
  planningPeriod?: CheckInPeriod; 
}) {
  const [isPending, startTransition] = useTransition();
  const [showForm, setShowForm] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [unlockReason, setUnlockReason] = useState("");

  const currentWeightage = sheet.goals.reduce((acc, g) => acc + g.weightage, 0);
  const isReadyToSubmit = currentWeightage === 100 && sheet.goals.length > 0 && sheet.goals.length <= 8;

  const handleSubmitSheet = () => {
    if (!isReadyToSubmit) return;
    startTransition(async () => {
      const res = await submitGoalSheet(sheet.id);
      if (!res.success) {
        alert(res.message);
        setIsConfirming(false);
      }
    });
  };

  const handleEdit = (goal: Goal) => {
    setEditingGoal(goal);
    setShowForm(true);
  };

  const handleRequestUnlock = () => {
    if (!unlockReason.trim()) {
      alert("Please provide a reason for the unlock request.");
      return;
    }
    startTransition(async () => {
      const res = await requestUnlock(sheet.id, unlockReason);
      if (res.success) {
        setShowUnlockModal(false);
      } else {
        alert(res.message);
      }
    });
  };

  if (sheet.status !== "DRAFT") {
    return (
      <div className="space-y-6">
        <WeightageProgress current={currentWeightage} />
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-zinc-100">Your Goals ({sheet.goals.length})</h2>
            {sheet.status === "LOCKED" && !activePeriod && (
              <span className="text-xs font-medium bg-zinc-800 text-zinc-400 px-3 py-1 rounded-full border border-zinc-700">Check-in Window Closed</span>
            )}
          </div>
          <div className="flex flex-col gap-3">
            {sheet.goals.map((goal) => {
              if (sheet.status === "LOCKED" && activePeriod) {
                return (
                  <div key={goal.id} className="relative">
                    {goal.goalType === "SHARED" && (
                      <div className="absolute -top-3 right-4 z-20">
                        <span className="px-2 py-0.5 bg-blue-500 text-white text-[10px] uppercase tracking-wider font-semibold rounded shadow-sm">Shared KPI</span>
                      </div>
                    )}
                    <CheckInCard goal={goal} activePeriod={activePeriod} />
                  </div>
                );
              }
              return (
              <div key={goal.id} className={`flex flex-col gap-4 p-5 bg-zinc-900/40 border ${goal.goalType === "SHARED" ? 'border-blue-500/30' : 'border-zinc-800'} rounded-xl relative overflow-hidden`}>
                {goal.goalType === "SHARED" && (
                  <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                    <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                  </div>
                )}
                <div className="space-y-1 relative z-10">
                  {goal.goalType === "SHARED" && (
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[10px] uppercase tracking-wider font-semibold rounded">Shared KPI</span>
                    </div>
                  )}
                  <h4 className="text-base font-medium text-zinc-100">{goal.title}</h4>
                  {goal.description && <p className="text-sm text-zinc-400">{goal.description}</p>}
                </div>
                <div className="flex flex-wrap items-center gap-4 pt-3 border-t border-zinc-800/50 relative z-10">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-amber-400 bg-amber-400/10 px-2.5 py-1 rounded-md">
                    {goal.weightage}% Weight
                  </div>
                  <div className="flex items-center gap-1.5 text-xs font-medium text-zinc-400 bg-zinc-800 px-2.5 py-1 rounded-md">
                    {goal.thrustArea}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs font-medium text-zinc-400 bg-zinc-800 px-2.5 py-1 rounded-md">
                    {goal.uomType} {goal.targetValue !== null ? `(${goal.targetValue})` : ''}
                  </div>
                </div>
              </div>
            )})}
          </div>
          
          {sheet.status === "LOCKED" && planningPeriod && !sheet.unlockRequested && !showUnlockModal && (
            <div className="mt-8 p-5 bg-amber-500/5 border border-amber-500/20 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h4 className="text-amber-400 font-semibold flex items-center gap-1.5 text-sm">
                  <Unlock size={16} /> {planningPeriod} Goal Planning Window is Open
                </h4>
                <p className="text-xs text-zinc-400 mt-1 max-w-xl">
                  You can prepare or adjust your targets/weights for the upcoming cycle phase. Request an executive override unlock from your administrator to edit this locked sheet for planning.
                </p>
              </div>
              <button
                onClick={() => {
                  setUnlockReason(`Adjusting targets/weightages for the upcoming ${planningPeriod} planning period.`);
                  setShowUnlockModal(true);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-md transition-colors font-semibold text-xs shrink-0 shadow-md"
              >
                <Unlock size={14} /> Unlock for Planning
              </button>
            </div>
          )}

          {sheet.status === "LOCKED" && !planningPeriod && !sheet.unlockRequested && !showUnlockModal && (
            <div className="mt-8 flex justify-end">
              <button
                onClick={() => {
                  setUnlockReason("");
                  setShowUnlockModal(true);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-amber-600/10 text-amber-500 hover:bg-amber-600/20 border border-amber-600/20 rounded-md transition-colors font-medium text-sm"
              >
                <Unlock size={16} /> Request Unlock
              </button>
            </div>
          )}

          {sheet.status === "LOCKED" && sheet.unlockRequested && (
            <div className="mt-8 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-start gap-3">
              <Unlock className="text-amber-500 mt-0.5" size={20} />
              <div>
                <h4 className="text-amber-500 font-medium">Unlock Requested</h4>
                <p className="text-sm text-zinc-400 mt-1">You have requested the Admin to unlock this sheet. Reason: "{sheet.unlockReason}"</p>
              </div>
            </div>
          )}

          {showUnlockModal && (
            <div className="mt-8 p-5 bg-zinc-900 border border-zinc-800 rounded-xl">
              <h3 className="text-lg font-medium text-zinc-100 mb-2">Request Admin Unlock</h3>
              <p className="text-sm text-zinc-400 mb-4">
                Since this sheet is fully approved and locked, any changes require Administrator approval. Please provide a clear business justification for why these goals need to be modified mid-cycle.
              </p>
              <textarea
                value={unlockReason}
                onChange={(e) => setUnlockReason(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-md text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-amber-500 h-24 resize-none mb-4"
                placeholder="Reason for requesting unlock..."
              />
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowUnlockModal(false)}
                  disabled={isPending}
                  className="px-4 py-2 text-sm font-medium text-zinc-400 hover:text-zinc-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRequestUnlock}
                  disabled={isPending || !unlockReason.trim()}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white text-sm font-medium rounded-md transition-colors"
                >
                  {isPending ? "Submitting..." : "Submit Request"}
                </button>
              </div>
            </div>
          )}
        </div>
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
            onClick={() => { setEditingGoal(null); setShowForm(true); setIsConfirming(false); }}
            className="flex items-center gap-2 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 text-sm font-medium rounded-md transition-colors"
          >
            <Plus className="w-4 h-4" /> Add Goal
          </button>
        )}
      </div>

      {showForm ? (
        <GoalForm 
          sheetId={sheet.id} 
          initialData={(editingGoal as any) || undefined} 
          onSuccess={() => { setShowForm(false); setEditingGoal(null); }}
          onCancel={() => { setShowForm(false); setEditingGoal(null); }}
        />
      ) : (
        <GoalList goals={sheet.goals} sheetId={sheet.id} onEdit={handleEdit} />
      )}

      {!showForm && (
        <div className="flex flex-col items-end pt-4 border-t border-zinc-800/50">
          {isConfirming ? (
            <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg flex flex-col items-end max-w-md w-full">
              <div className="flex gap-3 mb-4 w-full">
                <AlertTriangle className="text-amber-500 shrink-0 mt-0.5" size={20} />
                <div>
                  <h4 className="text-amber-500 font-medium text-sm">Ready to submit?</h4>
                  <p className="text-zinc-400 text-sm mt-1">Once submitted, your goals will be locked for manager review. You won't be able to edit them unless returned for rework.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setIsConfirming(false)}
                  disabled={isPending}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm font-medium rounded-md transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitSheet}
                  disabled={isPending}
                  className="px-6 py-2 bg-amber-600 hover:bg-amber-500 text-white text-sm font-medium rounded-md transition-colors flex items-center gap-2"
                >
                  {isPending ? "Submitting..." : "Yes, Submit to Manager"}
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setIsConfirming(true)}
              disabled={!isReadyToSubmit}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-800 disabled:text-zinc-500 text-white font-medium rounded-md transition-colors flex items-center gap-2"
            >
              Submit Goal Sheet
            </button>
          )}
        </div>
      )}
    </div>
  );
}
