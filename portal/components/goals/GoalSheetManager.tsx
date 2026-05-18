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
import Link from "next/link";

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

  const isHistorical = sheet.quarter !== activePeriod && sheet.quarter !== planningPeriod;

  // Calculate historical performance score
  let historicalScore = 0;
  if (isHistorical && sheet.goals.length > 0) {
    let totalWeightedScore = 0;
    let totalWeightage = 0;
    
    sheet.goals.forEach(goal => {
      const checkIn = goal.checkIns?.find((c: any) => c.period === sheet.quarter);
      const score = checkIn 
        ? (checkIn.progressScore ?? 0) 
        : (goal.status === "COMPLETED" ? 100 : (goal.status === "ON_TRACK" ? 75 : 0));
        
      totalWeightedScore += score * goal.weightage;
      totalWeightage += goal.weightage;
    });
    
    historicalScore = totalWeightage > 0 
      ? Math.round(totalWeightedScore / totalWeightage) 
      : 0;
  }

  if (sheet.status !== "DRAFT") {
    return (
      <div className="space-y-6">
        {isHistorical ? (
          <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden shadow-xl animate-in fade-in-50 duration-300">
            {/* Ambient Background Gradient */}
            <div className="absolute top-0 right-0 w-[180px] h-[180px] bg-blue-500/5 rounded-full blur-[80px] pointer-events-none"></div>
            
            <div className="space-y-2 relative z-10">
              <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[10px] font-bold uppercase rounded tracking-wider">
                Q1 Historical Cycle Locked
              </span>
              <h3 className="text-xl font-bold text-zinc-100 tracking-tight">Performance Summary</h3>
              <p className="text-xs text-zinc-400 max-w-md">
                This goal sheet represents locked historical operational data. Progress updates and achievements have been finalized by audit log consensus.
              </p>
            </div>
            
            <div className="flex items-center gap-4 shrink-0 relative z-10">
              <div className="text-right">
                <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">Final Execution Score</span>
                <p className="text-3xl font-extrabold text-blue-400 font-mono tracking-tight">{historicalScore}%</p>
              </div>
              <div className="h-12 w-[1px] bg-zinc-800"></div>
              <div>
                <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">Status</span>
                <div className="mt-1 px-2.5 py-0.5 bg-zinc-800 text-zinc-400 border border-zinc-700/60 text-xs font-semibold rounded uppercase tracking-wider">
                  Archived
                </div>
              </div>
            </div>
          </div>
        ) : (
          <WeightageProgress current={currentWeightage} />
        )}

        {!isHistorical && (
          <div className="flex items-center justify-between p-4 rounded-xl border bg-emerald-500/5 border-emerald-500/10">
            <span className="text-sm font-medium text-zinc-300">
              Goal Sheet Quarter: <strong className="text-emerald-400">{sheet.quarter}</strong>
            </span>
            <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded uppercase tracking-wider">
              {sheet.status}
            </span>
          </div>
        )}

        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-zinc-100">Your Goals ({sheet.goals.length})</h2>
            {sheet.status === "LOCKED" && !activePeriod && !isHistorical && (
              <span className="text-xs font-medium bg-zinc-800 text-zinc-400 px-3 py-1 rounded-full border border-zinc-700">Check-in Window Closed</span>
            )}
            {isHistorical && (
              <span className="text-xs font-medium bg-zinc-900/50 text-zinc-500 px-3 py-1 rounded-full border border-zinc-800/80">Archived Record</span>
            )}
          </div>
          <div className="flex flex-col gap-3">
            {sheet.goals.map((goal) => {
              // Historical goals render Q1 check-ins read-only
              if (isHistorical) {
                return (
                  <div key={goal.id} className="relative">
                    {goal.goalType === "SHARED" && (
                      <div className="absolute -top-3 right-4 z-20">
                        <span className="px-2 py-0.5 bg-blue-500 text-white text-[10px] uppercase tracking-wider font-semibold rounded shadow-sm">Shared KPI</span>
                      </div>
                    )}
                    <CheckInCard goal={goal} activePeriod={sheet.quarter} readOnly={true} />
                  </div>
                );
              }

              // Active goals render Q2 check-ins editably
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
          
          {!isHistorical && sheet.status === "LOCKED" && planningPeriod && sheet.quarter !== planningPeriod && !sheet.unlockRequested && !showUnlockModal && (
            <div className="mt-8 p-5 bg-amber-500/5 border border-amber-500/20 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h4 className="text-amber-400 font-semibold flex items-center gap-1.5 text-sm">
                  <Unlock size={16} /> {planningPeriod} Goal Planning Window is Open
                </h4>
                <p className="text-xs text-zinc-400 mt-1 max-w-xl">
                  Please use your separate dedicated Goal Planning Workspace (Q3 sheet) to prepare goals for the upcoming cycle phase, keeping this {sheet.quarter} operational sheet locked for check-ins.
                </p>
              </div>
              <Link
                href="/goals/draft?tab=planning"
                className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-md transition-colors font-semibold text-xs shrink-0 shadow-md"
              >
                Go to Planning Workspace &rarr;
              </Link>
            </div>
          )}

          {!isHistorical && sheet.status === "LOCKED" && !planningPeriod && !sheet.unlockRequested && !showUnlockModal && (
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

      <div className="flex items-center justify-between p-4 bg-blue-500/5 border border-blue-500/10 rounded-xl">
        <span className="text-sm font-medium text-zinc-300">
          Currently Planning Goals for: <strong className="text-blue-400">{sheet.quarter}</strong>
        </span>
        <span className="px-2 py-0.5 text-[10px] font-bold bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded uppercase tracking-wider">Planning Open</span>
      </div>

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
