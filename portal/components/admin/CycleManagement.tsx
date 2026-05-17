"use client";

import { GoalCycle } from "@prisma/client";
import { useState, useTransition } from "react";
import { createGoalCycle, setActiveCycle, setActiveQuarter, setPlanningQuarter } from "@/app/actions/adminActions";
import { Settings, Play, CheckCircle } from "lucide-react";

export function CycleManagement({ cycles, activeCycle }: { cycles: GoalCycle[], activeCycle?: GoalCycle }) {
  const [isPending, startTransition] = useTransition();
  const [showForm, setShowForm] = useState(false);
  
  const [newCycle, setNewCycle] = useState({
    name: "",
    startDate: "",
    endDate: ""
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCycle.name || !newCycle.startDate || !newCycle.endDate) return;

    startTransition(async () => {
      const res = await createGoalCycle(newCycle.name, new Date(newCycle.startDate), new Date(newCycle.endDate));
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

  const handleSetQuarter = (quarter: string | null) => {
    if (!activeCycle) return;
    startTransition(async () => {
      await setActiveQuarter(activeCycle.id, quarter as any);
    });
  };

  const handleSetPlanningQuarter = (quarter: string | null) => {
    if (!activeCycle) return;
    startTransition(async () => {
      await setPlanningQuarter(activeCycle.id, quarter as any);
    });
  };

  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5 sticky top-24">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-medium text-zinc-100 flex items-center gap-2">
          <Settings size={18} className="text-zinc-400" /> Cycle Management
        </h3>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="text-xs font-medium text-blue-400 hover:text-blue-300"
        >
          {showForm ? "Cancel" : "+ New Cycle"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="space-y-4 mb-6 p-4 bg-zinc-950 border border-zinc-800 rounded-lg">
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1">Cycle Name</label>
            <input 
              required type="text" placeholder="e.g. FY 2026-2027"
              value={newCycle.name} onChange={e => setNewCycle({...newCycle, name: e.target.value})}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-md px-3 py-1.5 text-sm text-zinc-100 focus:border-blue-500 outline-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">Start Date</label>
              <input 
                required type="date"
                value={newCycle.startDate} onChange={e => setNewCycle({...newCycle, startDate: e.target.value})}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-md px-3 py-1.5 text-sm text-zinc-100 focus:border-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">End Date</label>
              <input 
                required type="date"
                value={newCycle.endDate} onChange={e => setNewCycle({...newCycle, endDate: e.target.value})}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-md px-3 py-1.5 text-sm text-zinc-100 focus:border-blue-500 outline-none"
              />
            </div>
          </div>
          <button type="submit" disabled={isPending} className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-md text-sm font-medium transition-colors">
            {isPending ? "Creating..." : "Save Cycle"}
          </button>
        </form>
      )}

      {activeCycle && (
        <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg space-y-4">
          <div className="flex justify-between items-start">
            <div>
              <h4 className="text-sm font-medium text-blue-400 flex items-center gap-1.5">
                <CheckCircle size={14} /> Active Cycle
              </h4>
              <p className="text-zinc-200 mt-1">{activeCycle.name}</p>
            </div>
          </div>
          
          <div className="pt-3 border-t border-blue-500/20">
            <label className="block text-xs font-medium text-blue-400/80 mb-2 uppercase tracking-wider">Active Check-in Window</label>
            <select 
              value={activeCycle.activeQuarter || ""}
              onChange={(e) => handleSetQuarter(e.target.value || null)}
              disabled={isPending}
              className="w-full bg-zinc-950 border border-blue-500/30 rounded-md px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-blue-500"
            >
              <option value="">Goal Setting Phase (Check-ins Closed)</option>
              <option value="Q1">Q1 Check-in</option>
              <option value="Q2">Q2 Check-in</option>
              <option value="Q3">Q3 Check-in</option>
              <option value="Q4_ANNUAL">Q4 / Annual Review</option>
            </select>
            <p className="text-xs text-blue-400/60 mt-2">Changing this will instantly open or close the check-in window across the organization.</p>
          </div>

          <div className="pt-3 border-t border-blue-500/20">
            <label className="block text-xs font-medium text-blue-400/80 mb-2 uppercase tracking-wider">Active Planning Window</label>
            <select 
              value={(activeCycle as any).planningQuarter || ""}
              onChange={(e) => handleSetPlanningQuarter(e.target.value || null)}
              disabled={isPending}
              className="w-full bg-zinc-950 border border-blue-500/30 rounded-md px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-blue-500"
            >
              <option value="">No Active Planning (Planning Closed)</option>
              <option value="Q1">Q1 Goal Planning</option>
              <option value="Q2">Q2 Goal Planning</option>
              <option value="Q3">Q3 Goal Planning</option>
              <option value="Q4_ANNUAL">Q4 / Annual Planning</option>
            </select>
            <p className="text-xs text-blue-400/60 mt-2">Changing this allows employees to simultaneously plan/adjust goals for the selected quarter.</p>
          </div>
        </div>
      )}

      <div className="space-y-2">
        <h4 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-3">All Cycles</h4>
        {cycles.map(cycle => (
          <div key={cycle.id} className={`flex items-center justify-between p-3 rounded-lg border ${cycle.isActive ? 'border-zinc-700 bg-zinc-800/50' : 'border-zinc-800 hover:bg-zinc-800/30'} transition-colors`}>
            <div>
              <p className={`text-sm font-medium ${cycle.isActive ? 'text-zinc-200' : 'text-zinc-400'}`}>{cycle.name}</p>
              <p className="text-xs text-zinc-500 mt-0.5">{new Date(cycle.startDate).getFullYear()} - {new Date(cycle.endDate).getFullYear()}</p>
            </div>
            {!cycle.isActive && (
              <button 
                onClick={() => handleActivateCycle(cycle.id)}
                disabled={isPending}
                className="p-1.5 text-zinc-400 hover:text-emerald-400 hover:bg-emerald-400/10 rounded-md transition-colors"
                title="Set as Active Cycle"
              >
                <Play size={14} />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
