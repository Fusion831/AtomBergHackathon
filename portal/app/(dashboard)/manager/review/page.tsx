import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/authOptions";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ChevronRight, Activity, CheckCircle, Clock, Calendar, AlertCircle } from "lucide-react";
import { RecentActivityFeed } from "@/components/audit/RecentActivityFeed";
import { getLifecycleAwareCycle, getQuarterLabel } from "@/lib/quarterLifecycle";

export default async function ManagerReviewPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  if (session.user.role !== "MANAGER" && session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const rawCycle = await prisma.goalCycle.findFirst({ where: { isActive: true } });
  const activeCycle = getLifecycleAwareCycle(rawCycle);

  const sheets = await prisma.goalSheet.findMany({
    where: {
      cycleId: activeCycle?.id ?? "none",
      user: { managerId: session.user.id },
    },
    include: {
      user: true,
      cycle: true,
      goals: true,
    },
    orderBy: { updatedAt: "desc" },
  });

  const pendingSheets = sheets.filter(
    (s) => s.status === "SUBMITTED" || s.status === "UNDER_REVIEW"
  );
  const lockedSheets = sheets.filter(
    (s) => (s.status === "APPROVED" || s.status === "LOCKED") && !s.unlockRequested
  );
  const unlockRequestSheets = sheets.filter(
    (s) => s.status === "LOCKED" && s.unlockRequested
  );
  const draftSheets = sheets.filter((s) => s.status === "DRAFT");

  const STATUS_LABEL: Record<string, string> = {
    SUBMITTED: "Awaiting Approval",
    UNDER_REVIEW: "Under Review",
    APPROVED: "Approved",
    LOCKED: "Finalized",
    DRAFT: "Drafting",
  };

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6 select-none">
      {/* Header */}
      <div className="mb-8 border-b border-zinc-900 pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100 tracking-tight flex items-center gap-2">
            <CheckCircle size={22} className="text-emerald-400" />
            Manager Approvals
          </h1>
          <p className="text-xs text-zinc-500 mt-1">
            Review, calibrate, and authorize plans proposed by your team.
          </p>
        </div>
        <div className="flex gap-2 flex-wrap shrink-0">
          {pendingSheets.length > 0 && (
            <div className="px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-lg flex items-center gap-2">
              <Clock size={13} className="text-amber-400" />
              <span className="text-xs font-bold text-amber-400">
                {pendingSheets.length} Pending
              </span>
            </div>
          )}
          {unlockRequestSheets.length > 0 && (
            <div className="px-3 py-1.5 bg-rose-500/10 border border-rose-500/20 rounded-lg flex items-center gap-2">
              <AlertCircle size={13} className="text-rose-400" />
              <span className="text-xs font-bold text-rose-400">
                {unlockRequestSheets.length} Unlock Request{unlockRequestSheets.length !== 1 ? "s" : ""}
              </span>
            </div>
          )}
          <div className="px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg flex items-center gap-2">
            <Calendar size={13} className="text-blue-400" />
            <span className="text-xs font-bold text-zinc-400">
              {draftSheets.length} Still Drafting
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">

          {/* Pending unlock requests — highest priority */}
          {unlockRequestSheets.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-[10px] font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                <AlertCircle size={12} className="animate-pulse" />
                Unlock Requests — Needs Attention
              </h2>
              <div className="border border-rose-500/15 rounded-xl divide-y divide-zinc-900/50 overflow-hidden bg-zinc-950/30">
                {unlockRequestSheets.map((sheet) => (
                  <Link key={sheet.id} href={`/manager/review/${sheet.id}`}>
                    <div className="flex items-center justify-between p-4 hover:bg-zinc-900/30 transition-colors group cursor-pointer">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-zinc-100 font-semibold text-sm">{sheet.user.name}</h3>
                          <span className="px-2 py-0.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[9px] font-bold rounded-full uppercase tracking-wider">
                            {getQuarterLabel(sheet.quarter)} Unlock
                          </span>
                        </div>
                        {sheet.unlockReason && (
                          <p className="text-xs text-zinc-500 mt-1 max-w-md truncate italic">
                            "{sheet.unlockReason}"
                          </p>
                        )}
                      </div>
                      <ChevronRight size={15} className="text-zinc-600 group-hover:text-zinc-400 transition-colors shrink-0" />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Awaiting approval */}
          <div className="space-y-3">
            <h2 className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
              Awaiting My Sign-off ({pendingSheets.length})
            </h2>
            {pendingSheets.length === 0 ? (
              <div className="text-center py-10 bg-zinc-950/20 border border-zinc-900 border-dashed rounded-xl">
                <h3 className="text-xs font-bold text-zinc-400">All Clear</h3>
                <p className="text-xs text-zinc-600 mt-1">No plans are currently awaiting your review.</p>
              </div>
            ) : (
              <div className="border border-amber-500/10 rounded-xl divide-y divide-zinc-900/50 overflow-hidden bg-zinc-950/20">
                {pendingSheets.map((sheet) => (
                  <Link key={sheet.id} href={`/manager/review/${sheet.id}`}>
                    <div className="flex items-center justify-between p-4 hover:bg-zinc-900/30 transition-colors group cursor-pointer active:scale-[0.99]">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-zinc-100 font-semibold text-sm">{sheet.user.name}</h3>
                          <span className="px-2 py-0.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[9px] font-bold rounded-full uppercase">
                            {getQuarterLabel(sheet.quarter)}
                          </span>
                        </div>
                        <p className="text-xs text-zinc-500 mt-1">
                          {sheet.goals.length} objectives defined
                        </p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="px-2 py-0.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[9px] font-bold rounded-full uppercase">
                          {STATUS_LABEL[sheet.status]}
                        </span>
                        <ChevronRight size={15} className="text-zinc-600 group-hover:text-zinc-400 transition-colors" />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Finalized & Active */}
          {lockedSheets.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                Finalized Plans ({lockedSheets.length})
              </h2>
              <div className="border border-zinc-900 rounded-xl divide-y divide-zinc-900/50 overflow-hidden bg-zinc-950/10">
                {lockedSheets.map((sheet) => (
                  <Link key={sheet.id} href={`/manager/review/${sheet.id}`}>
                    <div className="flex items-center justify-between p-4 hover:bg-zinc-900/20 transition-colors group cursor-pointer">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-zinc-300 font-medium text-sm group-hover:text-zinc-100 transition-colors">
                            {sheet.user.name}
                          </h3>
                          <span className="px-2 py-0.5 bg-zinc-900 border border-zinc-800 text-zinc-400 text-[9px] font-bold rounded-full uppercase">
                            {getQuarterLabel(sheet.quarter)}
                          </span>
                        </div>
                        <p className="text-xs text-zinc-600 mt-1">
                          {sheet.goals.length} goals active
                        </p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[9px] font-bold rounded-full uppercase">
                          {STATUS_LABEL[sheet.status]}
                        </span>
                        <ChevronRight size={15} className="text-zinc-700 group-hover:text-zinc-500 transition-colors" />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Still drafting */}
          {draftSheets.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-[10px] font-bold text-blue-400/70 uppercase tracking-wider">
                In Planning Workspace ({draftSheets.length})
              </h2>
              <div className="border border-blue-500/10 rounded-xl divide-y divide-zinc-900/50 overflow-hidden bg-zinc-950/10">
                {draftSheets.map((sheet) => (
                  <div key={sheet.id} className="flex items-center justify-between p-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-zinc-400 font-medium text-sm">{sheet.user.name}</h3>
                        <span className="px-2 py-0.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[9px] font-bold rounded-full uppercase">
                          {getQuarterLabel(sheet.quarter)}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-600 mt-1">
                        {sheet.goals.length} goals drafted
                      </p>
                    </div>
                    <span className="px-2 py-0.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[9px] font-bold rounded-full uppercase">
                      Drafting
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: Activity feed */}
        <div className="lg:col-span-1">
          <h2 className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <Activity size={13} className="text-zinc-500" /> Team Activity
          </h2>
          <div className="bg-zinc-950/40 p-4 rounded-xl border border-zinc-900">
            <RecentActivityFeed limit={10} userId={session.user.id} />
          </div>
        </div>
      </div>
    </div>
  );
}
