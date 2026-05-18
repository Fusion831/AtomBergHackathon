import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/authOptions";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { CycleManagement } from "@/components/admin/CycleManagement";
import { UnlockModal } from "@/components/admin/UnlockModal";
import { Users, FileText, Lock, Calendar, Activity, CheckCircle, XCircle, Unlock, ArrowRight, ShieldAlert, CheckSquare } from "lucide-react";
import { RecentActivityFeed } from "@/components/audit/RecentActivityFeed";
import { formatAuditAction, formatAuditTimestamp, AuditWithActor } from "@/lib/auditFormatter";
import { CheckInPeriod } from "@prisma/client";

export default async function AdminGovernancePage({ searchParams }: { searchParams: Promise<{ tab?: string; quarter?: string }> }) {
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

  const activeCycle = cycles.find((c: { isActive: boolean }) => c.isActive);
  const selectedQuarter = (resolvedParams.quarter || activeCycle?.activeQuarter || "Q2") as CheckInPeriod;

  // Fetch overall metrics
  const totalEmployees = await prisma.user.count({
    where: { role: { in: ["EMPLOYEE", "MANAGER"] } }
  });

  const sheets = await prisma.goalSheet.findMany({
    where: { 
      cycleId: activeCycle?.id,
      quarter: selectedQuarter
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          empId: true
        }
      }
    }
  });

  const lockedCount = sheets.filter(s => s.status === "LOCKED" || s.status === "APPROVED").length;
  const draftCount = sheets.filter(s => s.status === "DRAFT").length;
  const reviewCount = sheets.filter(s => s.status === "UNDER_REVIEW" || s.status === "SUBMITTED").length;

  // Segment unlock override requests vs standard locked sheets
  const unlockRequests = sheets.filter(s => s.status === "LOCKED" && s.unlockRequested);
  const standardLockedSheets = sheets.filter(s => s.status === "LOCKED" && !s.unlockRequested);
  const approvedSheets = sheets.filter(s => s.status === "APPROVED");
  const finalizedSheets = [...standardLockedSheets, ...approvedSheets];

  // Fetch department completions dynamically
  const depts = await prisma.department.findMany({
    include: {
      users: {
        where: { role: { in: ["EMPLOYEE", "MANAGER"] } },
        include: {
          goalSheets: {
            where: { cycleId: activeCycle?.id, quarter: selectedQuarter }
          }
        }
      }
    }
  });

  const departmentCompletions = depts.map(dept => {
    const totalDeptUsers = dept.users.length;
    const completedDeptSheets = dept.users.filter(u => 
      u.goalSheets.some(s => s.status === "LOCKED" || s.status === "APPROVED")
    ).length;
    return {
      name: dept.name,
      percentage: totalDeptUsers > 0 ? Math.min(Math.round((completedDeptSheets / totalDeptUsers) * 100), 100) : 0,
      completed: completedDeptSheets,
      total: totalDeptUsers
    };
  });

  // Fetch audit logs
  let auditLogs: any[] = [];
  if (currentTab === "audit") {
    auditLogs = await prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        actor: {
          select: {
            id: true,
            name: true,
            role: true,
            empId: true
          }
        }
      },
      take: 50
    });
  }

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 space-y-8 select-none">
      {/* Control Tower Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-900 pb-6">
        <div>
          <h1 className="text-2xl font-bold text-zinc-150 tracking-tight flex items-center gap-2.5">
            <CheckCircle size={24} className="text-blue-450" />
            Operations Center
          </h1>
          <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
            System Control Tower: Monitor cycle transitions, authorize plan overrides, and audit organizational consensus events.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {activeCycle && (
            <div className="flex items-center gap-2 bg-zinc-950/60 px-3 py-1.5 border border-zinc-900 rounded-lg">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Active: Q2 Execution &bull; Q3 Planning</span>
            </div>
          )}
        </div>
      </div>

      {/* Tabs navigation with modern minimal Vercel styling */}
      <div className="flex border-b border-zinc-900 gap-6 text-xs font-semibold">
        <Link 
          href="/admin/governance?tab=overview" 
          className={`pb-3 border-b-2 transition-colors ${
            currentTab === "overview" 
              ? "border-blue-500 text-zinc-100" 
              : "border-transparent text-zinc-550 hover:text-zinc-350"
          }`}
        >
          Cycle Operations & Overrides
        </Link>
        <Link 
          href="/admin/governance?tab=audit" 
          className={`pb-3 border-b-2 transition-colors ${
            currentTab === "audit" 
              ? "border-blue-500 text-zinc-100" 
              : "border-transparent text-zinc-550 hover:text-zinc-350"
          }`}
        >
          Consensus & Workflow Audit Trail
        </Link>
      </div>

      {currentTab === "overview" ? (
        <>
          {/* Executive Analytics Summary - gorgeous visual metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 bg-zinc-900/40 border border-zinc-900 rounded-xl flex items-center gap-4">
              <div className="p-2.5 bg-zinc-950 text-zinc-455 border border-zinc-900 rounded-lg"><Users size={16} /></div>
              <div>
                <p className="text-[9px] font-bold text-zinc-550 uppercase tracking-wider">Total Participants</p>
                <p className="text-xl font-extrabold text-zinc-100 font-mono mt-0.5">{totalEmployees}</p>
              </div>
            </div>
            
            <div className="p-4 bg-zinc-900/40 border border-zinc-900 rounded-xl flex items-center gap-4">
              <div className="p-2.5 bg-emerald-500/10 text-emerald-450 border border-emerald-500/20 rounded-lg"><Lock size={16} /></div>
              <div>
                <p className="text-[9px] font-bold text-zinc-550 uppercase tracking-wider">Finalized / Active</p>
                <p className="text-xl font-extrabold text-emerald-450 font-mono mt-0.5">{lockedCount}</p>
              </div>
            </div>

            <div className="p-4 bg-zinc-900/40 border border-zinc-900 rounded-xl flex items-center gap-4">
              <div className="p-2.5 bg-amber-500/10 text-amber-450 border border-amber-500/20 rounded-lg"><FileText size={16} /></div>
              <div>
                <p className="text-[9px] font-bold text-zinc-550 uppercase tracking-wider">Awaiting Approval</p>
                <p className="text-xl font-extrabold text-amber-450 font-mono mt-0.5">{reviewCount}</p>
              </div>
            </div>

            <div className="p-4 bg-zinc-900/40 border border-zinc-900 rounded-xl flex items-center gap-4">
              <div className="p-2.5 bg-blue-500/10 text-blue-450 border border-blue-500/20 rounded-lg"><Calendar size={16} /></div>
              <div>
                <p className="text-[9px] font-bold text-zinc-550 uppercase tracking-wider">In Planning Workspace</p>
                <p className="text-xl font-extrabold text-blue-450 font-mono mt-0.5">{draftCount}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              
              {/* Overrides Table */}
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-1">
                  <div>
                    <h2 className="text-xs font-bold text-zinc-450 uppercase tracking-wider">
                      Quarter Plan Overrides
                    </h2>
                    <p className="text-[11px] text-zinc-500 mt-1 leading-relaxed">Review recommendation logs, authorize overrides, and unlock finalized sheets.</p>
                  </div>
                  
                  {/* Select Quarter Filter */}
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="flex bg-zinc-950 p-0.5 rounded-lg border border-zinc-900 text-[10px] font-bold">
                      <Link 
                        href={`/admin/governance?tab=overview&quarter=Q2`}
                        className={`px-2.5 py-1 rounded-md font-bold transition-all uppercase tracking-wider ${
                          selectedQuarter === "Q2" 
                            ? "bg-zinc-900 text-zinc-100 shadow-sm border border-zinc-800" 
                            : "text-zinc-650 hover:text-zinc-400"
                        }`}
                      >
                        Q2 Performance
                      </Link>
                      <Link 
                        href={`/admin/governance?tab=overview&quarter=Q3`}
                        className={`px-2.5 py-1 rounded-md font-bold transition-all uppercase tracking-wider ${
                          selectedQuarter === "Q3" 
                            ? "bg-zinc-900 text-zinc-100 shadow-sm border border-zinc-800" 
                            : "text-zinc-650 hover:text-zinc-400"
                        }`}
                      >
                        Q3 Planning
                      </Link>
                    </div>
                  </div>
                </div>

                {/* 1. CRITICAL UNLOCK REQUESTS SECTOR */}
                {unlockRequests.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-[10px] font-extrabold text-amber-500 uppercase tracking-wider flex items-center gap-1.5">
                      <ShieldAlert size={12} className="animate-pulse" />
                      SLA Priority Overrides Requested ({unlockRequests.length})
                    </h3>
                    <div className="bg-zinc-950/20 border border-amber-500/10 rounded-2xl overflow-hidden shadow-2xl">
                      <div className="divide-y divide-zinc-900/50">
                        {unlockRequests.map(sheet => (
                          <div key={sheet.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-zinc-950/40 transition-colors">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <h4 className="text-zinc-150 font-bold text-sm">{sheet.user.name}</h4>
                                <span className="px-1.5 py-0.5 bg-amber-500/10 text-amber-550 border border-amber-500/20 text-[9px] font-bold uppercase rounded-md tracking-wider">
                                  {sheet.quarter} Request
                                </span>
                              </div>
                              <p className="text-[11px] text-zinc-550 font-medium">{sheet.user.email} &bull; Emp ID: {sheet.user.empId}</p>
                              
                              <div className="bg-zinc-950/80 p-3 border border-zinc-900/80 rounded-xl mt-2 text-xs leading-relaxed max-w-lg">
                                <span className="block text-[8px] font-bold text-amber-500 uppercase tracking-widest mb-1">Override Request Justification</span>
                                <p className="text-zinc-400 italic">"{sheet.unlockReason}"</p>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-4 shrink-0 self-end md:self-center">
                              <span className="px-2.5 py-0.5 bg-amber-500/10 text-amber-450 border border-amber-500/20 text-[9px] font-extrabold rounded-full uppercase tracking-wider animate-pulse flex items-center gap-1">
                                <Unlock size={8} /> SLA Urgency
                              </span>
                              <UnlockModal sheetId={sheet.id} userName={sheet.user.name} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                
                {/* 2. REGULAR FINALIZED PLANS SECTOR */}
                <div className="space-y-3">
                  <h3 className="text-[10px] font-extrabold text-zinc-450 uppercase tracking-wider">
                    Finalized Plans & Active Execution Workspace ({finalizedSheets.length})
                  </h3>
                  <div className="bg-zinc-950/20 border border-zinc-900 rounded-2xl overflow-hidden shadow-sm">
                    {finalizedSheets.length === 0 ? (
                      <div className="p-8 text-center text-zinc-550 text-xs italic">No finalized plans found for this quarter.</div>
                    ) : (
                      <div className="divide-y divide-zinc-950">
                        {finalizedSheets.map(sheet => (
                          <div key={sheet.id} className="p-4 flex items-center justify-between hover:bg-zinc-900/10 transition-colors">
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="text-zinc-150 font-bold text-sm">{sheet.user.name}</h4>
                                <span className="px-1.5 py-0.5 bg-zinc-900 border border-zinc-800 text-zinc-400 rounded-md text-[9px] font-bold uppercase tracking-wider">{sheet.quarter}</span>
                              </div>
                              <p className="text-xs text-zinc-500 mt-0.5">{sheet.user.email} &bull; Emp ID: {sheet.user.empId}</p>
                            </div>
                            <div className="flex items-center gap-4 shrink-0">
                              <span className="px-2.5 py-0.5 bg-emerald-500/10 text-emerald-450 border border-emerald-500/20 text-[9px] font-bold rounded-full uppercase tracking-wider">Locked</span>
                              <UnlockModal sheetId={sheet.id} userName={sheet.user.name} />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Platform Activity */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xs font-bold text-zinc-450 uppercase tracking-wider flex items-center gap-1.5">
                    <Activity size={14} className="text-zinc-500" /> Platform Activity Feed
                  </h2>
                  <Link href="/admin/governance?tab=audit" className="text-xs text-blue-400 hover:text-blue-300 font-bold flex items-center gap-1">
                    View Full Audit Trail <ArrowRight size={12} />
                  </Link>
                </div>
                <div className="bg-zinc-950/40 p-5 rounded-2xl border border-zinc-900">
                  <RecentActivityFeed limit={10} />
                </div>
              </div>
            </div>

            {/* Right sidebar: Cycle management & Dynamic Department Heatmap */}
            <div className="lg:col-span-1 space-y-6">
              <CycleManagement cycles={cycles} activeCycle={activeCycle} />

              {/* Dynamic Department Compliance Heatmap panel */}
              <div className="bg-zinc-900/40 border border-zinc-900 rounded-2xl p-5 space-y-4">
                <h3 className="text-xs font-bold text-zinc-450 uppercase tracking-wider flex items-center gap-1.5">
                  <CheckSquare size={14} className="text-zinc-500" /> Department Compliance Matrix
                </h3>
                <p className="text-[11px] text-zinc-550 leading-relaxed">
                  Real-time planning compliance rates per department dynamically calculated from performance database.
                </p>
                <div className="space-y-3.5 pt-1">
                  {departmentCompletions.map((dept, idx) => {
                    const colors = ["bg-cyan-500", "bg-emerald-500", "bg-amber-500", "bg-rose-500", "bg-purple-500", "bg-blue-500"];
                    const dotColors = ["bg-cyan-500", "bg-emerald-500", "bg-amber-500", "bg-rose-500", "bg-purple-500", "bg-blue-500"];
                    
                    return (
                      <div key={dept.name} className="space-y-1">
                        <div className="flex justify-between text-[11px] font-semibold text-zinc-400">
                          <span className="flex items-center gap-1.5">
                            <span className={`w-1.5 h-1.5 rounded-full ${dotColors[idx % dotColors.length]}`}></span>
                            {dept.name}
                          </span>
                          <span className="font-mono text-zinc-350">{dept.percentage}% Compliance</span>
                        </div>
                        <div className="h-1.5 w-full bg-zinc-950 rounded-full overflow-hidden">
                          <div className={`h-full ${colors[idx % colors.length]} transition-all duration-500`} style={{ width: `${dept.percentage}%` }}></div>
                        </div>
                        <div className="flex justify-end text-[9px] font-bold text-zinc-650 tracking-wider uppercase">
                          <span>{dept.completed} / {dept.total} locked</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </>
      ) : (
        /* Workflow Audit Logs Section */
        <div className="space-y-4 animate-in fade-in-50 duration-300">
          <div>
            <h2 className="text-xs font-bold text-zinc-450 uppercase tracking-wider">Workflow Audit Logs</h2>
            <p className="text-[11px] text-zinc-550 mt-1 leading-relaxed">Consensus log of plan proposals, manager approvals, target overrides, and system unlocks.</p>
          </div>

          <div className="bg-zinc-900/40 border border-zinc-900 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-zinc-950 border-b border-zinc-900 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                    <th className="py-3 px-4">Timestamp</th>
                    <th className="py-3 px-4">Actor</th>
                    <th className="py-3 px-4">Action Event</th>
                    <th className="py-3 px-4">Entity Type</th>
                    <th className="py-3 px-4">Identifier</th>
                    <th className="py-3 px-4">Overrides Log</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-950 text-xs">
                  {auditLogs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-zinc-550 font-bold italic">No consensus logs recorded yet.</td>
                    </tr>
                  ) : (
                    auditLogs.map((audit: AuditWithActor) => {
                      const { text, icon: Icon, color } = formatAuditAction(audit.action, audit.entityType, audit.newValues);
                      
                      return (
                        <tr key={audit.id} className="hover:bg-zinc-900/10 transition-colors">
                          <td className="py-4 px-4 text-zinc-500 whitespace-nowrap text-[10px] font-mono">
                            {formatAuditTimestamp(audit.createdAt)}
                          </td>
                          <td className="py-4 px-4">
                            <div>
                              <span className="font-bold text-zinc-350">{audit.actor?.name || "System"}</span>
                              <span className="block text-[8px] text-zinc-550 font-bold tracking-wider uppercase mt-0.5">{audit.actor?.role || "SYSTEM"}</span>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-2">
                              <span className={`p-1 rounded-md ${color}`}>
                                <Icon size={12} />
                              </span>
                              <span className="text-zinc-350 font-semibold text-[11px]">{text}</span>
                            </div>
                          </td>
                          <td className="py-4 px-4 text-zinc-500 text-[10px] font-mono">{audit.entityType}</td>
                          <td className="py-4 px-4 text-zinc-650 text-[10px] font-mono select-all">{audit.entityId.substring(0, 12)}...</td>
                          <td className="py-4 px-4 max-w-xs truncate">
                            {audit.newValues && (
                              <div className="font-mono text-zinc-450 bg-zinc-950 p-2 border border-zinc-900 rounded-lg max-h-20 overflow-y-auto whitespace-pre-wrap leading-relaxed text-[10px]">
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
            <div className="p-3 bg-zinc-950 border-t border-zinc-900 text-center text-[10px] font-semibold text-zinc-555 uppercase tracking-wider">
              Operations Center Log Consensus Queue &bull; Showing latest 50 logs
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
