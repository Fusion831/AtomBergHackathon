import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/authOptions";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ChevronRight, Calendar } from "lucide-react";
import { CheckInPeriod } from "@prisma/client";

export default async function ManagerCheckInsListPage({ searchParams }: { searchParams: Promise<{ period?: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  if (session.user.role !== "MANAGER" && session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const resolvedParams = await searchParams;
  const activeCycle = await prisma.goalCycle.findFirst({ where: { isActive: true } });
  const activePeriod = activeCycle?.activeQuarter;

  const selectedPeriod = (resolvedParams.period as CheckInPeriod) || activePeriod || "Q1";
  const isReadOnly = selectedPeriod !== activePeriod;

  // Fetch only LOCKED sheets (since check-ins only happen on locked goals)
  const sheets = await prisma.goalSheet.findMany({
    where: {
      cycleId: activeCycle?.id,
      user: {
        managerId: session.user.role === "MANAGER" ? session.user.id : undefined,
      },
      status: "LOCKED",
    },
    include: {
      user: true,
      cycle: true,
      goals: {
        include: {
          checkIns: {
            where: { period: selectedPeriod }
          }
        }
      },
    },
  });

  const quarters: { id: CheckInPeriod; label: string }[] = [
    { id: "Q1", label: "Q1 Check-in" },
    { id: "Q2", label: "Q2 Check-in" },
    { id: "Q3", label: "Q3 Check-in" },
    { id: "Q4_ANNUAL", label: "Q4 / Annual" }
  ];

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6">
      <div className="mb-8 border-b border-zinc-800 pb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-100 tracking-tight">Team Check-ins</h1>
          <p className="text-sm text-zinc-400 mt-1">Review your direct reports' progress updates and log your review comments.</p>
        </div>
        <div className="flex items-center gap-2">
          {activePeriod ? (
            <div className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold uppercase tracking-wider rounded">
              Active Window: {activePeriod}
            </div>
          ) : (
            <div className="px-3 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-500 text-xs font-semibold uppercase tracking-wider rounded">
              Check-ins Closed
            </div>
          )}
        </div>
      </div>

      {/* Tabs to traverse quarters easily */}
      <div className="flex border-b border-zinc-850 gap-4 md:gap-6 mb-8 overflow-x-auto pb-px">
        {quarters.map((q) => {
          const isActiveWindow = activePeriod === q.id;
          const isSelected = selectedPeriod === q.id;
          
          return (
            <Link 
              key={q.id}
              href={`/manager/checkins?period=${q.id}`}
              className={`pb-3 text-xs md:text-sm font-semibold border-b-2 transition-all whitespace-nowrap flex items-center gap-1.5 shrink-0 ${
                isSelected 
                  ? "border-blue-500 text-zinc-100" 
                  : "border-transparent text-zinc-500 hover:text-zinc-300"
              }`}
            >
              <span>{q.label}</span>
              {isActiveWindow ? (
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" title="Active Window"></span>
              ) : (
                <span className="text-[10px] text-zinc-600 bg-zinc-900 border border-zinc-800 px-1 rounded uppercase font-normal">Closed</span>
              )}
            </Link>
          );
        })}
      </div>

      {isReadOnly && (
        <div className="bg-zinc-950 border border-zinc-850 rounded-xl p-4 mb-6 text-sm text-zinc-400">
          <p className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0"></span>
            <span>Currently viewing: <strong className="text-zinc-200">{selectedPeriod} Check-ins</strong>. This window is closed, so updates and review feedback are read-only.</span>
          </p>
        </div>
      )}

      <div className="space-y-4">
        {sheets.length === 0 ? (
          <div className="text-center py-16 bg-zinc-900/10 border border-zinc-800 border-dashed rounded-xl">
            <Calendar size={32} className="mx-auto text-zinc-600 mb-3" />
            <h3 className="text-zinc-300 font-medium">No locked sheets found</h3>
            <p className="text-zinc-500 text-sm mt-1 max-w-sm mx-auto">Employees must have their goals approved and locked before check-ins can begin.</p>
          </div>
        ) : (
          sheets.map((sheet) => {
            const totalGoals = sheet.goals.length;
            const updatedGoals = sheet.goals.filter(g => g.checkIns.length > 0).length;
            
            return (
              <Link key={sheet.id} href={`/manager/checkins/${sheet.id}?period=${selectedPeriod}`}>
                <div className="flex items-center justify-between p-5 bg-zinc-900 hover:bg-zinc-800/80 border border-zinc-800 hover:border-zinc-700 transition-colors rounded-xl group cursor-pointer">
                  <div>
                    <h3 className="text-zinc-100 font-medium">{sheet.user.name}</h3>
                    <div className="flex items-center gap-3 text-sm text-zinc-400 mt-1">
                      <span>{sheet.cycle.name}</span>
                      <span className="w-1 h-1 rounded-full bg-zinc-700"></span>
                      <span>Updates: {updatedGoals}/{totalGoals} Goals</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                      updatedGoals === totalGoals && totalGoals > 0 ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                      updatedGoals > 0 ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" :
                      "bg-zinc-800 text-zinc-400 border border-zinc-700"
                    }`}>
                      {updatedGoals === totalGoals && totalGoals > 0 ? "Completed" : updatedGoals > 0 ? "In Progress" : "Pending"}
                    </span>
                    <ChevronRight className="text-zinc-500 group-hover:text-zinc-300 transition-colors" size={20} />
                  </div>
                </div>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
