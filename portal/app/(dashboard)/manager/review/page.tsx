import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/authOptions";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ChevronRight, Activity, CheckCircle, Clock, Calendar, AlertTriangle } from "lucide-react";
import { RecentActivityFeed } from "@/components/audit/RecentActivityFeed";

export default async function ManagerReviewPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  if (session.user.role !== "MANAGER" && session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const activeCycle = await prisma.goalCycle.findFirst({ where: { isActive: true } });

  const sheets = await prisma.goalSheet.findMany({
    where: {
      cycleId: activeCycle?.id,
      user: { managerId: session.user.id },
    },
    include: {
      user: true,
      cycle: true,
      goals: true
    },
    orderBy: { updatedAt: "desc" }
  });

  const pendingSheets = sheets.filter(s => s.status === "SUBMITTED" || s.status === "UNDER_REVIEW");
  const lockedSheets = sheets.filter(s => s.status === "APPROVED" || s.status === "LOCKED");
  const draftSheets = sheets.filter(s => s.status === "DRAFT");

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6 select-none">
      {/* Header section with refined naming */}
      <div className="mb-8 border-b border-zinc-900 pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-150 tracking-tight flex items-center gap-2">
            <CheckCircle size={22} className="text-emerald-450" />
            Manager Approvals
          </h1>
          <p className="text-xs text-zinc-500 mt-1">Review, calibrate, and authorize upcoming plans proposed by your team.</p>
        </div>
        <div className="flex gap-3">
          <div className="px-3.5 py-1.5 bg-zinc-950 border border-zinc-900 rounded-lg flex items-center gap-2">
            <Clock size={14} className="text-amber-500" />
            <span className="text-xs font-bold text-zinc-400">Pending Actions: {pendingSheets.length}</span>
          </div>
          <div className="px-3.5 py-1.5 bg-zinc-950 border border-zinc-900 rounded-lg flex items-center gap-2">
            <Calendar size={14} className="text-blue-500" />
            <span className="text-xs font-bold text-zinc-400">Planning: {draftSheets.length}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          
          {/* Action Required Section */}
          <div className="space-y-4">
            <h2 className="text-xs font-bold text-zinc-450 uppercase tracking-wider mb-3">Awaiting My Authorization</h2>
            {pendingSheets.length === 0 ? (
              <div className="text-center py-10 bg-zinc-950/20 border border-zinc-900 border-dashed rounded-xl select-none">
                <h3 className="text-xs font-bold text-zinc-400">All Captured & Authorized</h3>
                <p className="text-xs text-zinc-650 mt-1">No plans are currently awaiting your signature.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {pendingSheets.map(sheet => (
                  <Link key={sheet.id} href={`/manager/review/${sheet.id}`}>
                    <div className="flex items-center justify-between p-4 bg-zinc-900/40 hover:bg-zinc-900/60 border border-amber-500/10 hover:border-amber-500/20 transition-all rounded-xl group cursor-pointer active:scale-[0.99] shadow-sm">
                      <div>
                        <div className="flex items-center gap-2.5">
                          <h3 className="text-zinc-150 font-semibold text-sm group-hover:text-zinc-100 transition-colors">{sheet.user.name}</h3>
                          <span className="px-2 py-0.5 text-[9px] font-bold bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-full uppercase tracking-wider">{sheet.quarter}</span>
                        </div>
                        <p className="text-xs text-zinc-500 mt-1">{sheet.goals.length} performance objectives defined</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="px-2 py-0.5 text-[9px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full uppercase tracking-wider">
                          Awaiting Approval
                        </span>
                        <ChevronRight className="text-zinc-650 group-hover:text-zinc-400 transition-colors" size={16} />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Finalized & Active Section */}
          <div className="space-y-4">
            <h2 className="text-xs font-bold text-zinc-450 uppercase tracking-wider mb-3">Finalized & Active Plans</h2>
            {lockedSheets.length === 0 ? (
              <p className="text-zinc-650 text-xs italic">No finalized plans exist yet for this cycle.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {lockedSheets.map(sheet => (
                  <Link key={sheet.id} href={`/manager/review/${sheet.id}`}>
                    <div className="flex items-center justify-between p-4 bg-zinc-950/40 hover:bg-zinc-900/40 border border-zinc-900 hover:border-zinc-850 rounded-xl transition-all group cursor-pointer active:scale-[0.99] shadow-sm">
                      <div>
                        <div className="flex items-center gap-2.5">
                          <h3 className="text-zinc-350 font-semibold text-sm group-hover:text-zinc-200 transition-colors">{sheet.user.name}</h3>
                          <span className="px-2 py-0.5 text-[9px] font-bold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full uppercase tracking-wider">{sheet.quarter}</span>
                        </div>
                        <p className="text-xs text-zinc-550 mt-1">{sheet.goals.length} operational goals active</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="px-2 py-0.5 text-[9px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full uppercase tracking-wider">
                          {sheet.status === "LOCKED" ? "Finalized" : "Approved"}
                        </span>
                        <ChevronRight className="text-zinc-700 group-hover:text-zinc-550 transition-colors" size={16} />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Still Drafting/Planning Section */}
          {draftSheets.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xs font-bold text-zinc-450 uppercase tracking-wider mb-3">In Planning Workspace</h2>
              <div className="flex flex-col gap-3">
                {draftSheets.map(sheet => (
                  <div key={sheet.id} className="flex items-center justify-between p-4 bg-zinc-950/20 border border-zinc-900/60 rounded-xl">
                    <div>
                      <div className="flex items-center gap-2.5">
                        <h3 className="text-zinc-350 font-medium text-sm">{sheet.user.name}</h3>
                        <span className="px-2 py-0.5 text-[9px] font-bold bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-full uppercase tracking-wider">{sheet.quarter}</span>
                      </div>
                      <p className="text-xs text-zinc-550 mt-1">{sheet.goals.length} goals in draft</p>
                    </div>
                    <span className="px-2 py-0.5 text-[9px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full uppercase tracking-wider">
                      Drafting
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right side aligned feed activity */}
        <div className="lg:col-span-1 space-y-6">
          <div>
            <h2 className="text-xs font-bold text-zinc-450 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Activity size={14} className="text-zinc-500" /> Team Activity
            </h2>
            <div className="bg-zinc-950/50 p-4 rounded-xl border border-zinc-900">
              <RecentActivityFeed limit={10} userId={session.user.id} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
