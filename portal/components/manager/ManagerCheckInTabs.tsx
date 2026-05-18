"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckInPeriod } from "@prisma/client";
import { ChevronRight, Calendar } from "lucide-react";
import Link from "next/link";

interface ManagerCheckInTabsProps {
  initialPeriod: CheckInPeriod;
  activePeriod: CheckInPeriod | null | undefined;
  quarters: { id: CheckInPeriod; label: string }[];
  sheetsData: Array<{
    id: string;
    quarter: string;
    status: string;
    user: { name: string; email: string };
    cycle: { name: string };
    goals: Array<{ id: string; checkIns: Array<{ id: string }> }>;
  }>;
  isReadOnly: boolean;
}

export function ManagerCheckInTabs({
  initialPeriod,
  activePeriod,
  quarters,
  sheetsData,
  isReadOnly
}: ManagerCheckInTabsProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<CheckInPeriod>(initialPeriod);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handlePeriodChange = (period: CheckInPeriod) => {
    setSelectedPeriod(period);
    startTransition(() => {
      router.push(`/manager/checkins?period=${period}`);
    });
  };

  return (
    <div className="space-y-6">
      {/* Interactive Tabs */}
      <div className="flex border-b border-zinc-900 gap-4 md:gap-6 mb-8 overflow-x-auto pb-px select-none">
        {quarters.map((q) => {
          const isActiveWindow = activePeriod === q.id;
          const isSelected = selectedPeriod === q.id;

          return (
            <button
              key={q.id}
              onClick={() => handlePeriodChange(q.id)}
              className={`pb-3 text-xs md:text-sm font-semibold border-b-2 transition-all whitespace-nowrap flex items-center gap-1.5 shrink-0 ${
                isSelected
                  ? "border-blue-500 text-zinc-100"
                  : "border-transparent text-zinc-500 hover:text-zinc-300"
              }`}
              type="button"
            >
              <span>{q.label}</span>
              {isActiveWindow ? (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse" title="Active Window"></span>
              ) : (
                <span className="text-[9px] text-zinc-600 bg-zinc-900 border border-zinc-800 px-1 rounded uppercase font-normal">Closed</span>
              )}
            </button>
          );
        })}
      </div>

      {isReadOnly && (
        <div className="bg-zinc-900/40 border border-zinc-900 rounded-xl p-4 mb-6 text-xs text-zinc-400">
          <p className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0"></span>
            <span>Currently viewing: <strong className="text-zinc-200">{selectedPeriod} Check-ins</strong>. This window is closed, so updates and review feedback are read-only.</span>
          </p>
        </div>
      )}

      {/* Sheet List Container with Transition Skeletons */}
      <div className="relative min-h-[250px]">
        {isPending ? (
          <div className="space-y-4 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-5 bg-zinc-900/40 border border-zinc-900 rounded-xl flex items-center justify-between">
                <div className="space-y-2.5 w-1/3">
                  <div className="h-4 bg-zinc-900 rounded w-3/4"></div>
                  <div className="h-3.5 bg-zinc-900/60 rounded w-1/2"></div>
                </div>
                <div className="h-6 w-24 bg-zinc-900 rounded-full"></div>
              </div>
            ))}
          </div>
        ) : sheetsData.length === 0 ? (
          <div className="text-center py-16 bg-zinc-900/10 border border-zinc-900 border-dashed rounded-xl">
            <Calendar size={28} className="mx-auto text-zinc-700 mb-3" />
            <h3 className="text-zinc-400 font-medium text-sm">No locked sheets found</h3>
            <p className="text-zinc-600 text-xs mt-1 max-w-xs mx-auto">Employees must have their goals approved and locked before check-ins can begin.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {sheetsData.map((sheet) => {
              const totalGoals = sheet.goals.length;
              const updatedGoals = sheet.goals.filter(g => g.checkIns.length > 0).length;

              return (
                <Link key={sheet.id} href={`/manager/checkins/${sheet.id}?period=${selectedPeriod}`}>
                  <div className="flex items-center justify-between p-5 bg-zinc-900 hover:bg-zinc-800/80 border border-zinc-800/80 hover:border-zinc-800 transition-all rounded-xl group cursor-pointer active:scale-[0.99]">
                    <div>
                      <h3 className="text-zinc-200 font-medium text-sm group-hover:text-zinc-100 transition-colors">{sheet.user.name}</h3>
                      <div className="flex items-center gap-3 text-xs text-zinc-500 mt-1">
                        <span>{sheet.cycle.name}</span>
                        <span className="w-1 h-1 rounded-full bg-zinc-800"></span>
                        <span>Updates: {updatedGoals}/{totalGoals} Goals</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={`px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider rounded-full border ${
                        updatedGoals === totalGoals && totalGoals > 0 ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                        updatedGoals > 0 ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                        "bg-zinc-800 text-zinc-400 border-zinc-700"
                      }`}>
                        {updatedGoals === totalGoals && totalGoals > 0 ? "Fully Updated" : updatedGoals > 0 ? "Partially Updated" : "Pending Updates"}
                      </span>
                      <ChevronRight className="text-zinc-600 group-hover:text-zinc-400 transition-colors" size={18} />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
