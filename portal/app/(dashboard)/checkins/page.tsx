import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/authOptions";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { CheckInCard } from "@/components/checkins/CheckInCard";
import { CheckInPeriod } from "@prisma/client";

export default async function EmployeeCheckInsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  // Fetch the locked goal sheet for the user
  const sheet = await prisma.goalSheet.findFirst({
    where: {
      userId: session.user.id,
      status: "LOCKED",
    },
    include: {
      goals: {
        include: { checkIns: true }
      }
    }
  });

  // For the MVP, hardcode or detect the active period. Let's assume Q1.
  const activePeriod: CheckInPeriod = "Q1";

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6">
      <div className="mb-8 border-b border-zinc-800 pb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-100 tracking-tight">Quarterly Check-in</h1>
          <p className="text-sm text-zinc-400 mt-1">Update your progress and achievements for the current period.</p>
        </div>
        <div className="px-4 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-md">
          <span className="text-sm font-medium text-blue-400">Active Window: {activePeriod}</span>
        </div>
      </div>

      {!sheet ? (
        <div className="flex flex-col items-center justify-center p-12 text-center border border-dashed border-zinc-800 rounded-xl bg-zinc-900/20">
          <h3 className="text-lg font-medium text-zinc-300">No Locked Goals Available</h3>
          <p className="text-sm text-zinc-500 mt-2 max-w-md">Your goals must be approved and locked by your manager before you can enter the check-in phase.</p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-zinc-900/50 p-4 rounded-xl border border-zinc-800/80 mb-6">
            <h3 className="text-zinc-300 font-medium">Instructions</h3>
            <p className="text-sm text-zinc-500 mt-1">
              For each goal, input your actual achievement. The system will automatically calculate your progress score. Use the comment section to highlight wins or flag blockers.
            </p>
          </div>

          <div className="space-y-6">
            {sheet.goals.map((goal) => (
              <CheckInCard key={goal.id} goal={goal} activePeriod={activePeriod} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
