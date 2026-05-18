import { ReactNode } from "react";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/authOptions";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { prisma } from "@/lib/prisma";
import { getLifecycleAwareCycle, getQuarterLabel } from "@/lib/quarterLifecycle";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const userExists = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true },
  });
  if (!userExists) redirect("/login");

  const rawCycle = await prisma.goalCycle.findFirst({ where: { isActive: true } });
  const activeCycle = getLifecycleAwareCycle(rawCycle);
  const activeQuarter = activeCycle?.activeQuarter ?? null;
  const planningQuarter = activeCycle?.planningQuarter ?? null;

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-black text-slate-50 font-sans selection:bg-blue-500/30">
      <Sidebar
        user={session.user as any}
        activeQuarter={activeQuarter}
        planningQuarter={planningQuarter}
      />

      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-black">
        {/* Top header */}
        <header className="border-b border-zinc-900 bg-zinc-950/80 px-6 py-4 flex items-center justify-between shrink-0 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <span
              className={`px-2 py-0.5 text-[10px] font-bold tracking-wider rounded uppercase border ${
                activeQuarter
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                  : "bg-amber-500/10 text-amber-400 border-amber-500/20"
              }`}
            >
              {activeQuarter
                ? `${getQuarterLabel(activeQuarter)} Execution Active`
                : "Goal Setting Season"}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline text-xs text-zinc-400 font-medium">
              Welcome, <strong className="text-zinc-200">{session.user.name}</strong>
            </span>
            <div className="w-8 h-8 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-xs font-bold text-blue-400 select-none">
              {session.user.name
                ?.split(" ")
                .map((n: string) => n[0])
                .join("")}
            </div>
          </div>
        </header>

        {/* Operational cycle status strip */}
        {activeCycle && (activeQuarter || planningQuarter) && (
          <div className="bg-zinc-950 border-b border-zinc-900 px-6 py-2 shrink-0 select-none">
            <div className="flex flex-wrap items-center gap-4 text-[11px]">
              {activeQuarter && (
                <div className="flex items-center gap-1.5 px-2.5 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full font-medium">
                  <span className="h-1 w-1 rounded-full bg-emerald-500 animate-pulse" />
                  Performance Execution: {getQuarterLabel(activeQuarter)} Active
                </div>
              )}
              {planningQuarter && (
                <div className="flex items-center gap-1.5 px-2.5 py-0.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full font-medium">
                  <span className="h-1 w-1 rounded-full bg-blue-400" />
                  Goal Planning: {getQuarterLabel(planningQuarter)} Open
                </div>
              )}
            </div>
          </div>
        )}

        {/* Main content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 bg-zinc-950/20">
          <div className="max-w-6xl mx-auto w-full">{children}</div>
        </main>
      </div>
    </div>
  );
}
