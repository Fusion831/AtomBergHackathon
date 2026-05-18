import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/authOptions";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { DirectoryContainer } from "@/components/directory/DirectoryContainer";
import { CheckInPeriod, GoalSheetStatus } from "@prisma/client";
import { getLifecycleAwareCycle } from "@/lib/quarterLifecycle";

export default async function DirectoryPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    status?: string;
    departmentId?: string;
    managerId?: string;
    quarter?: string;
  }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const resolvedParams = await searchParams;
  const rawCycle = await prisma.goalCycle.findFirst({ where: { isActive: true } });
  const activeCycle = getLifecycleAwareCycle(rawCycle);

  const selectedQuarter = (resolvedParams.quarter ||
    activeCycle?.activeQuarter ||
    "Q2") as CheckInPeriod;

  // Build where clause
  const whereClause: any = {};

  if (resolvedParams.q) {
    whereClause.OR = [
      { name: { contains: resolvedParams.q, mode: "insensitive" } },
      { email: { contains: resolvedParams.q, mode: "insensitive" } },
      { empId: { contains: resolvedParams.q, mode: "insensitive" } },
    ];
  }
  if (resolvedParams.departmentId) whereClause.departmentId = resolvedParams.departmentId;
  if (resolvedParams.managerId) whereClause.managerId = resolvedParams.managerId;

  if (resolvedParams.status && activeCycle) {
    if (resolvedParams.status === "PENDING_APPROVAL") {
      whereClause.goalSheets = {
        some: {
          cycleId: activeCycle.id,
          quarter: selectedQuarter,
          status: { in: ["SUBMITTED", "UNDER_REVIEW"] },
        },
      };
    } else {
      whereClause.goalSheets = {
        some: {
          cycleId: activeCycle.id,
          quarter: selectedQuarter,
          status: resolvedParams.status as GoalSheetStatus,
        },
      };
    }
  }

  const users = await prisma.user.findMany({
    where: whereClause,
    select: {
      id: true,
      name: true,
      email: true,
      empId: true,
      department: { select: { name: true } },
      manager: { select: { name: true } },
      goalSheets: {
        where: {
          cycleId: activeCycle?.id ?? "none",
          quarter: selectedQuarter,
        },
        select: {
          id: true,
          status: true,
          quarter: true,
          goals: {
            select: {
              id: true,
              checkIns: {
                where: { period: activeCycle?.activeQuarter as any },
                select: { id: true, period: true },
              },
            },
          },
        },
      },
    },
    orderBy: { name: "asc" },
  });

  const departments = await prisma.department.findMany();
  const managers = await prisma.user.findMany({ where: { role: "MANAGER" } });

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6">
      <div className="mb-8 border-b border-zinc-900 pb-6">
        <h1 className="text-2xl font-bold text-zinc-100 tracking-tight">
          Employee Directory & Governance Search
        </h1>
        <p className="text-sm text-zinc-500 mt-1">
          Search by EmpID, filter by approval requests, and view department progress.
        </p>
      </div>

      <DirectoryContainer
        initialUsers={users.map((u) => ({
          id: u.id,
          name: u.name,
          email: u.email,
          empId: u.empId,
          department: u.department ? { name: u.department.name } : null,
          manager: u.manager ? { name: u.manager.name } : null,
          goalSheets: u.goalSheets.map((s) => ({
            id: s.id,
            status: s.status,
            quarter: s.quarter,
            goals: s.goals.map((g) => ({
              id: g.id,
              checkIns: g.checkIns.map((c) => ({
                id: c.id,
                period: c.period,
              })),
            })),
          })),
        }))}
        departments={departments}
        managers={managers}
        currentParams={resolvedParams}
        isAdmin={true}
        activeCycle={
          activeCycle
            ? { id: activeCycle.id, activeQuarter: activeCycle.activeQuarter }
            : null
        }
      />
    </div>
  );
}
