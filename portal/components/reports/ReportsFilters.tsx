"use client";

import { Department, GoalCycle, User } from "@prisma/client";
import { useState } from "react";
import { Download } from "lucide-react";

export function ReportsFilters({ isAdmin, cycles, departments, managers }: { isAdmin: boolean, cycles: GoalCycle[], departments: Department[], managers: User[] }) {
  const [cycleId, setCycleId] = useState(cycles.find(c => c.isActive)?.id || "");
  const [period, setPeriod] = useState("ALL");
  const [departmentId, setDepartmentId] = useState("");
  const [managerId, setManagerId] = useState("");

  const handleExport = () => {
    if (!cycleId) {
      alert("Please select a Goal Cycle to export.");
      return;
    }

    const params = new URLSearchParams();
    params.set("cycleId", cycleId);
    params.set("period", period);
    if (departmentId) params.set("departmentId", departmentId);
    if (managerId) params.set("managerId", managerId);

    window.location.href = `/api/export/goals?${params.toString()}`;
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-1.5">Goal Cycle *</label>
          <select 
            value={cycleId} onChange={e => setCycleId(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-700 rounded-md px-3 py-2.5 text-sm text-zinc-100 focus:outline-none focus:border-blue-500"
          >
            <option value="">Select Cycle...</option>
            {cycles.map(c => (
              <option key={c.id} value={c.id}>{c.name} {c.isActive ? "(Active)" : ""}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-1.5">Time Period</label>
          <select 
            value={period} onChange={e => setPeriod(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-700 rounded-md px-3 py-2.5 text-sm text-zinc-100 focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">All Periods</option>
            <option value="Q1">Q1</option>
            <option value="Q2">Q2</option>
            <option value="Q3">Q3</option>
            <option value="Q4_ANNUAL">Q4 / Annual</option>
          </select>
        </div>

        {isAdmin && (
          <>
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5">Department Filter</label>
              <select 
                value={departmentId} onChange={e => setDepartmentId(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-md px-3 py-2.5 text-sm text-zinc-100 focus:outline-none focus:border-blue-500"
              >
                <option value="">All Departments</option>
                {departments.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5">Manager Filter</label>
              <select 
                value={managerId} onChange={e => setManagerId(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-md px-3 py-2.5 text-sm text-zinc-100 focus:outline-none focus:border-blue-500"
              >
                <option value="">All Managers</option>
                {managers.map(m => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>
          </>
        )}
      </div>

      <div className="pt-4 border-t border-zinc-800 flex justify-end">
        <button 
          onClick={handleExport}
          className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-md transition-colors flex items-center gap-2"
        >
          <Download size={18} /> Download CSV Report
        </button>
      </div>
    </div>
  );
}
