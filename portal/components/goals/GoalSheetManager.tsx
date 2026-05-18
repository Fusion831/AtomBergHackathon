"use client";

import { GoalSheet, Goal, CheckIn, CheckInPeriod } from "@prisma/client";
import { useTransition, useState } from "react";
import { submitGoalSheet, requestUnlock } from "@/app/actions/sheetActions";
import { WeightageProgress } from "@/components/goals/WeightageProgress";
import { GoalForm } from "@/components/goals/GoalForm";
import { GoalList } from "@/components/goals/GoalList";
import { Plus, AlertTriangle, Unlock, Users, Calendar } from "lucide-react";
import { CheckInCard } from "@/components/checkins/CheckInCard";
import Link from "next/link";

type GoalWithCheckIns = Goal & { checkIns: CheckIn[] };
type SheetWithGoals = GoalSheet & { goals: GoalWithCheckIns[] };

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
      const checkIn = goal.checkIns?.find((c: CheckIn) => c.period === sheet.quarter);
      const score = checkIn 
        ? (checkIn.progressScore ?? 0) 
        : (goal.status === "COMPLETED" ? 100 : (goal.status === "IN_PROGRESS" ? 75 : 0));
        
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
          <div className="p-6 bg-zinc-900/40 border border-zinc-900 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden shadow-xl animate-in fade-in-50 duration-300">
            {/* Ambient Background Gradient */}
            <div className="absolute top-0 right-0 w-[180px] h-[180px] bg-blue-500/5 rounded-full blur-[80px] pointer-events-none"></div>
            
            <div className="space-y-2 relative z-10 select-none">
              <span className="px-2.5 py-0.5 bg-zinc-950 text-zinc-400 border border-zinc-900 text-[9px] font-bold uppercase rounded-md tracking-wider">
                Historical Record Finalized
              </span>
              <h3 className="text-base font-bold text-zinc-100 tracking-tight">Performance Summary</h3>
              <p className="text-xs text-zinc-500 max-w-md leading-relaxed">
                This Quarter Plan represents locked historical operational data. Progress updates and achievements have been finalized by audit log consensus.
              </p>
            </div>
            
            <div className="flex items-center gap-6 shrink-0 relative z-10 select-none">
              <div className="text-right">
                <span className="text-[10px] text-zinc-550 uppercase tracking-wider font-semibold">Final Score</span>
                <p className="text-3xl font-extrabold text-blue-400 font-mono tracking-tight">{historicalScore}%</p>
              </div>
              <div className="h-10 w-[1px] bg-zinc-900"></div>
              <div>
                <span className="text-[10px] text-zinc-550 uppercase tracking-wider font-semibold">Status</span>
                <div className="mt-1 px-2.5 py-0.5 bg-zinc-950 text-zinc-400 border border-zinc-900 text-[10px] font-bold rounded-full uppercase tracking-wider">
                  Archived
                </div>
              </div>
            </div>
          </div>
        ) : (
          <WeightageProgress current={currentWeightage} />
        )}

        {!isHistorical && (
          <div className="flex items-center justify-between p-4 rounded-xl border bg-zinc-950/20 border-zinc-900 select-none">
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-zinc-400">
                Quarter Plan: <strong className="text-blue-400 font-semibold">{sheet.quarter}</strong>
              </span>
              <span className={`px-2 py-0.5 text-[9px] font-bold rounded-full border uppercase tracking-wider ${
                sheet.status === "APPROVED" || sheet.status === "LOCKED" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-amber-500/10 text-amber-400 border-amber-500/20"
              }`}>
                {sheet.status === "APPROVED" || sheet.status === "LOCKED" ? "Finalized" : "Awaiting Approval"}
              </span>
              {sheet.status === "LOCKED" && sheet.unlockRequested && (
                <span className="px-2 py-0.5 text-[9px] font-bold bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-full uppercase tracking-wider animate-pulse flex items-center gap-1">
                  <Unlock size={10} /> Unlock Pending
                </span>
              )}
            </div>
            {sheet.status === "LOCKED" && !sheet.unlockRequested && !showUnlockModal && (
              <button
                type="button"
                onClick={() => {
                  setUnlockReason("");
                  setShowUnlockModal(true);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border border-amber-500/20 rounded-lg transition-all font-bold text-xs cursor-pointer active:scale-[0.98]"
              >
                <Unlock size={12} /> Request Unlock
              </button>
            )}
          </div>
        )}

        <div>
          <div className="flex items-center justify-between mb-4 select-none">
            <h2 className="text-sm font-bold text-zinc-450 uppercase tracking-wider">Plan Performance Goals ({sheet.goals.length})</h2>
            {sheet.status === "LOCKED" && !activePeriod && !isHistorical && (
              <span className="text-xs font-medium bg-zinc-950 text-zinc-500 px-3 py-1 rounded-full border border-zinc-900">Check-in Window Closed</span>
            )}
            {isHistorical && (
              <span className="text-xs font-medium bg-zinc-950 text-zinc-500 px-3 py-1 rounded-full border border-zinc-900">Archived Record</span>
            )}
          </div>
          
          <div className="flex flex-col gap-3">
            {sheet.goals.map((goal) => {
              // Historical goals render Q1 performance updates read-only
              if (isHistorical) {
                return (
                  <div key={goal.id} className="relative">
                    {goal.goalType === "SHARED" && (
                      <div className="absolute -top-3 right-4 z-20 select-none">
                        <span className="px-2 py-0.5 bg-violet-500/10 text-violet-400 border border-violet-500/20 text-[9px] uppercase tracking-wider font-semibold rounded-md shadow-sm flex items-center gap-1">
                          <Users size={10} /> Cascaded Goal
                        </span>
                      </div>
                    )}
                    <CheckInCard goal={goal} activePeriod={sheet.quarter} readOnly={true} />
                  </div>
                );
              }

              // Active goals render Q2 performance updates editably
              if (sheet.status === "LOCKED" && activePeriod) {
                return (
                  <div key={goal.id} className="relative">
                    {goal.goalType === "SHARED" && (
                      <div className="absolute -top-3 right-4 z-20 select-none">
                        <span className="px-2 py-0.5 bg-violet-500/10 text-violet-400 border border-violet-500/20 text-[9px] uppercase tracking-wider font-semibold rounded-md shadow-sm flex items-center gap-1">
                          <Users size={10} /> Cascaded Goal
                        </span>
                      </div>
                    )}
                    <CheckInCard goal={goal} activePeriod={activePeriod} />
                  </div>
                );
              }
              return (
                <div key={goal.id} className={`flex flex-col gap-4 p-5 bg-zinc-900/40 border ${goal.goalType === "SHARED" ? 'border-violet-500/25 bg-violet-950/5' : 'border-zinc-900'} rounded-xl relative overflow-hidden`}>
                  {goal.goalType === "SHARED" && (
                    <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                      <Users size={80} />
                    </div>
                  )}
                  <div className="space-y-1.5 relative z-10 flex-1 min-w-0">
                    {goal.goalType === "SHARED" && (
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="px-2 py-0.5 bg-violet-500/10 text-violet-400 border border-violet-500/20 text-[9px] uppercase tracking-wider font-semibold rounded flex items-center gap-1">
                          <Users size={10} /> Cascaded Goal
                        </span>
                      </div>
                    )}
                    <h4 className="text-sm font-semibold text-zinc-150">{goal.title}</h4>
                    {goal.description && <p className="text-xs text-zinc-450 leading-relaxed">{goal.description}</p>}
                  </div>
                  
                  {/* Right side aligned contribution metadata bar */}
                  <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-zinc-950/40 text-[10px] font-semibold text-zinc-400 relative z-10 select-none">
                    <div className="flex items-center gap-1 bg-zinc-950/80 px-2 py-1 border border-zinc-900 rounded-md text-amber-500/90 font-mono">
                      <span>Contribution: {goal.weightage}%</span>
                    </div>
                    <div className="flex items-center gap-1 bg-zinc-950/80 px-2 py-1 border border-zinc-900 rounded-md">
                      <span>{goal.thrustArea}</span>
                    </div>
                    <div className="flex items-center gap-1 bg-zinc-950/80 px-2 py-1 border border-zinc-900 rounded-md">
                      <span>{goal.uomType === "NUMERIC" ? "Numeric" : goal.uomType === "PERCENTAGE" ? "Percentage" : "Zero-Based"} {goal.targetValue !== null ? `(${goal.targetValue})` : ''}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          
          {!isHistorical && sheet.status === "LOCKED" && planningPeriod && sheet.quarter !== planningPeriod && !sheet.unlockRequested && !showUnlockModal && (
            <div className="mt-8 p-5 bg-blue-500/5 border border-blue-500/20 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4 select-none">
              <div>
                <h4 className="text-blue-400 font-semibold flex items-center gap-1.5 text-xs">
                  <Calendar size={14} /> Goal Planning Window Open for {planningPeriod}
                </h4>
                <p className="text-[11px] text-zinc-400 mt-1 max-w-xl leading-relaxed">
                  Please use your separate Goal Planning tab to draft goals for the upcoming quarter, keeping this Current Quarter Progress plan locked for performance updates.
                </p>
              </div>
              <Link
                href="/goals/draft?tab=planning"
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors font-bold text-xs shrink-0 shadow-md active:scale-[0.98]"
              >
                Go to Planning &rarr;
              </Link>
            </div>
          )}

          {sheet.status === "LOCKED" && sheet.unlockRequested && (
            <div className="mt-8 p-4 bg-amber-500/5 border border-amber-500/20 rounded-xl flex items-start gap-3 select-none">
              <Unlock className="text-amber-550 mt-0.5 shrink-0" size={18} />
              <div>
                <h4 className="text-xs font-bold text-amber-500">Unlock Request Pending</h4>
                <p className="text-xs text-zinc-400 mt-1 leading-relaxed">You requested an administrative unlock. Business justification: <strong className="text-zinc-200 font-medium">"{sheet.unlockReason}"</strong></p>
              </div>
            </div>
          )}

          {showUnlockModal && (
            <div className="mt-8 p-5 bg-zinc-900 border border-zinc-900 rounded-xl shadow-2xl animate-fade-in select-none">
              <h3 className="text-sm font-bold text-zinc-150 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Unlock size={14} className="text-amber-500" /> Request Plan Unlock
              </h3>
              <p className="text-xs text-zinc-550 mb-4 leading-relaxed">
                Since this plan is approved and active, changes require authorization. Please provide a clear business justification for your request.
              </p>
              <textarea
                value={unlockReason}
                onChange={(e) => setUnlockReason(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-900 rounded-lg text-xs text-zinc-200 placeholder:text-zinc-650 focus:outline-none focus:ring-1 focus:ring-amber-500 h-20 resize-none mb-4 leading-relaxed"
                placeholder="Brief justification..."
              />
              <div className="flex justify-end gap-3 text-xs font-semibold">
                <button
                  onClick={() => setShowUnlockModal(false)}
                  disabled={isPending}
                  className="px-4 py-2 text-zinc-550 hover:text-zinc-350 transition-colors"
                  type="button"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRequestUnlock}
                  disabled={isPending || !unlockReason.trim()}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white rounded-lg transition-all duration-200 active:scale-[0.98]"
                  type="button"
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
      {/* Target Contribution Indicator */}
      <WeightageProgress current={currentWeightage} />

      <div className="flex items-center justify-between p-4 bg-blue-500/5 border border-blue-500/15 rounded-xl select-none">
        <span className="text-xs font-semibold text-zinc-400">
          Currently Planning Goals for: <strong className="text-blue-400">{sheet.quarter}</strong>
        </span>
        <span className="px-2 py-0.5 text-[9px] font-bold bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-full uppercase tracking-wider">Planning Window Open</span>
      </div>

      <div className="flex items-center justify-between select-none">
        <h2 className="text-xs font-bold text-zinc-450 uppercase tracking-wider">Drafted Performance Goals ({sheet.goals.length}/8)</h2>
        {!showForm && sheet.goals.length < 8 && (
          <button 
            onClick={() => { setEditingGoal(null); setShowForm(true); setIsConfirming(false); }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-850 hover:border-zinc-800 text-xs font-semibold rounded-lg transition-all active:scale-[0.98]"
            type="button"
          >
            <Plus className="w-3.5 h-3.5 text-blue-400" /> Add Goal
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
        <div className="flex flex-col items-end pt-4 border-t border-zinc-900/60 select-none">
          {isConfirming ? (
            <div className="p-5 bg-zinc-900 border border-zinc-900 rounded-xl flex flex-col items-end max-w-md w-full shadow-2xl animate-fade-in">
              <div className="flex gap-3 mb-4 w-full text-xs">
                <AlertTriangle className="text-amber-500 shrink-0 mt-0.5 animate-pulse" size={18} />
                <div>
                  <h4 className="text-amber-500 font-bold">Ready to Submit Quarter Plan?</h4>
                  <p className="text-zinc-500 mt-1 leading-relaxed">Once submitted, your goals will be locked for review. You won't be able to edit them unless returned by your manager.</p>
                </div>
              </div>
              <div className="flex gap-3 text-xs font-semibold">
                <button
                  onClick={() => setIsConfirming(false)}
                  disabled={isPending}
                  className="px-4 py-2 text-zinc-500 hover:text-zinc-350 transition-colors"
                  type="button"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitSheet}
                  disabled={isPending}
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg transition-all duration-200 flex items-center gap-1.5 active:scale-[0.98]"
                  type="button"
                >
                  {isPending ? "Submitting..." : "Yes, Submit for Review"}
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setIsConfirming(true)}
              disabled={!isReadyToSubmit}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-900 disabled:text-zinc-600 border border-transparent disabled:border-zinc-950 text-white text-xs font-bold rounded-lg transition-all active:scale-[0.98] shadow-lg shadow-emerald-900/20"
              type="button"
            >
              Submit Quarter Plan
            </button>
          )}
        </div>
      )}
    </div>
  );
}
