import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/authOptions";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Lock, FileText, CheckCircle2 } from "lucide-react";
import { GoalReviewCard } from "@/components/manager/GoalReviewCard";
import { ManagerReviewActions } from "@/components/manager/ManagerReviewActions";
import { ManagerUnlockRequest } from "@/components/manager/ManagerUnlockRequest";

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
      <div className="max-w-4xl mx-auto py-8 px-4 text-center select-none">
        <h2 className="text-sm font-bold text-zinc-400">Quarter Plan not found</h2>
        <Link href="/manager/review" className="text-blue-400 hover:underline mt-4 inline-block text-xs font-semibold">Back to Approvals</Link>
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
    <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6 pb-24 select-none">
      <div className="mb-6">
        <Link href="/manager/review" className="inline-flex items-center text-xs font-semibold text-zinc-550 hover:text-zinc-350 transition-colors">
          <ChevronLeft size={14} className="mr-1" /> Back to Manager Approvals
        </Link>
      </div>

      <div className="bg-zinc-900/40 border border-zinc-900 rounded-2xl p-6 mb-8 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-zinc-150 tracking-tight">{sheet.user.name}'s Quarter Plan</h1>
              <span className="px-2 py-0.5 text-[9px] font-bold bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-full uppercase tracking-wider">{sheet.quarter}</span>
            </div>
            <p className="text-xs text-zinc-500 mt-1 font-semibold">
              {sheet.user.department?.name || "Corporate Operations"} &bull; {sheet.cycle.name}
            </p>
          </div>
          
          <div className="flex items-center gap-6 shrink-0">
            <div className="text-right">
              <p className="text-[9px] text-zinc-550 uppercase font-bold tracking-wider">Total Contribution</p>
              <p className={`text-lg font-extrabold font-mono mt-0.5 ${totalWeight === 100 ? "text-emerald-450" : "text-amber-450"}`}>
                {totalWeight}%
              </p>
            </div>
            <div className="h-8 w-[1px] bg-zinc-900 hidden md:block"></div>
            <div className="text-right">
              <p className="text-[9px] text-zinc-550 uppercase font-bold tracking-wider">Status</p>
              <div className="flex items-center gap-1.5 mt-1 justify-end">
                {isReadOnly && <Lock size={12} className="text-zinc-650" />}
                <span className={`text-xs font-bold uppercase tracking-wide ${
                  sheet.status === "SUBMITTED" ? "text-blue-400" :
                  sheet.status === "UNDER_REVIEW" ? "text-amber-400" :
                  sheet.status === "APPROVED" || sheet.status === "LOCKED" ? "text-emerald-400" :
                  "text-zinc-500"
                }`}>
                  {sheet.status === "APPROVED" || sheet.status === "LOCKED" ? "Finalized" : "Awaiting Approval"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {isReadOnly && (
        <div className="space-y-6 mb-8 animate-fade-in">
          <div className="p-4 bg-zinc-950/20 border border-zinc-900 rounded-xl flex items-start gap-3">
            <Lock className="text-zinc-650 shrink-0 mt-0.5" size={16} />
            <div>
              <h4 className="text-zinc-400 font-bold text-xs">Quarter Plan Plan Locked</h4>
              <p className="text-[11px] text-zinc-550 mt-1 leading-relaxed">This sheet has been approved and is locked. To modify targets mid-cycle, please submit an unlock recommendation below.</p>
            </div>
          </div>
          <ManagerUnlockRequest 
            sheetId={sheet.id}
            employeeName={sheet.user.name}
            quarter={sheet.quarter}
            departmentName={sheet.user.department?.name || "Corporate Operations"}
            initialUnlockRequested={sheet.unlockRequested}
            initialUnlockReason={sheet.unlockReason}
          />
        </div>
      )}

      <div className="space-y-4 mb-8">
        <h3 className="text-xs font-bold text-zinc-450 uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <FileText size={14} className="text-zinc-650" />
          Performance Objectives
        </h3>
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
