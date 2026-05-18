import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/authOptions";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { GoalSheetManager } from "@/components/goals/GoalSheetManager";
import {
  Clock, CheckCircle, Lock, FileText, Target, Calendar, Archive, Info,
} from "lucide-react";
import Link from "next/link";
import {
  getLifecycleAwareCycle,
  getQuarterLabel,
  resolveHistoricalQuarter,
} from "@/lib/quarterLifecycle";
import { CheckInPeriod } from "@prisma/client";

interface PageProps {
  searchParams: Promise<{ tab?: string }>;
}

const STATUS_CONFIG: Record<
  string,
  {
    label: string;
    description: string;
    bgClass: string;
    textClass: string;
    borderClass: string;
    icon: React.ElementType;
  }
> = {
  SUBMITTED: {
    label: "Awaiting Manager Approval",
    description:
      "Your Quarter Plan has been submitted and is currently awaiting review by your manager.",
    bgClass: "bg-amber-500/5",
    textClass: "text-amber-400",
    borderClass: "border-amber-500/20",
    icon: Clock,
  },
  UNDER_REVIEW: {
    label: "Under Manager Review",
    description:
      "Your Quarter Plan is under review. Your manager will sign off shortly or return it for calibration.",
    bgClass: "bg-amber-500/5",
    textClass: "text-amber-400",
    borderClass: "border-amber-500/20",
    icon: Clock,
  },
  APPROVED: {
    label: "Approved & Active",
    description:
      "Your Quarter Plan is active. You can now log performance updates for this cycle.",
    bgClass: "bg-emerald-500/5",
    textClass: "text-emerald-400",
    borderClass: "border-emerald-500/20",
    icon: CheckCircle,
  },
  LOCKED: {
    label: "Plan Locked",
    description:
      "Your plan for the quarter is locked. You can update your progress, but changing goals requires an unlock request.",
    bgClass: "bg-zinc-500/5",
    textClass: "text-zinc-400",
    borderClass: "border-zinc-800",
    icon: Lock,
  },
};

export default async function DraftGoalsPage(props: PageProps) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const searchParams = await props.searchParams;
  const selectedTab = searchParams.tab ?? "active";

  const rawCycle = await prisma.goalCycle.findFirst({ where: { isActive: true } });
  const activeCycle = getLifecycleAwareCycle(rawCycle);

  const activeQuarter: CheckInPeriod = (activeCycle?.activeQuarter as CheckInPeriod) ?? "Q2";
  const planningQuarter: CheckInPeriod | null = (activeCycle?.planningQuarter as CheckInPeriod) ?? null;
  const historicalQuarter: CheckInPeriod = resolveHistoricalQuarter(activeQuarter);

  // Resolve which DB quarter we're viewing
  let targetQuarter: CheckInPeriod = activeQuarter;
  if (selectedTab === "planning" && planningQuarter) {
    targetQuarter = planningQuarter;
  } else if (selectedTab === "historical") {
    targetQuarter = historicalQuarter;
  }

  // Find the sheet for this tab
  let sheet = await prisma.goalSheet.findFirst({
    where: {
      userId: session.user.id,
      cycleId: activeCycle?.id ?? "none",
      quarter: targetQuarter,
    },
    include: { goals: { include: { checkIns: true } } },
  });

  // Auto-create a DRAFT for the planning tab if planning is open
  if (
    !sheet &&
    selectedTab === "planning" &&
    activeCycle &&
    planningQuarter &&
    activeCycle.planningQuarter === planningQuarter
  ) {
    sheet = await prisma.goalSheet.create({
      data: {
        userId: session.user.id,
        cycleId: activeCycle.id,
        quarter: planningQuarter,
        status: "DRAFT",
      },
      include: { goals: { include: { checkIns: true } } },
    });
  }

  // Dynamic workspace copy
  const workspace = {
    active: {
      title: `${getQuarterLabel(activeQuarter)} Current Quarter Progress`,
      subtext:
        "Track your goals for the current quarter, update your progress, and review ongoing feedback.",
    },
    planning: {
      title: `${getQuarterLabel(planningQuarter ?? "Q3")} Goal Planning`,
      subtext:
        "Draft your success targets, configure contributions, and prepare your plan for the upcoming quarter.",
    },
    historical: {
      title: `${getQuarterLabel(historicalQuarter)} Performance History`,
      subtext:
        "View finalized historical plans, end-of-quarter performance scores, and past check-in details.",
    },
  };
  const { title: workspaceTitle, subtext: workspaceSubtext } =
    workspace[selectedTab as keyof typeof workspace] ?? workspace.active;

  const isDraft = sheet?.status === "DRAFT";
  const statusInfo = sheet && !isDraft ? STATUS_CONFIG[sheet.status] : null;
  const StatusIcon = statusInfo?.icon ?? FileText;

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6">
      {/* Header */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 select-none">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100 tracking-tight">{workspaceTitle}</h1>
          <p className="text-sm text-zinc-500 mt-1 max-w-xl">{workspaceSubtext}</p>
        </div>
        {activeCycle && (
          <span className="text-[10px] font-bold bg-zinc-900 border border-zinc-800 text-zinc-400 px-3 py-1 rounded-lg uppercase tracking-wider shrink-0">
            Cycle: {activeCycle.name}
          </span>
        )}
      </div>

      {/* Tab bar */}
      <div className="flex border-b border-zinc-900 mb-8 overflow-x-auto gap-1 select-none">
        {/* Active Execution tab — always shown */}
        <Link
          href="/goals/draft?tab=active"
          className={`flex items-center gap-2 pb-3 px-4 text-xs font-semibold tracking-wide border-b-2 transition-all shrink-0 ${
            selectedTab === "active"
              ? "border-emerald-500 text-emerald-400"
              : "border-transparent text-zinc-500 hover:text-zinc-300"
          }`}
        >
          <Target size={14} className={selectedTab === "active" ? "text-emerald-400" : "text-zinc-600"} />
          {getQuarterLabel(activeQuarter)} Current Quarter Progress
          <span
            className={`px-1.5 py-0.5 text-[9px] rounded font-bold uppercase border ${
              selectedTab === "active"
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                : "bg-zinc-950 text-zinc-600 border-zinc-900"
            }`}
          >
            Execution
          </span>
        </Link>

        {/* Planning tab — only shown when admin has opened planning */}
        {planningQuarter && (
          <Link
            href="/goals/draft?tab=planning"
            className={`flex items-center gap-2 pb-3 px-4 text-xs font-semibold tracking-wide border-b-2 transition-all shrink-0 ${
              selectedTab === "planning"
                ? "border-blue-500 text-blue-400"
                : "border-transparent text-zinc-500 hover:text-zinc-300"
            }`}
          >
            <Calendar size={14} className={selectedTab === "planning" ? "text-blue-400" : "text-zinc-600"} />
            {getQuarterLabel(planningQuarter)} Goal Planning
            <span
              className={`px-1.5 py-0.5 text-[9px] rounded font-bold uppercase border ${
                selectedTab === "planning"
                  ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                  : "bg-zinc-950 text-zinc-600 border-zinc-900"
              }`}
            >
              Planning
            </span>
          </Link>
        )}

        {/* Historical tab */}
        <Link
          href="/goals/draft?tab=historical"
          className={`flex items-center gap-2 pb-3 px-4 text-xs font-semibold tracking-wide border-b-2 transition-all shrink-0 ${
            selectedTab === "historical"
              ? "border-zinc-500 text-zinc-300"
              : "border-transparent text-zinc-500 hover:text-zinc-300"
          }`}
        >
          <Archive size={14} className={selectedTab === "historical" ? "text-zinc-300" : "text-zinc-600"} />
          {getQuarterLabel(historicalQuarter)} History
          <span
            className={`px-1.5 py-0.5 text-[9px] rounded font-bold uppercase border ${
              selectedTab === "historical"
                ? "bg-zinc-500/10 text-zinc-300 border-zinc-800"
                : "bg-zinc-950 text-zinc-600 border-zinc-900"
            }`}
          >
            Archived
          </span>
        </Link>
      </div>

      {/* Persistent operational banner */}
      <div className="mb-6 select-none">
        {selectedTab === "active" && (
          <div className="p-3 bg-emerald-500/5 border border-emerald-500/15 rounded-xl flex items-start gap-3">
            <Info size={15} className="text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block mb-0.5">
                {getQuarterLabel(activeQuarter)} Performance Tracking Active
              </span>
              <p className="text-xs text-zinc-400">
                Update your progress weekly and submit unlock requests if targets need to change.
              </p>
            </div>
          </div>
        )}
        {selectedTab === "planning" && planningQuarter && (
          <div className="p-3 bg-blue-500/5 border border-blue-500/15 rounded-xl flex items-start gap-3">
            <Info size={15} className="text-blue-400 shrink-0 mt-0.5" />
            <div>
              <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider block mb-0.5">
                {getQuarterLabel(planningQuarter)} Goal Planning Open
              </span>
              <p className="text-xs text-zinc-400">
                Future quarter planning is currently available. Draft and propose your goals for manager alignment.
              </p>
            </div>
          </div>
        )}
        {selectedTab === "historical" && (
          <div className="p-3 bg-zinc-900/40 border border-zinc-900 rounded-xl flex items-start gap-3">
            <Info size={15} className="text-zinc-400 shrink-0 mt-0.5" />
            <div>
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-0.5">
                {getQuarterLabel(historicalQuarter)} Archived
              </span>
              <p className="text-xs text-zinc-500">
                Historical performance records are finalized and view-only for administrative audit.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Sheet status info banner (for non-draft sheets) */}
      {sheet && statusInfo && selectedTab !== "historical" && (
        <div className={`mb-6 p-4 rounded-xl border ${statusInfo.bgClass} ${statusInfo.borderClass}`}>
          <div className="flex items-start gap-3">
            <StatusIcon size={17} className={`${statusInfo.textClass} shrink-0 mt-0.5`} />
            <div>
              <h3 className={`text-xs font-semibold ${statusInfo.textClass}`}>{statusInfo.label}</h3>
              <p className="text-xs text-zinc-400 mt-1 leading-relaxed">{statusInfo.description}</p>
            </div>
          </div>
        </div>
      )}

      {/* Workspace */}
      {sheet ? (
        <GoalSheetManager
          sheet={sheet as any}
          activePeriod={activeQuarter}
          planningPeriod={planningQuarter ?? undefined}
        />
      ) : (
        /* Empty states */
        <div className="flex flex-col items-center justify-center py-20 px-6 text-center border border-zinc-900 rounded-2xl bg-zinc-950/20 select-none">
          {selectedTab === "planning" ? (
            <>
              <div className="w-12 h-12 bg-zinc-900 border border-zinc-800 rounded-full flex items-center justify-center mb-4 text-zinc-500">
                <Calendar size={20} />
              </div>
              <h3 className="text-sm font-bold text-zinc-300">Goal Planning Window is Closed</h3>
              <p className="text-xs text-zinc-500 mt-2 max-w-sm leading-relaxed">
                The planning window has not been opened yet by the operations administrator. You will be notified once planning is enabled.
              </p>
              <div className="mt-5 px-3 py-1.5 text-[10px] font-bold text-emerald-400 bg-emerald-500/5 border border-emerald-500/10 rounded-lg">
                {getQuarterLabel(activeQuarter)} Execution remains open.
              </div>
            </>
          ) : selectedTab === "active" ? (
            <>
              <div className="w-12 h-12 bg-zinc-900 border border-zinc-800 rounded-full flex items-center justify-center mb-4 text-zinc-500">
                <Target size={20} />
              </div>
              <h3 className="text-sm font-bold text-zinc-300">No Active Quarter Plan Found</h3>
              <p className="text-xs text-zinc-500 mt-2 max-w-sm leading-relaxed">
                You do not have an approved performance plan for {getQuarterLabel(activeQuarter)}.
              </p>
              {planningQuarter && (
                <Link
                  href="/goals/draft?tab=planning"
                  className="mt-5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-lg transition-colors"
                >
                  Propose {getQuarterLabel(planningQuarter)} Goals
                </Link>
              )}
            </>
          ) : (
            <>
              <div className="w-12 h-12 bg-zinc-900 border border-zinc-800 rounded-full flex items-center justify-center mb-4 text-zinc-500">
                <Archive size={20} />
              </div>
              <h3 className="text-sm font-bold text-zinc-300">No Historical Records Available</h3>
              <p className="text-xs text-zinc-500 mt-2 max-w-sm leading-relaxed">
                No past finalized records exist under your account for previous cycle quarters.
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
