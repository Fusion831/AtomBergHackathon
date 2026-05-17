"use client";

import { Department, User } from "@prisma/client";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Search } from "lucide-react";

interface DirectoryFiltersProps {
  isAdmin: boolean;
  departments: Department[];
  managers: User[];
  currentParams: { q?: string; status?: string; departmentId?: string; managerId?: string; quarter?: string };
}

export function DirectoryFilters({ isAdmin, departments, managers, currentParams }: DirectoryFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [q, setQ] = useState(currentParams.q || "");

  const updateFilters = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`/directory?${params.toString()}`);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateFilters("q", q);
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-6 sticky top-24">
      <form onSubmit={handleSearch}>
        <label className="block text-xs font-medium text-zinc-400 mb-1.5 uppercase tracking-wider">Search</label>
        <div className="relative">
          <input 
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Name, Email, or EmpID..."
            className="w-full bg-zinc-950 border border-zinc-700 rounded-md pl-9 pr-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-blue-500"
          />
          <Search size={16} className="absolute left-3 top-2.5 text-zinc-500" />
        </div>
      </form>

      <div>
        <label className="block text-xs font-medium text-zinc-400 mb-1.5 uppercase tracking-wider">Quarter Cycle</label>
        <select 
          value={currentParams.quarter || "Q2"}
          onChange={(e) => updateFilters("quarter", e.target.value)}
          className="w-full bg-zinc-950 border border-zinc-700 rounded-md px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-blue-500"
        >
          <option value="Q2">Q2 (Performance)</option>
          <option value="Q3">Q3 (Planning)</option>
          <option value="Q1">Q1 (Completed)</option>
        </select>
      </div>

      {isAdmin && (
        <>
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5 uppercase tracking-wider">Status</label>
            <select 
              value={currentParams.status || ""}
              onChange={(e) => updateFilters("status", e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-700 rounded-md px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-blue-500"
            >
              <option value="">All Statuses</option>
              <option value="DRAFT">In Draft</option>
              <option value="PENDING_APPROVAL">Pending Approval</option>
              <option value="LOCKED">Locked / Approved</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5 uppercase tracking-wider">Department</label>
            <select 
              value={currentParams.departmentId || ""}
              onChange={(e) => updateFilters("departmentId", e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-700 rounded-md px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-blue-500"
            >
              <option value="">All Departments</option>
              {departments.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5 uppercase tracking-wider">Manager</label>
            <select 
              value={currentParams.managerId || ""}
              onChange={(e) => updateFilters("managerId", e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-700 rounded-md px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-blue-500"
            >
              <option value="">All Managers</option>
              {managers.map(m => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>
        </>
      )}

      {/* For managers to just filter by status of their own team */}
      {!isAdmin && (
        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-1.5 uppercase tracking-wider">Status Filter</label>
          <select 
            value={currentParams.status || ""}
            onChange={(e) => updateFilters("status", e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-700 rounded-md px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-blue-500"
          >
            <option value="">All Statuses</option>
            <option value="DRAFT">In Draft</option>
            <option value="PENDING_APPROVAL">Pending Approval</option>
            <option value="LOCKED">Locked / Approved</option>
          </select>
        </div>
      )}

      {(currentParams.q || currentParams.status || currentParams.departmentId || currentParams.managerId) && (
        <button 
          onClick={() => router.push('/directory')}
          className="w-full py-2 text-sm font-medium text-zinc-400 hover:text-zinc-200 transition-colors"
        >
          Clear Filters
        </button>
      )}
    </div>
  );
}
