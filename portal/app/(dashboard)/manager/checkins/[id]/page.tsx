import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/authOptions";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { ManagerCheckInCard } from "@/components/checkins/ManagerCheckInCard";
import { CheckInPeriod } from "@prisma/client";

export default async function ManagerCheckInDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  if (session.user.role !== "MANAGER" && session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const { id: sheetId } = await params;
  const activeCycle = await prisma.goalCycle.findFirst({ where: { isActive: true } });
  const activePeriod = activeCycle?.activeQuarter;

  const sheet = await prisma.goalSheet.findUnique({
    where: { id: sheetId },
    include: {
      user: {
        include: { department: true }
      },
      cycle: true,
      goals: {
        orderBy: { weightage: "desc" },
        include: { checkIns: true }
      },
    }
  });

  if (!sheet) {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4 text-center">
        <h2 className="text-xl text-zinc-300">Goal Sheet not found</h2>
        <Link href="/manager/checkins" className="text-blue-400 hover:underline mt-4 inline-block">Back to Team Check-ins</Link>
      </div>
    );
  }

  if (session.user.role !== "ADMIN" && sheet.user.managerId !== session.user.id) {
    redirect("/manager/checkins");
  }

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6 pb-24">
      <div className="mb-6 flex justify-between items-center">
        <Link href="/manager/checkins" className="inline-flex items-center text-sm text-zinc-400 hover:text-zinc-200 transition-colors">
          <ChevronLeft size={16} className="mr-1" /> Back to Team Check-ins
        </Link>
        <div className="px-4 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-md">
          <span className="text-sm font-medium text-blue-400">
            {activePeriod ? `${activePeriod} Review` : "Check-ins Closed"}
          </span>
        </div>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-zinc-100">{sheet.user.name}'s Progress</h1>
            <p className="text-sm text-zinc-400 mt-1">
              {sheet.user.department?.name || "No Department"} &bull; {sheet.cycle.name}
            </p>
          </div>
        </div>
      </div>

      {!activePeriod ? (
        <div className="text-center py-12 bg-zinc-900/20 border border-zinc-800 border-dashed rounded-xl">
          <h3 className="text-zinc-300 font-medium">Check-in window is closed</h3>
          <p className="text-zinc-500 text-sm mt-1">Check-ins cannot be reviewed until an admin opens a new quarter window.</p>
        </div>
      ) : (
        <div className="space-y-4 mb-8">
          {sheet.goals.map((goal) => (
            <ManagerCheckInCard key={goal.id} goal={goal} activePeriod={activePeriod} />
          ))}
        </div>
      )}
    </div>
  );
}
