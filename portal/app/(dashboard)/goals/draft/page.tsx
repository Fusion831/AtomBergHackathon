import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/authOptions";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { GoalSheetManager } from "@/components/goals/GoalSheetManager";
import { Clock, CheckCircle, Lock, Send, FileText } from "lucide-react";

const STATUS_CONFIG: Record<string, { label: string; description: string; color: string; icon: React.ElementType }> = {
  SUBMITTED: {
    label: "Submitted for Approval",
    description: "Your goal sheet has been submitted and is awaiting your manager's review. You will be notified when it is approved or returned for rework.",
    color: "blue",
    icon: Send,
  },
  UNDER_REVIEW: {
    label: "Under Review",
    description: "Your manager is currently reviewing your goal sheet. You will be notified when it is approved or returned for rework.",
    color: "amber",
    icon: Clock,
  },
  APPROVED: {
    label: "Approved",
    description: "Your goal sheet has been approved by your manager. Your goals are now active for the current cycle.",
    color: "emerald",
    icon: CheckCircle,
  },
  LOCKED: {
    label: "Locked",
    description: "Your goal sheet is locked. Goals cannot be modified unless an Admin unlocks the sheet upon request.",
    color: "purple",
    icon: Lock,
  },
};

export default async function DraftGoalsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  // First, try to find a DRAFT sheet the user can still edit
  let sheet = await prisma.goalSheet.findFirst({
    where: {
      userId: session.user.id,
      status: "DRAFT",
    },
    include: { goals: { include: { checkIns: true } } }
  });

  // If no draft, find any sheet in the active cycle (submitted, approved, locked, etc.)
  if (!sheet) {
    sheet = await prisma.goalSheet.findFirst({
      where: {
        userId: session.user.id,
        status: { in: ["SUBMITTED", "UNDER_REVIEW", "APPROVED", "LOCKED"] },
      },
      include: { goals: { include: { checkIns: true } } },
      orderBy: { updatedAt: "desc" }
    });
  }

  const activeCycle = await prisma.goalCycle.findFirst({ where: { isActive: true } });

  const isDraft = sheet?.status === "DRAFT";
  const statusInfo = sheet && !isDraft ? STATUS_CONFIG[sheet.status] : null;
  const StatusIcon = statusInfo?.icon || FileText;

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-zinc-100">
          {isDraft ? "Draft Your Goals" : "My Goals"}
        </h1>
        <p className="text-sm text-zinc-400 mt-1">
          {isDraft
            ? "Set clear, actionable objectives for the upcoming cycle."
            : "View your submitted goals and their current status."}
        </p>
      </div>

      {/* Status Banner for non-draft sheets */}
      {sheet && statusInfo && (
        <div className={`mb-6 p-4 rounded-xl border bg-${statusInfo.color}-500/5 border-${statusInfo.color}-500/20`}
          style={{
            backgroundColor: `color-mix(in srgb, var(--color-${statusInfo.color}) 5%, transparent)`,
            borderColor: `color-mix(in srgb, var(--color-${statusInfo.color}) 20%, transparent)`,
          }}
        >
          <div className="flex items-start gap-3">
            <StatusIcon size={20} className={`text-${statusInfo.color}-400 shrink-0 mt-0.5`} />
            <div>
              <h3 className={`text-sm font-semibold text-${statusInfo.color}-400`}>{statusInfo.label}</h3>
              <p className="text-sm text-zinc-400 mt-1">{statusInfo.description}</p>
            </div>
          </div>
        </div>
      )}

      {sheet ? (
        <GoalSheetManager sheet={sheet as any} activePeriod={activeCycle?.activeQuarter || undefined} />
      ) : (
        <div className="flex flex-col items-center justify-center py-16 px-6 text-center border border-zinc-800/80 rounded-2xl bg-zinc-950/50 shadow-sm">
          <div className="w-12 h-12 bg-zinc-900 border border-zinc-800 rounded-full flex items-center justify-center mb-4 text-zinc-500">
            <FileText size={24} />
          </div>
          <h3 className="text-lg font-medium text-zinc-200">No Active Goal Sheet</h3>
          <p className="text-sm text-zinc-500 mt-2 max-w-md">You currently do not have an active goal sheet. Please contact your manager or HR if you believe this is an error.</p>
        </div>
      )}
    </div>
  );
}
