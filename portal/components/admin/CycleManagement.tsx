"use client";

import { GoalCycle } from "@prisma/client";
import { useState, useTransition } from "react";
import { createGoalCycle, setActiveCycle, setPlanningQuarter } from "@/app/actions/adminActions";
import { Settings, Play, CheckCircle, Info } from "lucide-react";

export function CycleManagement({
  cycles,
  activeCycle,
}: {
  cycles: GoalCycle[];
  activeCycle?: GoalCycle | null;
}) {
  const [isPending, startTransition] = useTransition();
  const [showForm, setShowForm] = useState(false);
  const [newCycle, setNewCycle] = useState({ name: "", startDate: "", endDate: "" });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCycle.name || !newCycle.startDate || !newCycle.endDate) return;
    startTransition(async () => {
      const res = await createGoalCycle(
        newCycle.name,
        new Date(newCycle.startDate),
        new Date(newCycle.endDate)
      );
      if (res.success) {
        setNewCycle({ name: "", startDate: "", endDate: "" });
        setShowForm(false);
      } else {
        alert(res.message);
      }
    });
  };

  const handleActivateCycle = (id: string) => {
    if (confirm("Activating this cycle will deactivate all others. Continue?")) {
      startTransition(async () => {
        await setActiveCycle(id);
      });
    }
  };

  const handleSetPlanningQuarter = (quarter: string | null) => {
    if (!activeCycle) return;
    startTransition(async () => {
      await setPlanningQuarter(activeCycle.id, quarter as any);
    });
  };

  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5 sticky top-24">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
          <Settings size={15} className="text-zinc-400" />
          Cycle Management
        </h3>
        <button
          onClick={() => setShowForm(!showForm)}
          className="text-xs font-medium text-blue-400 hover:text-blue-300 transition-colors"
        >
          {showForm ? "Cancel" : "+ New Cycle"}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleCreate}
          className="space-y-3 mb-5 p-4 bg-zinc-950 border border-zinc-800 rounded-lg"
        >
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1">Cycle Name</label>
            <input
              required
              type="text"
              placeholder="e.g. FY 2026-2027"
              value={newCycle.name}
              onChange={(e) => setNewCycle({ ...newCycle, name: e.target.value })}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-md px-3 py-1.5 text-sm text-zinc-100 focus:border-blue-500 outline-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">Start Date</label>
              <input
                required
                type="date"
                value={newCycle.startDate}
                onChange={(e) => setNewCycle({ ...newCycle, startDate: e.target.value })}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-md px-3 py-1.5 text-sm text-zinc-100 focus:border-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">End Date</label>
              <input
                required
                type="date"
                value={newCycle.endDate}
                onChange={(e) => setNewCycle({ ...newCycle, endDate: e.target.value })}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-md px-3 py-1.5 text-sm text-zinc-100 focus:border-blue-500 outline-none"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={isPending}
            className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-md text-sm font-medium transition-colors"
          >
            {isPending ? "Creating..." : "Save Cycle"}
          </button>
        </form>
      )}

      {activeCycle && (
        <div className="mb-5 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg space-y-4">
          <div>
            <h4 className="text-xs font-bold text-blue-400 flex items-center gap-1.5 uppercase tracking-wider">
              <CheckCircle size={13} /> Active Cycle
            </h4>
            <p className="text-zinc-100 font-medium mt-1">{activeCycle.name}</p>
          </div>

          {/* Execution quarter — calendar automatic */}
          <div className="pt-3 border-t border-blue-500/20 space-y-1.5">
            <div className="flex items-center gap-1.5">
              <label className="text-[10px] font-bold text-blue-400/80 uppercase tracking-wider">
                Execution Quarter
              </label>
              <Info size={11} className="text-blue-400/50" />
            </div>
            <div className="px-3 py-2 bg-zinc-950/60 border border-blue-500/20 rounded-md text-xs text-zinc-400 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Calendar-Driven Automatically (BRD Schedule)
            </div>
            <p className="text-[10px] text-blue-400/50 leading-relaxed">
              The execution quarter is automatically determined by the calendar date per the BRD schedule. No manual override required.
            </p>
          </div>

          {/* Planning quarter — manual admin control */}
          <div className="pt-3 border-t border-blue-500/20 space-y-1.5">
            <label className="block text-[10px] font-bold text-blue-400/80 uppercase tracking-wider">
              Planning Window (Manual Control)
            </label>
            <select
              value={(activeCycle as any).planningQuarter ?? ""}
              onChange={(e) => handleSetPlanningQuarter(e.target.value || null)}
              disabled={isPending}
              className="w-full bg-zinc-950 border border-blue-500/30 rounded-md px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-blue-500"
            >
              <option value="">Planning Closed (No Active Planning)</option>
              <option value="Q1">Q1 Goal Planning</option>
              <option value="Q2">Q2 Goal Planning</option>
              <option value="Q3">Q3 Goal Planning</option>
              <option value="Q4_ANNUAL">Q4 / Annual Planning</option>
            </select>
            <p className="text-[10px] text-blue-400/50 leading-relaxed">
              Opening planning allows employees to draft goals for the selected quarter simultaneously with execution.
            </p>
          </div>
        </div>
      )}

      <div className="space-y-2">
        <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-3">All Cycles</h4>
        {cycles.map((cycle) => (
          <div
            key={cycle.id}
            className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
              cycle.isActive
                ? "border-zinc-700 bg-zinc-800/50"
                : "border-zinc-800 hover:bg-zinc-800/30"
            }`}
          >
            <div>
              <p className={`text-sm font-medium ${cycle.isActive ? "text-zinc-100" : "text-zinc-400"}`}>
                {cycle.name}
              </p>
              <p className="text-xs text-zinc-500 mt-0.5">
                {new Date(cycle.startDate).getFullYear()} — {new Date(cycle.endDate).getFullYear()}
              </p>
            </div>
            {!cycle.isActive && (
              <button
                onClick={() => handleActivateCycle(cycle.id)}
                disabled={isPending}
                className="p-1.5 text-zinc-400 hover:text-emerald-400 hover:bg-emerald-400/10 rounded-md transition-colors"
                title="Set as Active Cycle"
              >
                <Play size={13} />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
