import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/authOptions";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { CycleManagement } from "@/components/admin/CycleManagement";
import { UnlockModal } from "@/components/admin/UnlockModal";
import { Users, FileText, Lock, Calendar, Activity, CheckCircle, XCircle, Unlock, ArrowRight } from "lucide-react";
import { RecentActivityFeed } from "@/components/audit/RecentActivityFeed";
import { formatAuditAction, formatAuditTimestamp } from "@/lib/auditFormatter";

export default async function AdminGovernancePage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const resolvedParams = await searchParams;
  const currentTab = resolvedParams.tab || "overview";

  // Fetch cycles
  const cycles = await prisma.goalCycle.findMany({
    orderBy: { startDate: "desc" }
  });

  const activeCycle = cycles.find(c => c.isActive);

  // Fetch overall completion metrics
  const totalEmployees = await prisma.user.count({
    where: { role: { in: ["EMPLOYEE", "MANAGER"] } }
  });

  const sheets = await prisma.goalSheet.findMany({
    where: { cycleId: activeCycle?.id },
    include: { user: true }
  });

  const lockedCount = sheets.filter(s => s.status === "LOCKED" || s.status === "APPROVED").length;
  const draftCount = sheets.filter(s => s.status === "DRAFT").length;
  const reviewCount = sheets.filter(s => s.status === "UNDER_REVIEW" || s.status === "SUBMITTED").length;

  // If in audit tab, fetch all audits
  let auditLogs: any[] = [];
  if (currentTab === "audit") {
    auditLogs = await prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      include: { actor: true },
      take: 50
    });
  }

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-100 tracking-tight">Governance & Administration</h1>
        <p className="text-sm text-zinc-400 mt-1">Configure cycles, monitor organizational completion rates, manage goal sheet locks, and review system audit trails.</p>
      </div>

      {/* Tabs navigation */}
      <div className="flex border-b border-zinc-800 gap-6">
        <Link 
          href="/admin/governance?tab=overview" 
          className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
            currentTab === "overview" 
              ? "border-blue-500 text-zinc-100" 
              : "border-transparent text-zinc-500 hover:text-zinc-300"
          }`}
        >
          System Overview & Cycles
        </Link>
        <Link 
          href="/admin/governance?tab=audit" 
          className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
            currentTab === "audit" 
              ? "border-blue-500 text-zinc-100" 
              : "border-transparent text-zinc-500 hover:text-zinc-300"
          }`}
        >
          Approval & Workflow Audit Trail
        </Link>
      </div>

      {currentTab === "overview" ? (
        <>
          {/* Top Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-5 bg-zinc-900 border border-zinc-800 rounded-xl flex items-center gap-4">
              <div className="p-3 bg-blue-500/10 text-blue-400 rounded-lg"><Users size={24} /></div>
              <div>
                <p className="text-sm text-zinc-400">Total Participants</p>
                <p className="text-2xl font-semibold text-zinc-100">{totalEmployees}</p>
              </div>
            </div>
            <div className="p-5 bg-zinc-900 border border-zinc-800 rounded-xl flex items-center gap-4">
              <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-lg"><Lock size={24} /></div>
              <div>
                <p className="text-sm text-zinc-400">Locked / Approved</p>
                <p className="text-2xl font-semibold text-zinc-100">{lockedCount}</p>
              </div>
            </div>
            <div className="p-5 bg-zinc-900 border border-zinc-800 rounded-xl flex items-center gap-4">
              <div className="p-3 bg-amber-500/10 text-amber-400 rounded-lg"><FileText size={24} /></div>
              <div>
                <p className="text-sm text-zinc-400">Pending Review</p>
                <p className="text-2xl font-semibold text-zinc-100">{reviewCount}</p>
              </div>
            </div>
            <div className="p-5 bg-zinc-900 border border-zinc-800 rounded-xl flex items-center gap-4">
              <div className="p-3 bg-zinc-800 text-zinc-400 rounded-lg"><Calendar size={24} /></div>
              <div>
                <p className="text-sm text-zinc-400">In Draft</p>
                <p className="text-2xl font-semibold text-zinc-100">{draftCount}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-medium text-zinc-100">Goal Sheet Overrides</h2>
                  <span className="text-xs text-zinc-500 bg-zinc-900 px-2 py-1 rounded">Active Cycle: {activeCycle?.name || "None"}</span>
                </div>
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
                  {lockedCount === 0 ? (
                    <div className="p-8 text-center text-zinc-500">No locked or approved sheets available to manage.</div>
                  ) : (
                    <div className="divide-y divide-zinc-800/80">
                      {sheets.filter(s => s.status === "LOCKED" || s.status === "APPROVED").map(sheet => (
                        <div key={sheet.id} className="p-4 flex items-center justify-between hover:bg-zinc-800/30 transition-colors">
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-zinc-200 font-medium">{sheet.user.name}</h4>
                              {sheet.unlockRequested && (
                                <span className="px-2 py-0.5 bg-amber-500/10 text-amber-500 text-[10px] font-semibold uppercase tracking-wider rounded">Unlock Requested</span>
                              )}
                            </div>
                            <p className="text-xs text-zinc-500">{sheet.user.email}</p>
                            {sheet.unlockRequested && (
                              <p className="text-xs text-amber-400/80 mt-1 italic max-w-md">Reason: "{sheet.unlockReason}"</p>
                            )}
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="px-2 py-1 bg-emerald-500/10 text-emerald-400 text-xs font-medium rounded">Locked</span>
                            <UnlockModal sheetId={sheet.id} userName={sheet.user.name} />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-medium text-zinc-100 flex items-center gap-2">
                    <Activity size={20} className="text-zinc-400" /> Platform Activity
                  </h2>
                  <Link href="/admin/governance?tab=audit" className="text-xs text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1">
                    View Full Audit Trail <ArrowRight size={12} />
                  </Link>
                </div>
                <div className="bg-zinc-950 p-6 rounded-xl border border-zinc-800">
                  <RecentActivityFeed limit={10} />
                </div>
              </div>
            </div>

            <div className="lg:col-span-1">
              <CycleManagement cycles={cycles} activeCycle={activeCycle} />
            </div>
          </div>
        </>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-medium text-zinc-100">Workflow Audit Logs</h2>
              <p className="text-xs text-zinc-400 mt-0.5">Chronological record of submissions, approvals, rejections, and unlocks across the organization.</p>
            </div>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-zinc-950 border-b border-zinc-800 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                    <th className="py-3.5 px-4">Timestamp</th>
                    <th className="py-3.5 px-4">Actor</th>
                    <th className="py-3.5 px-4">Action Event</th>
                    <th className="py-3.5 px-4">Entity Type</th>
                    <th className="py-3.5 px-4">Entity Identifier</th>
                    <th className="py-3.5 px-4">Changes & Overrides</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60 text-sm">
                  {auditLogs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-zinc-500 font-medium">No audit logs recorded yet.</td>
                    </tr>
                  ) : (
                    auditLogs.map((audit) => {
                      const { text, icon: Icon, color } = formatAuditAction(audit.action, audit.entityType, audit.newValues);
                      
                      return (
                        <tr key={audit.id} className="hover:bg-zinc-800/20 transition-colors">
                          <td className="py-4 px-4 text-zinc-400 whitespace-nowrap text-xs">
                            {formatAuditTimestamp(audit.createdAt)}
                          </td>
                          <td className="py-4 px-4 font-medium text-zinc-200">
                            <div>
                              <span>{audit.actor.name}</span>
                              <span className="block text-[10px] text-zinc-500 font-mono tracking-tighter uppercase">{audit.actor.role}</span>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-2">
                              <span className={`p-1 rounded-full ${color}`}>
                                <Icon size={12} />
                              </span>
                              <span className="text-zinc-300 text-xs">{text}</span>
                            </div>
                          </td>
                          <td className="py-4 px-4 text-zinc-400 text-xs font-mono">{audit.entityType}</td>
                          <td className="py-4 px-4 text-zinc-500 text-xs font-mono select-all">{audit.entityId}</td>
                          <td className="py-4 px-4 text-xs text-zinc-400 max-w-xs truncate">
                            {audit.newValues && (
                              <div className="font-mono text-zinc-400 bg-zinc-950 p-2 rounded border border-zinc-800/80 max-h-24 overflow-y-auto whitespace-pre-wrap leading-relaxed">
                                {JSON.stringify(audit.newValues, null, 2)}
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
            <div className="p-4 bg-zinc-950 border-t border-zinc-800 text-center text-xs text-zinc-500">
              Showing the latest 50 system administration events.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
