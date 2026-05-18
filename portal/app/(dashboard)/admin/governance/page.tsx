import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/authOptions";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { CycleManagement } from "@/components/admin/CycleManagement";
import { UnlockModal } from "@/components/admin/UnlockModal";
import {
  Users, Calendar, Activity, CheckCircle, Unlock, ArrowRight,
  ShieldAlert, CheckSquare, Clock, Lock
} from "lucide-react";
import { RecentActivityFeed } from "@/components/audit/RecentActivityFeed";
import { formatAuditAction, formatAuditTimestamp, AuditWithActor } from "@/lib/auditFormatter";
import { CheckInPeriod } from "@prisma/client";
import { getLifecycleAwareCycle, getQuarterLabel, resolveHistoricalQuarter } from "@/lib/quarterLifecycle";

export default async function AdminGovernancePage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; quarter?: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const resolvedParams = await searchParams;
  const currentTab = resolvedParams.tab || "overview";

  // Fetch cycles
  const cycles = await prisma.goalCycle.findMany({ orderBy: { startDate: "desc" } });
  const rawCycle = cycles.find((c) => c.isActive) ?? null;
  const activeCycle = getLifecycleAwareCycle(rawCycle);

  const activeQuarter = activeCycle?.activeQuarter ?? null;
  const planningQuarter = activeCycle?.planningQuarter ?? null;
  const historicalQuarter = resolveHistoricalQuarter(activeQuarter);

  // Default quarter filter for overrides table
  const selectedQuarter = (resolvedParams.quarter ||
    activeQuarter ||
    "Q2") as CheckInPeriod;

  // ── Global Metrics ──────────────────────────────────────────────
  const totalEmployees = await prisma.user.count({
    where: { role: { in: ["EMPLOYEE", "MANAGER"] } },
  });

  const executionSheets = activeQuarter
    ? await prisma.goalSheet.findMany({
        where: { cycleId: activeCycle?.id ?? "none", quarter: activeQuarter },
        include: { user: { select: { id: true, name: true, email: true, empId: true } } },
      })
    : [];

  const lockedCount = executionSheets.filter(
    (s) => s.status === "LOCKED" || s.status === "APPROVED"
  ).length;

  const pendingReviewsCount = await prisma.goalSheet.count({
    where: {
      cycleId: activeCycle?.id ?? "none",
      status: { in: ["SUBMITTED", "UNDER_REVIEW"] },
    },
  });

  // Planning readiness
  const planningSheets = planningQuarter
    ? await prisma.goalSheet.findMany({
        where: { cycleId: activeCycle?.id ?? "none", quarter: planningQuarter },
      })
    : [];
  const planningCompleted = planningSheets.filter(
    (s) => s.status === "LOCKED" || s.status === "APPROVED"
  ).length;
  const planningReadinessRate =
    totalEmployees > 0
      ? Math.min(Math.round((planningCompleted / totalEmployees) * 100), 100)
      : 0;
  const pendingSubmissionsCount = planningSheets.filter(
    (s) => s.status === "DRAFT"
  ).length;

  const executionCompletionRate =
    totalEmployees > 0
      ? Math.min(Math.round((lockedCount / totalEmployees) * 100), 100)
      : 0;
  const isReadyForTransition =
    executionCompletionRate >= 80 && planningReadinessRate >= 70;

  // ── Overrides section (filtered by selectedQuarter) ─────────────
  const overrideSheets = await prisma.goalSheet.findMany({
    where: { cycleId: activeCycle?.id ?? "none", quarter: selectedQuarter },
    include: {
      user: { select: { id: true, name: true, email: true, empId: true } },
    },
  });

  const unlockRequests = overrideSheets.filter(
    (s) => s.status === "LOCKED" && s.unlockRequested
  );
  const finalizedSheets = overrideSheets.filter(
    (s) => (s.status === "LOCKED" || s.status === "APPROVED") && !s.unlockRequested
  );

  // ── Department Compliance Matrix ─────────────────────────────────
  const depts = await prisma.department.findMany({
    include: {
      users: {
        where: { role: { in: ["EMPLOYEE", "MANAGER"] } },
        include: {
          goalSheets: {
            where: {
              cycleId: activeCycle?.id ?? "none",
              quarter: selectedQuarter,
            },
          },
        },
      },
    },
  });

  const departmentCompletions = depts.map((dept) => {
    const total = dept.users.length;
    const completed = dept.users.filter((u) =>
      u.goalSheets.some(
        (s) => s.status === "LOCKED" || s.status === "APPROVED"
      )
    ).length;
    return {
      name: dept.name,
      percentage: total > 0 ? Math.min(Math.round((completed / total) * 100), 100) : 0,
      completed,
      total,
    };
  });

  const delayedDepts = departmentCompletions
    .filter((d) => d.percentage < 80)
    .map((d) => d.name);

  // ── Audit Logs (only fetched on audit tab) ───────────────────────
  let auditLogs: any[] = [];
  if (currentTab === "audit") {
    auditLogs = await prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        actor: { select: { id: true, name: true, role: true, empId: true } },
      },
      take: 50,
    });
  }

  // ── Colour helpers ───────────────────────────────────────────────
  const BAR_COLORS = [
    "bg-cyan-500", "bg-emerald-500", "bg-amber-500",
    "bg-rose-500", "bg-purple-500", "bg-blue-500",
  ];

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 space-y-8 select-none">

      {/* ── Page Header ───────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-900 pb-6">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100 tracking-tight flex items-center gap-2.5">
            <CheckCircle size={22} className="text-blue-400" />
            Operations Center
          </h1>
          <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
            Monitor cycle transitions, authorise plan overrides, and audit organisational consensus events.
          </p>
        </div>
        {activeCycle && (
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {activeQuarter && (
              <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] font-bold uppercase tracking-widest rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                {getQuarterLabel(activeQuarter)} Execution Active
              </span>
            )}
            {planningQuarter && (
              <span className="flex items-center gap-1.5 px-3 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[9px] font-bold uppercase tracking-widest rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                {getQuarterLabel(planningQuarter)} Planning Open
              </span>
            )}
          </div>
        )}
      </div>

      {/* ── Tab Navigation ────────────────────────────────────────── */}
      <div className="flex border-b border-zinc-900 gap-6 text-xs font-semibold">
        {(["overview", "audit"] as const).map((tab) => (
          <Link
            key={tab}
            href={`/admin/governance?tab=${tab}`}
            className={`pb-3 border-b-2 transition-colors capitalize ${
              currentTab === tab
                ? "border-blue-500 text-zinc-100"
                : "border-transparent text-zinc-500 hover:text-zinc-300"
            }`}
          >
            {tab === "overview" ? "Cycle Operations & Overrides" : "Consensus & Workflow Audit Trail"}
          </Link>
        ))}
      </div>

      {currentTab === "overview" ? (
        <>
          {/* ── KPI Cards ─────────────────────────────────────────── */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              {
                icon: Users,
                label: "Total Participants",
                value: `${totalEmployees}`,
                color: "text-zinc-400 bg-zinc-900 border-zinc-800",
              },
              {
                icon: Lock,
                label: `${getQuarterLabel(activeQuarter)} Execution`,
                value: `${lockedCount} Locked`,
                color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
              },
              {
                icon: Calendar,
                label: `${getQuarterLabel(planningQuarter)} Planning`,
                value: `${planningReadinessRate}% Ready`,
                color: "text-blue-400 bg-blue-500/10 border-blue-500/20",
              },
              {
                icon: Clock,
                label: "Pending Sign-offs",
                value: `${pendingReviewsCount} Reviews`,
                color: "text-amber-400 bg-amber-500/10 border-amber-500/20",
              },
            ].map(({ icon: Icon, label, value, color }) => (
              <div
                key={label}
                className="p-4 bg-zinc-900/40 border border-zinc-900 rounded-xl flex items-center gap-3"
              >
                <div className={`p-2.5 rounded-lg border ${color}`}>
                  <Icon size={15} />
                </div>
                <div>
                  <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">{label}</p>
                  <p className="text-lg font-extrabold text-zinc-100 font-mono mt-0.5">{value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* ── Ops Summary Strip ─────────────────────────────────── */}
          <div className="p-4 bg-zinc-900/20 border border-zinc-900 rounded-2xl grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
            <div className="space-y-2">
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Backlogs</p>
              <div className="flex justify-between font-medium text-zinc-400">
                <span>Pending Drafts ({getQuarterLabel(planningQuarter)}):</span>
                <span className="text-zinc-200 font-mono font-bold">{pendingSubmissionsCount}</span>
              </div>
              <div className="flex justify-between font-medium text-zinc-400">
                <span>Escalated Unlock Alerts:</span>
                <span className={`font-mono font-bold ${unlockRequests.length > 0 ? "text-amber-400" : "text-zinc-200"}`}>
                  {unlockRequests.length}
                </span>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Delayed Sectors</p>
              <div className="flex justify-between font-medium text-zinc-400">
                <span>Departments below 80%:</span>
                <span className={`font-bold ${delayedDepts.length > 0 ? "text-rose-400" : "text-emerald-400"}`}>
                  {delayedDepts.length > 0 ? delayedDepts.join(", ") : "None — On Track"}
                </span>
              </div>
              <div className="flex justify-between font-medium text-zinc-400">
                <span>Execution Rate:</span>
                <span className="text-zinc-200 font-mono font-bold">{executionCompletionRate}%</span>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Transition Readiness</p>
              <div className="flex items-center justify-between font-medium text-zinc-400">
                <span>Status:</span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase border ${
                    isReadyForTransition
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                      : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                  }`}
                >
                  {isReadyForTransition ? "Ready for Transition" : "In Progress"}
                </span>
              </div>
            </div>
          </div>

          {/* ── Main Grid ─────────────────────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left: Overrides + Activity */}
            <div className="lg:col-span-2 space-y-8">

              {/* Quarter filter + overrides header */}
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <h2 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Quarter Plan Overrides</h2>
                    <p className="text-[11px] text-zinc-500 mt-0.5">Review justifications, authorise unlocks, and manage locked plan states.</p>
                  </div>
                  {/* Quarter toggle */}
                  <div className="flex bg-zinc-950 p-0.5 rounded-lg border border-zinc-900 text-[10px] font-bold shrink-0">
                    {([activeQuarter, planningQuarter].filter(Boolean) as CheckInPeriod[]).map((q) => (
                      <Link
                        key={q}
                        href={`/admin/governance?tab=overview&quarter=${q}`}
                        className={`px-2.5 py-1 rounded-md transition-all uppercase tracking-wider ${
                          selectedQuarter === q
                            ? "bg-zinc-900 text-zinc-100 shadow-sm border border-zinc-800"
                            : "text-zinc-500 hover:text-zinc-300"
                        }`}
                      >
                        {getQuarterLabel(q)} {q === activeQuarter ? "Execution" : "Planning"}
                      </Link>
                    ))}
                  </div>
                </div>

                {/* SLA unlock requests */}
                {unlockRequests.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-[10px] font-extrabold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                      <ShieldAlert size={12} className="animate-pulse" />
                      SLA Priority Overrides ({unlockRequests.length})
                    </h3>
                    <div className="bg-zinc-950/30 border border-amber-500/15 rounded-2xl divide-y divide-zinc-900/50">
                      {unlockRequests.map((sheet) => (
                        <div
                          key={sheet.id}
                          className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-zinc-900/10 transition-colors"
                        >
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-2">
                              <h4 className="text-zinc-100 font-bold text-sm">{sheet.user.name}</h4>
                              <span className="px-1.5 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[9px] font-bold uppercase rounded tracking-wider">
                                {getQuarterLabel(sheet.quarter as CheckInPeriod)} Request
                              </span>
                            </div>
                            <p className="text-[11px] text-zinc-500">{sheet.user.email} · {sheet.user.empId}</p>
                            <div className="bg-zinc-950 px-3 py-2 border border-zinc-900 rounded-lg text-xs text-zinc-400 italic max-w-lg mt-1">
                              <span className="block text-[8px] font-bold text-amber-400 uppercase tracking-widest mb-1 not-italic">Override Justification</span>
                              "{sheet.unlockReason}"
                            </div>
                          </div>
                          <div className="flex items-center gap-3 shrink-0 self-end md:self-center">
                            <span className="px-2.5 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[9px] font-extrabold rounded-full uppercase tracking-wider animate-pulse flex items-center gap-1">
                              <Unlock size={8} /> SLA Urgency
                            </span>
                            <UnlockModal sheetId={sheet.id} userName={sheet.user.name} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Standard finalized plans */}
                <div className="space-y-3">
                  <h3 className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider">
                    Finalized Plans — {getQuarterLabel(selectedQuarter)} ({finalizedSheets.length})
                  </h3>
                  <div className="bg-zinc-950/20 border border-zinc-900 rounded-2xl overflow-hidden">
                    {finalizedSheets.length === 0 ? (
                      <div className="p-8 text-center text-zinc-500 text-xs italic">
                        No finalized plans for {getQuarterLabel(selectedQuarter)}.
                      </div>
                    ) : (
                      <div className="divide-y divide-zinc-950">
                        {finalizedSheets.map((sheet) => (
                          <div key={sheet.id} className="p-4 flex items-center justify-between hover:bg-zinc-900/10 transition-colors">
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="text-zinc-100 font-bold text-sm">{sheet.user.name}</h4>
                                <span className="px-1.5 py-0.5 bg-zinc-900 border border-zinc-800 text-zinc-400 rounded text-[9px] font-bold uppercase tracking-wider">
                                  {getQuarterLabel(sheet.quarter as CheckInPeriod)}
                                </span>
                              </div>
                              <p className="text-xs text-zinc-500 mt-0.5">{sheet.user.email} · {sheet.user.empId}</p>
                            </div>
                            <div className="flex items-center gap-3 shrink-0">
                              <span className="px-2.5 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] font-bold rounded-full uppercase tracking-wider">
                                {sheet.status}
                              </span>
                              <UnlockModal sheetId={sheet.id} userName={sheet.user.name} />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Activity size={13} className="text-zinc-500" /> Platform Activity
                  </h2>
                  <Link href="/admin/governance?tab=audit" className="text-xs text-blue-400 hover:text-blue-300 font-bold flex items-center gap-1">
                    Full Audit Trail <ArrowRight size={11} />
                  </Link>
                </div>
                <div className="bg-zinc-950/40 p-5 rounded-2xl border border-zinc-900">
                  <RecentActivityFeed limit={10} />
                </div>
              </div>
            </div>

            {/* Right sidebar */}
            <div className="lg:col-span-1 space-y-6">
              {/* Cycle Management (planning quarter toggle lives here) */}
              <CycleManagement cycles={cycles} activeCycle={activeCycle as any} />

              {/* Dept Compliance Heatmap */}
              <div className="bg-zinc-900/40 border border-zinc-900 rounded-2xl p-5 space-y-4">
                <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                  <CheckSquare size={13} className="text-zinc-500" /> Department Compliance
                </h3>
                <p className="text-[11px] text-zinc-500">
                  {getQuarterLabel(selectedQuarter)} compliance rates per department.
                </p>
                <div className="space-y-4 pt-1">
                  {departmentCompletions.map((dept, idx) => (
                    <div key={dept.name} className="space-y-1">
                      <div className="flex justify-between text-[11px] font-semibold text-zinc-400">
                        <span className="flex items-center gap-1.5">
                          <span className={`w-1.5 h-1.5 rounded-full ${BAR_COLORS[idx % BAR_COLORS.length]}`} />
                          {dept.name}
                        </span>
                        <span className="font-mono text-zinc-300">{dept.percentage}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-zinc-950 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${BAR_COLORS[idx % BAR_COLORS.length]} transition-all duration-500`}
                          style={{ width: `${dept.percentage}%` }}
                        />
                      </div>
                      <p className="text-[9px] font-bold text-zinc-600 uppercase tracking-wider text-right">
                        {dept.completed}/{dept.total} locked
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </>
      ) : (
        /* ── Audit Trail Tab ──────────────────────────────────────── */
        <div className="space-y-4">
          <div>
            <h2 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Workflow Audit Logs</h2>
            <p className="text-[11px] text-zinc-500 mt-1">Consensus log of proposals, approvals, overrides, and unlocks.</p>
          </div>
          <div className="bg-zinc-900/40 border border-zinc-900 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-zinc-950 border-b border-zinc-900 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                    {["Timestamp", "Actor", "Action Event", "Entity", "ID", "Payload"].map((h) => (
                      <th key={h} className="py-3 px-4">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-950 text-xs">
                  {auditLogs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-zinc-500 italic">
                        No consensus logs recorded yet.
                      </td>
                    </tr>
                  ) : (
                    auditLogs.map((audit: AuditWithActor) => {
                      const { text, icon: Icon, color } = formatAuditAction(
                        audit.action,
                        audit.entityType,
                        audit.newValues
                      );
                      return (
                        <tr key={audit.id} className="hover:bg-zinc-900/10 transition-colors">
                          <td className="py-3 px-4 text-zinc-500 whitespace-nowrap text-[10px] font-mono">
                            {formatAuditTimestamp(audit.createdAt)}
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-bold text-zinc-300">{audit.actor?.name ?? "System"}</span>
                            <span className="block text-[8px] text-zinc-500 uppercase mt-0.5">{audit.actor?.role ?? "SYSTEM"}</span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <span className={`p-1 rounded ${color}`}><Icon size={11} /></span>
                              <span className="text-zinc-300 text-[11px]">{text}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-zinc-500 text-[10px] font-mono">{audit.entityType}</td>
                          <td className="py-3 px-4 text-zinc-600 text-[10px] font-mono select-all">
                            {audit.entityId.slice(0, 12)}…
                          </td>
                          <td className="py-3 px-4 max-w-xs">
                            {audit.newValues && (
                              <pre className="font-mono text-zinc-400 bg-zinc-950 p-2 border border-zinc-900 rounded text-[10px] max-h-16 overflow-y-auto whitespace-pre-wrap">
                                {JSON.stringify(audit.newValues, null, 2)}
                              </pre>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
            <div className="p-3 bg-zinc-950 border-t border-zinc-900 text-center text-[10px] font-semibold text-zinc-600 uppercase tracking-wider">
              Showing latest 50 consensus logs
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
