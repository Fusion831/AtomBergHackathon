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

const STATUS_CONFIG: Record<string, { label: string; description: string; bgClass: string; textClass: string; borderClass: string; icon: React.ElementType }> = {
  SUBMITTED: {
    label: "Awaiting Manager Approval",
    description: "Your Quarter Plan has been submitted and is currently awaiting review by your manager.",
    bgClass: "bg-amber-500/5",
    textClass: "text-amber-400",
    borderClass: "border-amber-500/20",
    icon: Clock,
  },
  UNDER_REVIEW: {
    label: "Awaiting Manager Approval",
    description: "Your Quarter Plan is under review. Your manager will sign off shortly or return it for calibration.",
    bgClass: "bg-amber-500/5",
    textClass: "text-amber-400",
    borderClass: "border-amber-500/20",
    icon: Clock,
  },
  APPROVED: {
    label: "Approved & Active",
    description: "Your Quarter Plan is active. You can now log performance updates for this cycle.",
    bgClass: "bg-emerald-500/5",
    textClass: "text-emerald-400",
    borderClass: "border-emerald-500/20",
    icon: CheckCircle,
  },
  LOCKED: {
    label: "Finalized & Locked",
    description: "This Quarter Plan is finalized. Updates can only be logged during check-in windows, and plan alterations require administrative unlock permission.",
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
  const selectedTab = searchParams.tab || "active"; // Default to active performance

  const activeCycle = await prisma.goalCycle.findFirst({ where: { isActive: true } });

  // Map tabs to target quarters
  let targetQuarter = "Q2";
  if (selectedTab === "planning") {
    targetQuarter = activeCycle?.planningQuarter || "Q3";
  } else if (selectedTab === "historical") {
    targetQuarter = "Q1";
  } else {
    targetQuarter = activeCycle?.activeQuarter || "Q2";
  }

  // Find the plan for this target quarter
  let sheet = await prisma.goalSheet.findFirst({
    where: {
      userId: session.user.id,
      cycleId: activeCycle?.id,
      quarter: targetQuarter as any,
    },
    include: { goals: { include: { checkIns: true } } }
  });

  // Auto-instantiate a DRAFT plan IF the planning workspace is selected and planning window is open
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
  let workspaceTitle = "Q2 Active Performance";
  let workspaceSubtext = "Track current quarter execution, log performance updates against operational key results, and view real-time comments.";
  let borderActiveTab = "border-emerald-500 text-emerald-400";

  if (selectedTab === "planning") {
    workspaceTitle = "Q3 Goal Planning";
    workspaceSubtext = "Draft your success targets, configure contributions, and prepare your plan for the upcoming quarter.";
    borderActiveTab = "border-blue-500 text-blue-400";
  } else if (selectedTab === "historical") {
    workspaceTitle = "Q1 Performance History";
    workspaceSubtext = "View finalized historical plans, end-of-quarter performance scores, and past check-in details.";
    borderActiveTab = "border-zinc-500 text-zinc-300";
  }

  const isDraft = sheet?.status === "DRAFT";
  const statusInfo = sheet && !isDraft ? STATUS_CONFIG[sheet.status] : null;
  const StatusIcon = statusInfo?.icon || FileText;

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6">
      {/* Header section with humanized enterprise text */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 select-none">
        <div>
          <h1 className="text-2xl font-bold text-zinc-150 tracking-tight flex items-center gap-2">
            {workspaceTitle}
          </h1>
          <p className="text-sm text-zinc-500 mt-1 max-w-xl">
            {workspaceSubtext}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {activeCycle && (
            <span className="text-[10px] font-bold bg-zinc-900 border border-zinc-800 text-zinc-400 px-3 py-1 rounded-lg uppercase tracking-wider">
              Cycle: {activeCycle.name}
            </span>
          )}
        </div>
      </div>

      {/* Segmented executive tab bar */}
      <div className="flex border-b border-zinc-900 mb-8 overflow-x-auto gap-2 select-none">
        <Link
          href="/goals/draft?tab=active"
          className={`flex items-center gap-2 pb-3 px-4 text-xs sm:text-sm font-semibold tracking-wide border-b-2 transition-all shrink-0 ${
            selectedTab === "active"
              ? "border-emerald-500 text-emerald-400"
              : "border-transparent text-zinc-500 hover:text-zinc-350"
          }`}
        >
          <Target size={16} className={selectedTab === "active" ? "text-emerald-400" : "text-zinc-600"} />
          <span>Q2 Active Performance</span>
          <span className={`px-1.5 py-0.5 text-[9px] rounded font-bold uppercase border ${
            selectedTab === "active"
              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
              : "bg-zinc-950 text-zinc-600 border-zinc-900"
          }`}>
            Execution
          </span>
        </Link>

        <Link
          href="/goals/draft?tab=planning"
          className={`flex items-center gap-2 pb-3 px-4 text-xs sm:text-sm font-semibold tracking-wide border-b-2 transition-all shrink-0 ${
            selectedTab === "planning"
              ? "border-blue-500 text-blue-400"
              : "border-transparent text-zinc-500 hover:text-zinc-350"
          }`}
        >
          <Calendar size={16} className={selectedTab === "planning" ? "text-blue-400" : "text-zinc-600"} />
          <span>Q3 Goal Planning</span>
          <span className={`px-1.5 py-0.5 text-[9px] rounded font-bold uppercase border ${
            selectedTab === "planning"
              ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
              : "bg-zinc-950 text-zinc-600 border-zinc-900"
          }`}>
            Planning
          </span>
        </Link>

        <Link
          href="/goals/draft?tab=historical"
          className={`flex items-center gap-2 pb-3 px-4 text-xs sm:text-sm font-semibold tracking-wide border-b-2 transition-all shrink-0 ${
            selectedTab === "historical"
              ? "border-zinc-500 text-zinc-300"
              : "border-transparent text-zinc-500 hover:text-zinc-350"
          }`}
        >
          <Archive size={16} className={selectedTab === "historical" ? "text-zinc-300" : "text-zinc-600"} />
          <span>Q1 Performance History</span>
          <span className={`px-1.5 py-0.5 text-[9px] rounded font-bold uppercase border ${
            selectedTab === "historical"
              ? "bg-zinc-500/10 text-zinc-350 border-zinc-800"
              : "bg-zinc-950 text-zinc-600 border-zinc-900"
          }`}>
            History
          </span>
        </Link>
      </div>

      {/* Info Banners for non-draft sheets in planning/execution states */}
      {sheet && statusInfo && selectedTab !== "historical" && (
        <div className={`mb-6 p-4 rounded-xl border ${statusInfo.bgClass} ${statusInfo.borderClass} animate-fade-in`}>
          <div className="flex items-start gap-3">
            <StatusIcon size={18} className={`${statusInfo.textClass} shrink-0 mt-0.5`} />
            <div>
              <h3 className={`text-xs font-semibold ${statusInfo.textClass}`}>{statusInfo.label}</h3>
              <p className="text-xs text-zinc-400 mt-1 leading-relaxed">{statusInfo.description}</p>
            </div>
          </div>
        </div>
      )}

      {/* Workspace Content Frame */}
      {sheet ? (
        <GoalSheetManager 
          sheet={sheet as any} 
          activePeriod={activeCycle?.activeQuarter || undefined} 
          planningPeriod={activeCycle?.planningQuarter || undefined} 
        />
      ) : (
        /* Empty / Locked Skeleton States */
        <div className="flex flex-col items-center justify-center py-20 px-6 text-center border border-zinc-900 rounded-2xl bg-zinc-950/20 shadow-sm select-none">
          {selectedTab === "planning" ? (
            <>
              <div className="w-12 h-12 bg-zinc-900 border border-zinc-800 rounded-full flex items-center justify-center mb-4 text-zinc-650">
                <Calendar size={22} />
              </div>
              <h3 className="text-sm font-bold text-zinc-300">Goal Planning Window is Closed</h3>
              <p className="text-xs text-zinc-500 mt-2 max-w-sm leading-relaxed">
                The planning window for {activeCycle?.planningQuarter || "Q3"} goals has not been opened yet by the operations administrator. You will receive an alert once planning is enabled.
              </p>
              <div className="mt-5 px-3 py-1.5 text-[10px] font-bold text-emerald-400 bg-emerald-500/5 border border-emerald-500/10 rounded-lg">
                Active Execution for {activeCycle?.activeQuarter || "Q2"} remains open.
              </div>
            </>
          ) : selectedTab === "active" ? (
            <>
              <div className="w-12 h-12 bg-zinc-900 border border-zinc-800 rounded-full flex items-center justify-center mb-4 text-zinc-650">
                <Target size={22} />
              </div>
              <h3 className="text-sm font-bold text-zinc-300">No Active Quarter Plan Found</h3>
              <p className="text-xs text-zinc-500 mt-2 max-w-sm leading-relaxed">
                You do not have an approved performance plan active for this quarter ({activeCycle?.activeQuarter || "Q2"}).
              </p>
              {activeCycle?.planningQuarter && (
                <Link
                  href="/goals/draft?tab=planning"
                  className="mt-5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-lg transition-colors active:scale-[0.98]"
                >
                  Propose Q3 Goals
                </Link>
              )}
            </>
          ) : (
            <>
              <div className="w-12 h-12 bg-zinc-900 border border-zinc-800 rounded-full flex items-center justify-center mb-4 text-zinc-650">
                <Archive size={22} />
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
