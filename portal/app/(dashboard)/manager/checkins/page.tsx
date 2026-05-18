import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/authOptions";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { CheckInPeriod } from "@prisma/client";
import { ManagerCheckInTabs } from "@/components/manager/ManagerCheckInTabs";
import { getLifecycleAwareCycle, getQuarterLabel } from "@/lib/quarterLifecycle";

const QUARTERS: { id: CheckInPeriod; label: string }[] = [
  { id: "Q1", label: "Q1 Check-in" },
  { id: "Q2", label: "Q2 Check-in" },
  { id: "Q3", label: "Q3 Check-in" },
  { id: "Q4_ANNUAL", label: "Q4 / Annual" },
];

export default async function ManagerCheckInsListPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  if (session.user.role !== "MANAGER" && session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const resolvedParams = await searchParams;
  const rawCycle = await prisma.goalCycle.findFirst({ where: { isActive: true } });
  const activeCycle = getLifecycleAwareCycle(rawCycle);
  const activePeriod = activeCycle?.activeQuarter ?? null;

  const selectedPeriod =
    (resolvedParams.period as CheckInPeriod) ?? activePeriod ?? "Q1";
  const isReadOnly = selectedPeriod !== activePeriod;

  const sheets = await prisma.goalSheet.findMany({
    where: {
      cycleId: activeCycle?.id ?? "none",
      quarter: selectedPeriod,
      user: {
        managerId:
          session.user.role === "MANAGER" ? session.user.id : undefined,
      },
      status: { in: ["APPROVED", "LOCKED"] },
    },
    include: {
      user: { select: { name: true, email: true } },
      cycle: { select: { name: true } },
      goals: {
        include: { checkIns: { where: { period: selectedPeriod } } },
      },
    },
  });

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6">
      <div className="mb-8 border-b border-zinc-900 pb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100 tracking-tight">Team Check-ins</h1>
          <p className="text-sm text-zinc-500 mt-1">
            Review your direct reports' progress updates and log feedback.
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

      <ManagerCheckInTabs
        initialPeriod={selectedPeriod}
        activePeriod={activePeriod ?? undefined}
        quarters={QUARTERS}
        sheetsData={sheets.map((s) => ({
          id: s.id,
          quarter: s.quarter,
          status: s.status,
          user: { name: s.user.name, email: s.user.email },
          cycle: { name: s.cycle.name },
          goals: s.goals.map((g) => ({
            id: g.id,
            checkIns: g.checkIns.map((c) => ({ id: c.id })),
          })),
        }))}
        isReadOnly={isReadOnly}
      />
    </div>
  );
}
