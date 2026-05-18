import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/authOptions";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { GoalSheetManager } from "@/components/goals/GoalSheetManager";
import { Clock, CheckCircle, Lock, Send, FileText, Target, Calendar, Archive } from "lucide-react";
import Link from "next/link";

interface PageProps {
  searchParams: Promise<{ tab?: string }>;
}

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

export default async function DraftGoalsPage(props: PageProps) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const searchParams = await props.searchParams;
  const selectedTab = searchParams.tab || "active"; // Default to active execution workspace

  const activeCycle = await prisma.goalCycle.findFirst({ where: { isActive: true } });

  // Map tabs to exact target quarters
  let targetQuarter = "Q2";
  if (selectedTab === "planning") {
    targetQuarter = activeCycle?.planningQuarter || "Q3";
  } else if (selectedTab === "historical") {
    targetQuarter = "Q1";
  } else {
    targetQuarter = activeCycle?.activeQuarter || "Q2";
  }

  // Find the sheet for this target quarter
  let sheet = await prisma.goalSheet.findFirst({
    where: {
      userId: session.user.id,
      cycleId: activeCycle?.id,
      quarter: targetQuarter as any,
    },
    include: { goals: { include: { checkIns: true } } }
  });

  // Auto-instantiate a DRAFT sheet IF the planning workspace is selected and planning window is open
  if (!sheet && selectedTab === "planning" && activeCycle && activeCycle.planningQuarter === targetQuarter) {
    sheet = await prisma.goalSheet.create({
      data: {
        userId: session.user.id,
        cycleId: activeCycle.id,
        quarter: targetQuarter as any,
        status: "DRAFT",
      },
      include: { goals: { include: { checkIns: true } } }
    });
  }

  // Dynamic Workspace Headers
  let workspaceTitle = "Active Performance Workspace";
  let workspaceSubtext = "Track progress of your key operational metrics, log check-in achievements, and review real-time feedback.";
  let accentColor = "emerald";

  if (selectedTab === "planning") {
    workspaceTitle = "Goal Planning Workspace";
    workspaceSubtext = "Set ambitious objectives, balance weightage distributions, and draft goals for the upcoming performance cycle.";
    accentColor = "blue";
  } else if (selectedTab === "historical") {
    workspaceTitle = "Historical Records Archive";
    workspaceSubtext = "Explore archived goals, achievement milestones, check-in reflections, and manager sign-off commentary.";
    accentColor = "zinc";
  }

  const isDraft = sheet?.status === "DRAFT";
  const statusInfo = sheet && !isDraft ? STATUS_CONFIG[sheet.status] : null;
  const StatusIcon = statusInfo?.icon || FileText;

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6">
      {/* Segmented workspace title and phase description */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100 tracking-tight flex items-center gap-2">
            {workspaceTitle}
          </h1>
          <p className="text-sm text-zinc-400 mt-1 max-w-xl">
            {workspaceSubtext}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {activeCycle && (
            <span className="text-[10px] font-semibold bg-zinc-900 border border-zinc-800 text-zinc-400 px-3 py-1 rounded-md uppercase tracking-wider">
              Cycle: {activeCycle.name}
            </span>
          )}
        </div>
      </div>

      {/* Segmented corporate tab bar */}
      <div className="flex border-b border-zinc-800/80 mb-8 overflow-x-auto gap-2">
        <Link
          href="/goals/draft?tab=active"
          className={`flex items-center gap-2 pb-3 px-4 text-xs sm:text-sm font-semibold tracking-wide border-b-2 transition-all shrink-0 ${
            selectedTab === "active"
              ? "border-emerald-500 text-emerald-400"
              : "border-transparent text-zinc-400 hover:text-zinc-200"
          }`}
        >
          <Target size={16} className={selectedTab === "active" ? "text-emerald-400" : "text-zinc-500"} />
          <span>Active Execution ({activeCycle?.activeQuarter || "Q2"})</span>
          <span className={`px-1.5 py-0.5 text-[9px] rounded font-bold uppercase ${
            selectedTab === "active"
              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
              : "bg-zinc-900 text-zinc-500 border border-zinc-800/60"
          }`}>
            Active
          </span>
        </Link>

        <Link
          href="/goals/draft?tab=planning"
          className={`flex items-center gap-2 pb-3 px-4 text-xs sm:text-sm font-semibold tracking-wide border-b-2 transition-all shrink-0 ${
            selectedTab === "planning"
              ? "border-blue-500 text-blue-400"
              : "border-transparent text-zinc-400 hover:text-zinc-200"
          }`}
        >
          <Calendar size={16} className={selectedTab === "planning" ? "text-blue-400" : "text-zinc-500"} />
          <span>Future Planning ({activeCycle?.planningQuarter || "Q3"})</span>
          <span className={`px-1.5 py-0.5 text-[9px] rounded font-bold uppercase ${
            selectedTab === "planning"
              ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
              : "bg-zinc-900 text-zinc-500 border border-zinc-800/60"
          }`}>
            Draft
          </span>
        </Link>

        <Link
          href="/goals/draft?tab=historical"
          className={`flex items-center gap-2 pb-3 px-4 text-xs sm:text-sm font-semibold tracking-wide border-b-2 transition-all shrink-0 ${
            selectedTab === "historical"
              ? "border-zinc-500 text-zinc-300"
              : "border-transparent text-zinc-400 hover:text-zinc-200"
          }`}
        >
          <Archive size={16} className={selectedTab === "historical" ? "text-zinc-300" : "text-zinc-500"} />
          <span>Historical Archive (Q1)</span>
          <span className={`px-1.5 py-0.5 text-[9px] rounded font-bold uppercase ${
            selectedTab === "historical"
              ? "bg-zinc-500/10 text-zinc-300 border border-zinc-550/20"
              : "bg-zinc-900 text-zinc-500 border border-zinc-800/60"
          }`}>
            Archived
          </span>
        </Link>
      </div>

      {/* Info Banners for non-draft sheets in planning/active states */}
      {sheet && statusInfo && selectedTab !== "historical" && (
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

      {/* Workspace Area */}
      {sheet ? (
        <GoalSheetManager 
          sheet={sheet as any} 
          activePeriod={activeCycle?.activeQuarter || undefined} 
          planningPeriod={activeCycle?.planningQuarter || undefined} 
        />
      ) : (
        /* Empty / Locked Skeleton States */
        <div className="flex flex-col items-center justify-center py-16 px-6 text-center border border-zinc-850 rounded-2xl bg-zinc-950/40 backdrop-blur shadow-sm">
          {selectedTab === "planning" ? (
            <>
              <div className="w-14 h-14 bg-zinc-900 border border-zinc-850 rounded-full flex items-center justify-center mb-5 text-zinc-500">
                <Calendar size={28} />
              </div>
              <h3 className="text-lg font-semibold text-zinc-200">Goal Planning is Closed</h3>
              <p className="text-sm text-zinc-400 mt-2 max-w-md leading-relaxed">
                The organizational window for drafting {activeCycle?.planningQuarter || "Q3"} performance goals has not been opened yet by administration. Banners will notify you when drafting is enabled.
              </p>
              <div className="mt-6 px-4 py-2 text-xs font-semibold text-amber-400 bg-amber-400/5 border border-amber-400/10 rounded-md">
                Active Execution for {activeCycle?.activeQuarter || "Q2"} remains open.
              </div>
            </>
          ) : selectedTab === "active" ? (
            <>
              <div className="w-14 h-14 bg-zinc-900 border border-zinc-850 rounded-full flex items-center justify-center mb-5 text-zinc-500">
                <Target size={28} />
              </div>
              <h3 className="text-lg font-semibold text-zinc-200">No Active Operational Goals</h3>
              <p className="text-sm text-zinc-400 mt-2 max-w-md leading-relaxed">
                You do not have an active, approved goal sheet for this operational cycle ({activeCycle?.activeQuarter || "Q2"}).
              </p>
              {activeCycle?.planningQuarter && (
                <Link
                  href="/goals/draft?tab=planning"
                  className="mt-6 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-md transition-colors shadow-md"
                >
                  Propose Q3 Goals
                </Link>
              )}
            </>
          ) : (
            <>
              <div className="w-14 h-14 bg-zinc-900 border border-zinc-850 rounded-full flex items-center justify-center mb-5 text-zinc-500">
                <Archive size={28} />
              </div>
              <h3 className="text-lg font-semibold text-zinc-200">No Historical Records</h3>
              <p className="text-sm text-zinc-400 mt-2 max-w-md leading-relaxed">
                There are no archived goal sheets or complete check-in records available for previous operational quarters.
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
