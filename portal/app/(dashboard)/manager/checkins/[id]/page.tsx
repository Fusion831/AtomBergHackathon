import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/authOptions";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { ManagerCheckInCard } from "@/components/checkins/ManagerCheckInCard";
import { CheckInPeriod } from "@prisma/client";

export default async function ManagerCheckInDetailPage({ 
  params, 
  searchParams 
}: { 
  params: Promise<{ id: string }>; 
  searchParams: Promise<{ period?: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  if (session.user.role !== "MANAGER" && session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const { id: sheetId } = await params;
  const resolvedParams = await searchParams;
  const activeCycle = await prisma.goalCycle.findFirst({ where: { isActive: true } });
  const activePeriod = activeCycle?.activeQuarter;

  const selectedPeriod = (resolvedParams.period as CheckInPeriod) || activePeriod || "Q1";
  const isReadOnly = selectedPeriod !== activePeriod;

  const baseSheet = await prisma.goalSheet.findUnique({
    where: { id: sheetId },
    select: { userId: true, cycleId: true }
  });

  if (!baseSheet) {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4 text-center">
        <h2 className="text-xl text-zinc-300">Goal Sheet not found</h2>
        <Link href="/manager/checkins" className="text-blue-400 hover:underline mt-4 inline-block">Back to Team Check-ins</Link>
      </div>
    );
  }

  const sheet = await prisma.goalSheet.findFirst({
    where: {
      userId: baseSheet.userId,
      cycleId: baseSheet.cycleId,
      quarter: selectedPeriod,
    },
    include: {
      user: {
        include: { department: true }
      },
      cycle: true,
      goals: {
        orderBy: { weightage: "desc" },
        include: { 
          checkIns: {
            where: { period: selectedPeriod }
          }
        }
      },
    }
  });

  if (!sheet) {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4 text-center">
        <h2 className="text-xl text-zinc-300">Goal Sheet not found</h2>
        <Link href="/manager/checkins" className="text-blue-400 hover:underline mt-4 inline-block">Back to Team Check-ins</Link>
      </div>
    );
  }

  if (session.user.role !== "ADMIN" && sheet.user.managerId !== session.user.id) {
    redirect("/manager/checkins");
  }

  const quarters: { id: CheckInPeriod; label: string }[] = [
    { id: "Q1", label: "Q1 Check-in" },
    { id: "Q2", label: "Q2 Check-in" },
    { id: "Q3", label: "Q3 Check-in" },
    { id: "Q4_ANNUAL", label: "Q4 / Annual" }
  ];

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6 pb-24">
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <Link href="/manager/checkins" className="inline-flex items-center text-sm text-zinc-400 hover:text-zinc-200 transition-colors">
          <ChevronLeft size={16} className="mr-1" /> Back to Team Check-ins
        </Link>
        <div className="flex items-center gap-2">
          {activePeriod ? (
            <div className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold uppercase tracking-wider rounded">
              Active Window: {activePeriod}
            </div>
          ) : (
            <div className="px-3 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-500 text-xs font-semibold uppercase tracking-wider rounded">
              Check-ins Closed
            </div>
          )}
        </div>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-zinc-100">{sheet.user.name}'s Progress</h1>
            <p className="text-sm text-zinc-400 mt-1">
              {sheet.user.department?.name || "No Department"} &bull; {sheet.cycle.name}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs to traverse quarters easily */}
      <div className="flex border-b border-zinc-850 gap-4 md:gap-6 mb-8 overflow-x-auto pb-px">
        {quarters.map((q) => {
          const isActiveWindow = activePeriod === q.id;
          const isSelected = selectedPeriod === q.id;
          
          return (
            <Link 
              key={q.id}
              href={`/manager/checkins/${sheetId}?period=${q.id}`}
              className={`pb-3 text-xs md:text-sm font-semibold border-b-2 transition-all whitespace-nowrap flex items-center gap-1.5 shrink-0 ${
                isSelected 
                  ? "border-blue-500 text-zinc-100" 
                  : "border-transparent text-zinc-500 hover:text-zinc-300"
              }`}
            >
              <span>{q.label}</span>
              {isActiveWindow ? (
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" title="Active Window"></span>
              ) : (
                <span className="text-[10px] text-zinc-600 bg-zinc-900 border border-zinc-800 px-1 rounded uppercase font-normal">Closed</span>
              )}
            </Link>
          );
        })}
      </div>

      <div className="space-y-4 mb-8">
        {sheet.goals.map((goal) => (
          <ManagerCheckInCard 
            key={goal.id} 
            goal={goal} 
            activePeriod={selectedPeriod} 
            readOnly={isReadOnly} 
          />
        ))}
      </div>
    </div>
  );
}
