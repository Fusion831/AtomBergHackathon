import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/authOptions";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { GoalSheetManager } from "@/components/goals/GoalSheetManager";

export default async function DraftGoalsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  // Fetch the current active DRAFT sheet for the user
  const sheet = await prisma.goalSheet.findFirst({
    where: {
      userId: session.user.id,
      status: "DRAFT",
    },
    include: { goals: true }
  });

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-zinc-100">Draft Your Goals</h1>
        <p className="text-sm text-zinc-400 mt-1">Set clear, actionable objectives for the upcoming cycle.</p>
      </div>

      {sheet ? (
        <GoalSheetManager sheet={sheet} />
      ) : (
        <div className="flex flex-col items-center justify-center py-16 px-6 text-center border border-zinc-800/80 rounded-2xl bg-zinc-950/50 shadow-sm">
          <div className="w-12 h-12 bg-zinc-900 border border-zinc-800 rounded-full flex items-center justify-center mb-4 text-zinc-500">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/></svg>
          </div>
          <h3 className="text-lg font-medium text-zinc-200">No Active Goal Sheet</h3>
          <p className="text-sm text-zinc-500 mt-2 max-w-md">You currently do not have an active goal sheet in the drafting phase. Please contact your manager or HR if you believe this is an error.</p>
        </div>
      )}
    </div>
  );
}
