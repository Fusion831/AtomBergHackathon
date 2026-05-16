import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/authOptions";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { CheckInPeriod } from "@prisma/client";

export default async function ManagerCheckInsListPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  if (session.user.role !== "MANAGER" && session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const activeCycle = await prisma.goalCycle.findFirst({ where: { isActive: true } });
  const activePeriod = activeCycle?.activeQuarter;

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
        include: { checkIns: true }
      },
    },
  });

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6">
      <div className="mb-8 border-b border-zinc-800 pb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-100 tracking-tight">Team Quarterly Check-ins</h1>
          <p className="text-sm text-zinc-400 mt-1">Review progress updates and provide feedback to your team.</p>
        </div>
        <div className="px-4 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-md">
          <span className="text-sm font-medium text-blue-400">
            {activePeriod ? `Active Window: ${activePeriod}` : "Check-ins Closed"}
          </span>
        </div>
      </div>

      <div className="space-y-4">
        {sheets.length === 0 ? (
          <div className="text-center py-12 bg-zinc-900/20 border border-zinc-800 border-dashed rounded-xl">
            <h3 className="text-zinc-300 font-medium">No active check-ins</h3>
            <p className="text-zinc-500 text-sm mt-1">There are no approved (locked) goal sheets for your team yet.</p>
          </div>
        ) : !activePeriod ? (
          <div className="text-center py-12 bg-zinc-900/20 border border-zinc-800 border-dashed rounded-xl">
            <h3 className="text-zinc-300 font-medium">Check-in window is closed</h3>
            <p className="text-zinc-500 text-sm mt-1">Check-ins cannot be reviewed until an admin opens a new quarter window.</p>
          </div>
        ) : (
          sheets.map((sheet) => {
            const totalGoals = sheet.goals.length;
            const updatedGoals = sheet.goals.filter(g => g.checkIns.some(c => c.period === activePeriod)).length;
            
            return (
              <Link key={sheet.id} href={`/manager/checkins/${sheet.id}`}>
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
                      updatedGoals === totalGoals ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                      updatedGoals > 0 ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" :
                      "bg-zinc-800 text-zinc-400 border border-zinc-700"
                    }`}>
                      {updatedGoals === totalGoals ? "Completed" : updatedGoals > 0 ? "In Progress" : "Pending"}
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
