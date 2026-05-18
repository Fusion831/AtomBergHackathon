import { ReactNode } from "react";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/authOptions";
import { redirect } from "next/navigation";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { Target } from "lucide-react";
import { prisma } from "@/lib/prisma";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  // Handle active session references to non-existent users (e.g., after database reseed)
  const userExists = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true }
  });

  if (!userExists) {
    redirect("/login");
  }

  const activeCycle = await prisma.goalCycle.findFirst({ where: { isActive: true } });
  const activeQuarter = activeCycle?.activeQuarter;

  return (
    <div className="min-h-screen bg-black text-slate-50 flex flex-col font-sans selection:bg-blue-500/30">
      <header className="border-b border-zinc-800/80 bg-zinc-950/80 px-6 py-3.5 sticky top-0 z-50 backdrop-blur-md shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 bg-blue-500/10 rounded-lg border border-blue-500/20">
                <Target size={18} className="text-blue-400" />
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <h1 className="text-lg font-semibold tracking-tight text-zinc-100">AtomQuest</h1>
                <span className={`px-2 py-0.5 text-[10px] font-semibold tracking-wider rounded uppercase border ${
                  activeQuarter 
                    ? "bg-blue-500/10 text-blue-400 border-blue-500/20" 
                    : "bg-amber-500/10 text-amber-500 border-amber-500/20"
                }`}>
                  {activeQuarter ? `Active Phase: ${activeQuarter}` : "Phase: Goal Setting"}
                </span>
              </div>
            </div>
            <nav className="hidden md:flex items-center gap-5 text-sm font-medium text-zinc-400">
              {session.user.role === "EMPLOYEE" && (
                <>
                  <a href="/goals/draft" className="hover:text-zinc-100 transition-colors">My Goals</a>
                  <a href="/checkins" className="hover:text-zinc-100 transition-colors">Check-ins</a>
                  <a href="/reports" className="hover:text-zinc-100 transition-colors text-blue-400/90 hover:text-blue-400">Insights</a>
                </>
              )}
              {(session.user.role === "MANAGER" || session.user.role === "ADMIN") && (
                <>
                  <a href="/manager/review" className="hover:text-zinc-100 transition-colors">Team Reviews</a>
                  <a href="/manager/checkins" className="hover:text-zinc-100 transition-colors">Team Check-ins</a>
                  <a href="/manager/shared-goals" className="hover:text-zinc-100 transition-colors">Shared KPIs</a>
                  <a href="/directory" className="hover:text-zinc-100 transition-colors">Directory</a>
                  <a href="/reports" className="hover:text-zinc-100 transition-colors text-blue-400/90 hover:text-blue-400">Analytics & Reports</a>
                </>
              )}
              {session.user.role === "ADMIN" && (
                <a href="/admin/governance" className="hover:text-zinc-100 transition-colors text-amber-500/80 hover:text-amber-400">Admin</a>
              )}
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-zinc-400">{session.user.name} ({session.user.role})</span>
            <LogoutButton />
          </div>
        </div>
      </header>
      {activeCycle && (activeQuarter || activeCycle.planningQuarter) && (
        <div className="bg-zinc-950 border-b border-zinc-800/80 px-6 py-2">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4 text-xs">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
              {activeQuarter && (
                <div className="flex items-center gap-1.5 text-blue-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse"></span>
                  <span><strong>{activeQuarter} Performance Tracking</strong> is currently active.</span>
                </div>
              )}
              {activeQuarter && activeCycle.planningQuarter && (
                <span className="hidden sm:inline text-zinc-800">|</span>
              )}
              {activeCycle.planningQuarter && (
                <div className="flex items-center gap-1.5 text-amber-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                  <span><strong>{activeCycle.planningQuarter} Goal Planning</strong> is now open.</span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[9px] text-zinc-500 font-semibold tracking-wider bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800 uppercase">Dual-Phase Overlap</span>
            </div>
          </div>
        </div>
      )}
      <main className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-6 lg:p-8 space-y-6">
        {children}
      </main>
    </div>
  );
}