import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/authOptions";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { CreateSharedGoalForm } from "@/components/manager/CreateSharedGoalForm";
import { AssignSharedGoalModal } from "@/components/manager/AssignSharedGoalModal";
import { Target, Users } from "lucide-react";

export default async function SharedGoalsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  if (session.user.role !== "MANAGER" && session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  // Fetch Master goals owned by this manager
  const masterGoals = await prisma.goal.findMany({
    where: {
      ownerId: session.user.id,
      goalType: "SHARED",
      parentGoalId: null
    },
    include: {
      childGoals: {
        include: { owner: true }
      }
    },
    orderBy: { createdAt: "desc" }
  });

  // Fetch team members for assignment
  const teamMembers = await prisma.user.findMany({
    where: { managerId: session.user.id }
  });

  // Active cycle logic: hardcode or fetch. Let's fetch the seeded cycle.
  const activeCycle = await prisma.goalCycle.findFirst({ where: { isActive: true } });

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6">
      <div className="mb-8 border-b border-zinc-800 pb-6">
        <h1 className="text-2xl font-semibold text-zinc-100 tracking-tight">Shared KPIs</h1>
        <p className="text-sm text-zinc-400 mt-1">Create departmental goals and assign them across your team. Progress updates will cascade automatically.</p>
      </div>

      {activeCycle && (activeCycle.activeQuarter || (activeCycle as any).planningQuarter) && (
        <div className="mb-6 p-4 bg-zinc-900 border border-zinc-800 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg">
              <Target size={20} />
            </div>
            <div>
              <p className="text-sm font-semibold text-zinc-200">Active Cycle: {activeCycle.name}</p>
              <div className="flex items-center gap-2 mt-1 text-xs text-zinc-400">
                {activeCycle.activeQuarter && (
                  <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-blue-500"></span>{activeCycle.activeQuarter} Performance Active</span>
                )}
                {activeCycle.activeQuarter && (activeCycle as any).planningQuarter && <span className="text-zinc-700">|</span>}
                {(activeCycle as any).planningQuarter && (
                  <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-amber-500"></span>{(activeCycle as any).planningQuarter} Planning Open</span>
                )}
              </div>
            </div>
          </div>
          <div className="text-xs text-zinc-400 max-w-xs text-right hidden md:block">
            Pro Tip: Ensure team members have a <strong>Draft</strong> or <strong>Unlocked</strong> sheet to accept new shared KPI assignments.
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-lg font-medium text-zinc-100">Your Shared Goals</h2>
          
          {masterGoals.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-6 text-center border border-zinc-800/80 rounded-2xl bg-zinc-950/50 shadow-sm">
              <div className="w-12 h-12 bg-zinc-900 border border-zinc-800 rounded-full flex items-center justify-center mb-4 text-zinc-500">
                <Target size={20} />
              </div>
              <h3 className="text-lg font-medium text-zinc-200">No Shared KPIs</h3>
              <p className="text-sm text-zinc-500 mt-2 max-w-md">Create your first departmental KPI using the form. Once created, you can cascade it to your direct reports.</p>
            </div>
          ) : (
            masterGoals.map((goal) => (
              <div key={goal.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                  <Target size={100} />
                </div>
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[10px] uppercase tracking-wider font-semibold rounded">
                        Master KPI
                      </span>
                    </div>
                    <h3 className="text-lg font-medium text-zinc-100">{goal.title}</h3>
                    <p className="text-sm text-zinc-400 mt-1">{goal.description}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-zinc-200">{goal.targetValue} {goal.uomType === "PERCENTAGE" ? "%" : ""}</p>
                    <p className="text-xs text-zinc-500 uppercase mt-0.5">Target</p>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-zinc-800/50 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-zinc-400">
                    <Users size={16} />
                    <span>Assigned to {goal.childGoals.length} employees</span>
                  </div>
                  <AssignSharedGoalModal 
                    goalId={goal.id} 
                    teamMembers={teamMembers} 
                    assignedIds={goal.childGoals.map(cg => cg.ownerId as string)}
                    cycleId={activeCycle?.id || ""}
                    quarter={activeCycle?.planningQuarter || activeCycle?.activeQuarter || "Q3"}
                  />
                </div>
              </div>
            ))
          )}
        </div>

        <div className="lg:col-span-1">
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5 sticky top-24">
            <h3 className="text-lg font-medium text-zinc-100 mb-4">Create Master KPI</h3>
            <CreateSharedGoalForm />
          </div>
        </div>
      </div>
    </div>
  );
}
