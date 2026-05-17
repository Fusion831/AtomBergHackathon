import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/authOptions";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ChevronRight, Activity } from "lucide-react";
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
    <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6">
      <div className="mb-8 border-b border-zinc-800 pb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-100 tracking-tight">Team Goal Reviews</h1>
          <p className="text-sm text-zinc-400 mt-1">Review and approve your team's submitted goal sheets.</p>
        </div>
        <div className="px-4 py-1.5 bg-zinc-900 border border-zinc-800 rounded-md">
          <span className="text-sm font-medium text-zinc-300">Pending Approvals: {pendingSheets.length}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="space-y-4">
            <h2 className="text-lg font-medium text-zinc-100 mb-4">Pending Your Review</h2>
            {pendingSheets.length === 0 ? (
              <div className="text-center py-12 bg-zinc-900/20 border border-zinc-800 border-dashed rounded-xl">
                <h3 className="text-zinc-300 font-medium">All caught up</h3>
                <p className="text-zinc-500 text-sm mt-1">No goal sheets are currently pending your approval.</p>
              </div>
            ) : (
              pendingSheets.map(sheet => (
                <Link key={sheet.id} href={`/manager/review/${sheet.id}`}>
                  <div className="flex items-center justify-between p-5 bg-zinc-900 hover:bg-zinc-800/80 border border-zinc-800 hover:border-zinc-700 transition-colors rounded-xl group cursor-pointer">
                    <div>
                      <h3 className="text-zinc-100 font-medium">{sheet.user.name}</h3>
                      <p className="text-sm text-zinc-400 mt-0.5">{sheet.goals.length} goals submitted</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="px-2.5 py-1 text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full">
                        {sheet.status === "UNDER_REVIEW" ? "Under Review" : "Needs Review"}
                      </span>
                      <ChevronRight className="text-zinc-500 group-hover:text-zinc-300 transition-colors" size={20} />
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>

          <div className="space-y-4">
            <h2 className="text-lg font-medium text-zinc-100 mb-4">Approved & Locked</h2>
            {lockedSheets.length === 0 ? (
              <p className="text-zinc-500 text-sm">No approved sheets yet.</p>
            ) : (
              lockedSheets.map(sheet => (
                <Link key={sheet.id} href={`/manager/review/${sheet.id}`}>
                  <div className="flex items-center justify-between p-4 bg-zinc-950 hover:bg-zinc-900/80 border border-zinc-800/50 hover:border-zinc-700 rounded-xl transition-colors group cursor-pointer">
                    <div>
                      <h3 className="text-zinc-300 font-medium">{sheet.user.name}</h3>
                      <p className="text-xs text-zinc-500 mt-0.5">{sheet.goals.length} goals approved</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="px-2.5 py-1 text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full">
                        {sheet.status === "LOCKED" ? "Locked" : "Approved"}
                      </span>
                      <ChevronRight className="text-zinc-600 group-hover:text-zinc-300 transition-colors" size={20} />
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>

          {draftSheets.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-medium text-zinc-100 mb-4">Still Drafting</h2>
              {draftSheets.map(sheet => (
                <div key={sheet.id} className="flex items-center justify-between p-4 bg-zinc-950 border border-zinc-800/50 rounded-xl">
                  <div>
                    <h3 className="text-zinc-300 font-medium">{sheet.user.name}</h3>
                    <p className="text-xs text-zinc-500 mt-0.5">{sheet.goals.length} goals drafted so far</p>
                  </div>
                  <span className="px-2.5 py-1 text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full">
                    In Draft
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="lg:col-span-1">
          <h2 className="text-lg font-medium text-zinc-100 mb-4 flex items-center gap-2">
            <Activity size={18} className="text-zinc-400" /> Team Activity
          </h2>
          <div className="bg-zinc-950 p-5 rounded-xl border border-zinc-800">
            <RecentActivityFeed limit={10} userId={session.user.id} />
          </div>
        </div>
      </div>
    </div>
  );
}
