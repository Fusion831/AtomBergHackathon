import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/authOptions";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Lock } from "lucide-react";
import { GoalReviewCard } from "@/components/manager/GoalReviewCard";
import { ManagerReviewActions } from "@/components/manager/ManagerReviewActions";

export default async function ManagerReviewDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  if (session.user.role !== "MANAGER" && session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const { id: sheetId } = await params;

  const sheet = await prisma.goalSheet.findUnique({
    where: { id: sheetId },
    include: {
      user: {
        include: { department: true }
      },
      cycle: true,
      goals: {
        orderBy: { weightage: "desc" }
      },
    }
  });

  if (!sheet) {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4 text-center">
        <h2 className="text-xl text-zinc-300">Goal Sheet not found</h2>
        <Link href="/manager/review" className="text-blue-400 hover:underline mt-4 inline-block">Back to Reviews</Link>
      </div>
    );
  }

  // Security check: Only the manager or an admin can view this
  if (session.user.role !== "ADMIN" && sheet.user.managerId !== session.user.id) {
    redirect("/manager/review");
  }

  const totalWeight = sheet.goals.reduce((acc, g) => acc + g.weightage, 0);
  const isReadOnly = sheet.status === "LOCKED" || sheet.status === "APPROVED";

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6 pb-24">
      <div className="mb-6">
        <Link href="/manager/review" className="inline-flex items-center text-sm text-zinc-400 hover:text-zinc-200 transition-colors">
          <ChevronLeft size={16} className="mr-1" /> Back to Team Reviews
        </Link>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold text-zinc-100">{sheet.user.name}'s Goals</h1>
              <span className="px-2 py-0.5 text-xs font-semibold bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded uppercase tracking-wider">{sheet.quarter}</span>
            </div>
            <p className="text-sm text-zinc-400 mt-1">
              {sheet.user.department?.name || "No Department"} &bull; {sheet.cycle.name}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-xs text-zinc-500 uppercase font-medium tracking-wider">Total Weight</p>
              <p className={`text-xl font-semibold ${totalWeight === 100 ? "text-emerald-400" : "text-amber-400"}`}>
                {totalWeight}%
              </p>
            </div>
            <div className="h-10 w-px bg-zinc-800 hidden md:block"></div>
            <div className="text-right">
              <p className="text-xs text-zinc-500 uppercase font-medium tracking-wider">Status</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                {isReadOnly && <Lock size={14} className="text-zinc-500" />}
                <span className={`text-sm font-medium ${
                  sheet.status === "SUBMITTED" ? "text-blue-400" :
                  sheet.status === "UNDER_REVIEW" ? "text-amber-400" :
                  sheet.status === "APPROVED" || sheet.status === "LOCKED" ? "text-emerald-400" :
                  "text-zinc-400"
                }`}>
                  {sheet.status.replace("_", " ")}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {isReadOnly && (
        <div className="mb-8 p-4 bg-zinc-900/50 border border-zinc-800/80 rounded-lg flex items-start gap-3">
          <Lock className="text-zinc-500 shrink-0 mt-0.5" size={20} />
          <div>
            <h4 className="text-zinc-300 font-medium">This sheet is locked</h4>
            <p className="text-sm text-zinc-500 mt-1">It has been approved and cannot be modified further. Contact an Administrator if changes are absolutely necessary.</p>
          </div>
        </div>
      )}

      <div className="space-y-4 mb-8">
        <h3 className="text-lg font-medium text-zinc-100 mb-4">Goal Breakdown</h3>
        {sheet.goals.map((goal) => (
          <GoalReviewCard key={goal.id} goal={goal} isReadOnly={isReadOnly} />
        ))}
      </div>

      {!isReadOnly && (
        <ManagerReviewActions sheetId={sheet.id} totalWeight={totalWeight} />
      )}
    </div>
  );
}
