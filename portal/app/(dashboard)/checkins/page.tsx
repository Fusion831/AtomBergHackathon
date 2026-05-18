import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/authOptions";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { CheckInCard } from "@/components/checkins/CheckInCard";
import { CheckInPeriod } from "@prisma/client";
import Link from "next/link";
import { getLifecycleAwareCycle, getQuarterLabel } from "@/lib/quarterLifecycle";

const QUARTERS: { id: CheckInPeriod; label: string }[] = [
  { id: "Q1", label: "Q1 Check-in" },
  { id: "Q2", label: "Q2 Check-in" },
  { id: "Q3", label: "Q3 Check-in" },
  { id: "Q4_ANNUAL", label: "Q4 / Annual" },
];

export default async function EmployeeCheckInsPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const resolvedParams = await searchParams;
  const rawCycle = await prisma.goalCycle.findFirst({ where: { isActive: true } });
  const activeCycle = getLifecycleAwareCycle(rawCycle);
  const activePeriod = activeCycle?.activeQuarter ?? null;

  // Default: URL param → active period → first quarter
  const selectedPeriod =
    (resolvedParams.period as CheckInPeriod) ?? activePeriod ?? "Q1";
  const isReadOnly = selectedPeriod !== activePeriod;

  const sheet = await prisma.goalSheet.findFirst({
    where: {
      userId: session.user.id,
      cycleId: activeCycle?.id ?? "none",
      quarter: selectedPeriod,
      status: { in: ["APPROVED", "LOCKED"] },
    },
    include: { goals: { include: { checkIns: true } } },
  });

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6">
      {/* Header */}
      <div className="mb-8 border-b border-zinc-800 pb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-100 tracking-tight">
            Quarterly Check-ins
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Traverse goal progress, log actual achievements, and review manager feedback.
          </p>
        </div>
        <div>
          {activePeriod ? (
            <div className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase tracking-wider rounded">
              Active Window: {getQuarterLabel(activePeriod)}
            </div>
          ) : (
            <div className="px-3 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-bold uppercase tracking-wider rounded">
              Check-ins Closed
            </div>
          )}
        </div>
      </div>

      {/* Quarter tabs */}
      <div className="flex border-b border-zinc-900 gap-4 md:gap-6 mb-8 overflow-x-auto pb-px">
        {QUARTERS.map((q) => {
          const isActiveWindow = activePeriod === q.id;
          const isSelected = selectedPeriod === q.id;
          return (
            <Link
              key={q.id}
              href={`/checkins?period=${q.id}`}
              className={`pb-3 text-xs md:text-sm font-semibold border-b-2 transition-all whitespace-nowrap flex items-center gap-1.5 shrink-0 ${
                isSelected
                  ? "border-blue-500 text-zinc-100"
                  : "border-transparent text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {q.label}
              {isActiveWindow ? (
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="Active" />
              ) : (
                <span className="text-[10px] text-zinc-600 bg-zinc-950 border border-zinc-900 px-1 rounded uppercase">
                  Closed
                </span>
              )}
            </Link>
          );
        })}
      </div>

      {/* Content */}
      {!sheet ? (
        <div className="flex flex-col items-center justify-center p-12 text-center border border-dashed border-zinc-800 rounded-xl bg-zinc-900/20">
          <h3 className="text-base font-medium text-zinc-300">No Locked Goals Available</h3>
          <p className="text-sm text-zinc-500 mt-2 max-w-md">
            Your goals must be approved and locked by your manager before you can enter the check-in phase.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Context banner */}
          <div className="bg-zinc-900/40 p-4 rounded-xl border border-zinc-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <h3 className="text-zinc-200 font-semibold text-sm flex items-center gap-2">
                {getQuarterLabel(selectedPeriod)} Check-in
                {isReadOnly && (
                  <span className="text-[10px] px-1.5 py-0.5 bg-zinc-800 border border-zinc-700 text-zinc-400 rounded uppercase tracking-wider">
                    Read Only
                  </span>
                )}
              </h3>
              <p className="text-xs text-zinc-500 mt-1 max-w-xl">
                {isReadOnly
                  ? "This period is closed. Inspect your logged values and manager feedback below."
                  : "Check-in window is open. Log actual achievements and submit progress comments."}
              </p>
            </div>
            {isReadOnly && activePeriod && (
              <Link
                href={`/checkins?period=${activePeriod}`}
                className="text-xs font-semibold text-blue-400 border border-blue-500/20 bg-blue-500/5 px-3 py-1.5 rounded-md hover:bg-blue-500/10 transition-colors shrink-0"
              >
                Go to Active Window ({getQuarterLabel(activePeriod)}) &rarr;
              </Link>
            )}
          </div>

          <div className="space-y-6">
            {sheet.goals.map((goal) => (
              <CheckInCard
                key={goal.id}
                goal={goal}
                activePeriod={selectedPeriod}
                readOnly={isReadOnly}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
