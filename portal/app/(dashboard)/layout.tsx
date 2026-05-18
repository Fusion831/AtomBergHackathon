import { ReactNode } from "react";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/authOptions";
import { redirect } from "next/navigation";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { Sidebar } from "@/components/dashboard/Sidebar";
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
    <div className="flex h-screen w-screen overflow-hidden bg-black text-slate-50 font-sans selection:bg-blue-500/30">
      {/* Interactive Left Sidebar */}
      <Sidebar 
        user={session.user as any} 
        activeQuarter={activeQuarter} 
        planningQuarter={activeCycle?.planningQuarter} 
      />

      {/* Right Content Frame */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-black">
        {/* Top Header Bar */}
        <header className="border-b border-zinc-900 bg-zinc-950/80 px-6 py-4 flex items-center justify-between shrink-0 backdrop-blur-md">
          <div className="flex items-center gap-4">
            <span className={`px-2 py-0.5 text-[10px] font-bold tracking-wider rounded uppercase border ${
              activeQuarter 
                ? "bg-blue-500/10 text-blue-400 border-blue-500/20" 
                : "bg-amber-500/10 text-amber-500 border-amber-500/20"
            }`}>
              {activeQuarter ? `Active Phase: ${activeQuarter}` : "Phase: Goal Setting"}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden sm:inline text-xs text-zinc-400 font-medium">
              Welcome, <strong className="text-zinc-200">{session.user.name}</strong>
            </span>
            <div className="w-8 h-8 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-xs font-bold text-blue-400 select-none">
              {session.user.name?.split(" ").map(n => n[0]).join("")}
            </div>
          </div>
        </header>

        {/* Operational Cycle Status strip */}
        {activeCycle && (activeQuarter || activeCycle.planningQuarter) && (
          <div className="bg-zinc-950 border-b border-zinc-900 px-6 py-2 shrink-0 select-none">
            <div className="flex items-center justify-between text-[11px]">
              <div className="flex items-center gap-4">
                {activeQuarter && (
                  <div className="flex items-center gap-1.5 text-blue-400">
                    <span className="h-1 w-1 rounded-full bg-blue-500"></span>
                    <span>Performance Cycle: <strong className="text-zinc-300 font-medium">{activeQuarter}</strong></span>
                  </div>
                )}
                {activeQuarter && activeCycle.planningQuarter && (
                  <span className="text-zinc-800">|</span>
                )}
                {activeCycle.planningQuarter && (
                  <div className="flex items-center gap-1.5 text-amber-500">
                    <span className="h-1 w-1 rounded-full bg-amber-500"></span>
                    <span>Goal Planning: <strong className="text-zinc-300 font-medium">{activeCycle.planningQuarter}</strong></span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Content Pane */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 bg-zinc-950/20">
          <div className="max-w-6xl mx-auto w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}