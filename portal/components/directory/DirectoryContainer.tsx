"use client";

import { useState, useTransition, useDeferredValue } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Department, User as PrismaUser } from "@prisma/client";
import { Search, ChevronRight, User as UserIcon, Loader2 } from "lucide-react";
import Link from "next/link";

interface GoalSheetSummary {
  id: string;
  status: string;
  quarter: string;
  goals: Array<{
    id: string;
    checkIns: Array<{ id: string; period: string }>;
  }>;
}

interface DirectoryUser {
  id: string;
  name: string;
  email: string;
  empId: string | null;
  department: { name: string } | null;
  manager: { name: string } | null;
  goalSheets: GoalSheetSummary[];
}

interface DirectoryContainerProps {
  initialUsers: DirectoryUser[];
  departments: Department[];
  managers: PrismaUser[];
  currentParams: { q?: string; status?: string; departmentId?: string; managerId?: string; quarter?: string };
  isAdmin: boolean;
  activeCycle: { id: string; activeQuarter: string | null } | null;
}

export function DirectoryContainer({
  initialUsers,
  departments,
  managers,
  currentParams,
  isAdmin,
  activeCycle
}: DirectoryContainerProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // Local state for the search text so it is instant
  const [searchVal, setSearchVal] = useState(currentParams.q || "");

  const updateFilters = (updates: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });

    startTransition(() => {
      router.push(`/directory?${params.toString()}`);
    });
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateFilters({ q: searchVal });
  };

  const handleClearFilters = () => {
    setSearchVal("");
    startTransition(() => {
      router.push("/directory");
    });
  };

  return (
    <div className="flex flex-col md:flex-row gap-8 select-none">
      {/* Sidebar Filters */}
      <div className="w-full md:w-64 flex-shrink-0">
        <div className="bg-zinc-900/60 border border-zinc-900 rounded-xl p-5 space-y-6 sticky top-24">
          <form onSubmit={handleSearchSubmit}>
            <label className="block text-[10px] font-bold text-zinc-500 mb-1.5 uppercase tracking-wider">Search</label>
            <div className="relative">
              <input
                type="text"
                value={searchVal}
                onChange={(e) => setSearchVal(e.target.value)}
                placeholder="Name, Email, or EmpID..."
                className="w-full bg-zinc-950 border border-zinc-900 rounded-lg pl-9 pr-3 py-2 text-xs text-zinc-200 focus:outline-none focus:ring-1 focus:ring-blue-500/40"
              />
              <Search size={14} className="absolute left-3 top-2.5 text-zinc-600" />
            </div>
          </form>

          <div>
            <label className="block text-[10px] font-bold text-zinc-500 mb-1.5 uppercase tracking-wider">Quarter Cycle</label>
            <select
              value={currentParams.quarter || "Q2"}
              onChange={(e) => updateFilters({ quarter: e.target.value })}
              className="w-full bg-zinc-950 border border-zinc-900 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:ring-1 focus:ring-blue-500/40 cursor-pointer"
            >
              <option value="Q2">Q2 (Performance)</option>
              <option value="Q3">Q3 (Planning)</option>
              <option value="Q1">Q1 (Completed)</option>
            </select>
          </div>

          {isAdmin && (
            <>
              <div>
                <label className="block text-[10px] font-bold text-zinc-500 mb-1.5 uppercase tracking-wider">Status</label>
                <select
                  value={currentParams.status || ""}
                  onChange={(e) => updateFilters({ status: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-900 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:ring-1 focus:ring-blue-500/40 cursor-pointer"
                >
                  <option value="">All Statuses</option>
                  <option value="DRAFT">In Draft</option>
                  <option value="PENDING_APPROVAL">Pending Approval</option>
                  <option value="LOCKED">Locked / Approved</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-zinc-500 mb-1.5 uppercase tracking-wider">Department</label>
                <select
                  value={currentParams.departmentId || ""}
                  onChange={(e) => updateFilters({ departmentId: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-900 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:ring-1 focus:ring-blue-500/40 cursor-pointer"
                >
                  <option value="">All Departments</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-zinc-500 mb-1.5 uppercase tracking-wider">Manager</label>
                <select
                  value={currentParams.managerId || ""}
                  onChange={(e) => updateFilters({ managerId: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-900 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:ring-1 focus:ring-blue-500/40 cursor-pointer"
                >
                  <option value="">All Managers</option>
                  {managers.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}

          {(currentParams.q || currentParams.status || currentParams.departmentId || currentParams.managerId) && (
            <button
              onClick={handleClearFilters}
              className="w-full py-2 text-xs font-semibold text-zinc-500 hover:text-zinc-350 transition-colors border border-zinc-900 rounded-lg bg-zinc-950/20 active:scale-[0.98]"
              type="button"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Main Table View */}
      <div className="flex-1 space-y-4 relative min-h-[300px]">
        <div className="bg-zinc-900 border border-zinc-900 rounded-xl overflow-hidden shadow-xl">
          <div className="p-4 border-b border-zinc-950/60 bg-zinc-900/50 flex justify-between items-center">
            <span className="text-xs font-semibold text-zinc-400">Directory Results ({initialUsers.length})</span>
            {isPending && (
              <span className="flex items-center gap-1.5 text-blue-400 text-xs font-semibold">
                <Loader2 size={13} className="animate-spin" /> Querying...
              </span>
            )}
          </div>

          <div className={`transition-all duration-300 relative ${isPending ? "pointer-events-none" : ""}`}>
            {/* Shimmer overlay when isPending - keeps layout stable! */}
            {isPending && (
              <div className="absolute inset-0 bg-zinc-950/25 backdrop-blur-[1px] z-10 flex flex-col divide-y divide-zinc-900/50">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="p-5 flex items-center justify-between animate-pulse">
                    <div className="flex items-center gap-4 w-1/2">
                      <div className="w-10 h-10 rounded-full bg-zinc-900"></div>
                      <div className="space-y-2 w-3/4">
                        <div className="h-4 bg-zinc-900 rounded w-1/2"></div>
                        <div className="h-3 bg-zinc-900/60 rounded w-3/4"></div>
                      </div>
                    </div>
                    <div className="h-6 w-24 bg-zinc-900 rounded-full"></div>
                  </div>
                ))}
              </div>
            )}

            {initialUsers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
                <div className="w-12 h-12 bg-zinc-950 border border-zinc-900 rounded-full flex items-center justify-center mb-4 text-zinc-600">
                  <UserIcon size={20} />
                </div>
                <h3 className="text-zinc-400 font-semibold text-sm">No employees match criteria</h3>
                <p className="text-xs text-zinc-600 mt-1 max-w-sm">No records found. Try relaxing the search parameters or filter scopes.</p>
              </div>
            ) : (
              <div className="divide-y divide-zinc-950/60">
                {initialUsers.map((user) => {
                  const sheet = user.goalSheets[0];
                  let statusColor = "bg-zinc-950 text-zinc-500 border border-zinc-900";
                  let statusText = "No Goals Drafted";

                  if (sheet) {
                    if (sheet.status === "LOCKED") {
                      if (activeCycle?.activeQuarter) {
                        const totalGoals = sheet.goals.length;
                        const updatedGoals = sheet.goals.filter((g) =>
                          g.checkIns.some((c) => c.period === activeCycle.activeQuarter)
                        ).length;

                        if (totalGoals === 0) {
                          statusColor = "bg-zinc-950 text-zinc-500 border border-zinc-900";
                          statusText = "No Goals Defined";
                        } else if (updatedGoals === totalGoals) {
                          statusColor = "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20";
                          statusText = `${activeCycle.activeQuarter} Completed`;
                        } else if (updatedGoals > 0) {
                          statusColor = "bg-amber-500/10 text-amber-400 border border-amber-500/20";
                          statusText = `${activeCycle.activeQuarter} (${updatedGoals}/${totalGoals})`;
                        } else {
                          statusColor = "bg-rose-500/10 text-rose-400 border border-rose-500/20";
                          statusText = `${activeCycle.activeQuarter} Pending`;
                        }
                      } else {
                        statusColor = "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20";
                        statusText = "Locked (Active)";
                      }
                    } else if (sheet.status === "SUBMITTED" || sheet.status === "UNDER_REVIEW") {
                      statusColor = "bg-amber-500/10 text-amber-400 border border-amber-500/20";
                      statusText = "Pending Approval";
                    } else if (sheet.status === "DRAFT") {
                      statusColor = "bg-blue-500/10 text-blue-400 border border-blue-500/20";
                      statusText = "In Draft";
                    }
                  }

                  const targetHref = sheet
                    ? sheet.status === "LOCKED"
                      ? `/manager/checkins/${sheet.id}`
                      : `/manager/review/${sheet.id}`
                    : "#";

                  return (
                    <Link
                      key={user.id}
                      href={sheet ? targetHref : "#"}
                      className="p-5 flex items-center justify-between hover:bg-zinc-900/40 transition-all group cursor-pointer active:scale-[0.99]"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-zinc-950/80 border border-zinc-900 flex items-center justify-center text-zinc-500 group-hover:text-zinc-300 group-hover:border-zinc-800 transition-colors">
                          <UserIcon size={16} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-zinc-200 font-semibold text-sm group-hover:text-zinc-150 transition-colors">
                              {user.name}
                            </h4>
                            {user.empId && (
                              <span className="text-[10px] text-zinc-500 bg-zinc-950 border border-zinc-900 px-1.5 py-0.5 rounded font-mono">
                                ID: {user.empId}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-zinc-500 mt-0.5 leading-relaxed">
                            {user.email} &bull; {user.department?.name || "No Dept"}{" "}
                            {isAdmin && user.manager && `• Mgr: ${user.manager.name}`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full border ${statusColor}`}>
                          {statusText}
                        </span>
                        {sheet && <ChevronRight className="text-zinc-600 group-hover:text-zinc-400 transition-colors" size={16} />}
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
