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
        <div className="flex flex-col items-center justify-center p-12 text-center border border-dashed border-zinc-800 rounded-xl bg-zinc-900/20">
          <h3 className="text-lg font-medium text-zinc-300">No Draft Available</h3>
          <p className="text-sm text-zinc-500 mt-2 max-w-md">You currently do not have an active goal sheet in the drafting phase. Please contact your manager or HR if you believe this is an error.</p>
        </div>
      )}
    </div>
  );
}
