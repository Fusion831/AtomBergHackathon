import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/authOptions";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Search, Filter, ChevronRight, User as UserIcon } from "lucide-react";
import { DirectoryFilters } from "@/components/directory/DirectoryFilters";
import { CheckInPeriod, Prisma, GoalSheetStatus } from "@prisma/client";

export default async function DirectoryPage({ searchParams }: { searchParams: Promise<{ q?: string; status?: string; departmentId?: string; managerId?: string; quarter?: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "MANAGER")) {
    redirect("/dashboard");
  }

  const resolvedParams = await searchParams;
  const isAdmin = session.user.role === "ADMIN";
  const activeCycle = await prisma.goalCycle.findFirst({ where: { isActive: true } });
  
  const selectedQuarter = (resolvedParams.quarter || activeCycle?.activeQuarter || "Q2") as CheckInPeriod;

  // Base where clause. If not admin, restrict to team members
  const whereClause: Prisma.UserWhereInput = {};
  
  if (!isAdmin) {
    whereClause.managerId = session.user.id;
  }

  if (resolvedParams.q) {
    whereClause.OR = [
      { name: { contains: resolvedParams.q, mode: "insensitive" } },
      { email: { contains: resolvedParams.q, mode: "insensitive" } },
      { empId: { contains: resolvedParams.q, mode: "insensitive" } }
    ];
  }

  if (isAdmin && resolvedParams.departmentId) {
    whereClause.departmentId = resolvedParams.departmentId;
  }

  if (isAdmin && resolvedParams.managerId) {
    whereClause.managerId = resolvedParams.managerId;
  }

  if (resolvedParams.status && activeCycle) {
    if (resolvedParams.status === "PENDING_APPROVAL") {
      whereClause.goalSheets = {
        some: {
          cycleId: activeCycle.id,
          quarter: selectedQuarter,
          status: { in: ["SUBMITTED", "UNDER_REVIEW"] }
        }
      };
    } else {
      whereClause.goalSheets = {
        some: {
          cycleId: activeCycle.id,
          quarter: selectedQuarter,
          status: resolvedParams.status as GoalSheetStatus
        }
      };
    }
  }

  const users: any[] = await prisma.user.findMany({
    where: whereClause,
    select: {
      id: true,
      name: true,
      email: true,
      empId: true,
      department: {
        select: { name: true }
      },
      manager: {
        select: { name: true }
      },
      goalSheets: {
        where: { cycleId: activeCycle?.id, quarter: selectedQuarter },
        select: {
          id: true,
          status: true,
          quarter: true,
          goals: {
            select: {
              id: true,
              checkIns: {
                where: { period: activeCycle?.activeQuarter as any },
                select: { id: true, period: true }
              }
            }
          }
        }
      }
    },
    orderBy: { name: "asc" }
  });

  const departments = isAdmin ? await prisma.department.findMany() : [];
  const managers = isAdmin ? await prisma.user.findMany({ where: { role: "MANAGER" } }) : [];

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6">
      <div className="mb-8 border-b border-zinc-800 pb-6">
        <h1 className="text-2xl font-semibold text-zinc-100 tracking-tight">
          {isAdmin ? "Employee Directory & Governance Search" : "Team Directory"}
        </h1>
        <p className="text-sm text-zinc-400 mt-1">
          {isAdmin ? "Search by EmpID, filter by approval requests, and view department progress." : "Search and manage your direct reports."}
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        <div className="w-full md:w-64 flex-shrink-0">
          <DirectoryFilters 
             isAdmin={isAdmin} 
             departments={departments} 
             managers={managers} 
             currentParams={resolvedParams} 
          />
        </div>

        <div className="flex-1 space-y-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
            <div className="p-4 border-b border-zinc-800/80 bg-zinc-900/50 flex justify-between items-center">
              <span className="text-sm font-medium text-zinc-300">Results ({users.length})</span>
            </div>
            
            {users.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                <div className="w-12 h-12 bg-zinc-900 border border-zinc-800 rounded-full flex items-center justify-center mb-4 text-zinc-500">
                  <Search size={20} />
                </div>
                <h3 className="text-lg font-medium text-zinc-200">No employees found</h3>
                <p className="text-sm text-zinc-500 mt-2 max-w-md">Try adjusting your search query or removing some filters to find who you're looking for.</p>
              </div>
            ) : (
              <div className="divide-y divide-zinc-800/80">
                {users.map(user => {
                  const sheet = user.goalSheets[0];
                  let statusColor = "bg-zinc-800 text-zinc-400";
                  let statusText = "No Goals Drafted";

                  if (sheet) {
                    if (sheet.status === "LOCKED") {
                      if (activeCycle?.activeQuarter) {
                        const totalGoals = sheet.goals.length;
                        const updatedGoals = sheet.goals.filter((g: any) => g.checkIns.some((c: any) => c.period === activeCycle.activeQuarter)).length;
                        if (totalGoals === 0) {
                          statusColor = "bg-zinc-800 text-zinc-400 border border-zinc-750";
                          statusText = "No Goals Defined";
                        } else if (updatedGoals === totalGoals) {
                          statusColor = "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20";
                          statusText = `${activeCycle.activeQuarter} Completed`;
                        } else if (updatedGoals > 0) {
                          statusColor = "bg-amber-500/10 text-amber-400 border border-amber-500/20";
                          statusText = `${activeCycle.activeQuarter} (${updatedGoals}/${totalGoals})`;
                        } else {
                          statusColor = "bg-rose-500/10 text-rose-400 border border-rose-500/20";
                          statusText = `${activeCycle.activeQuarter} Pending`;
                        }
                      } else {
                        statusColor = "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20";
                        statusText = "Locked (Active)";
                      }
                    }
                    else if (sheet.status === "SUBMITTED" || sheet.status === "UNDER_REVIEW") { statusColor = "bg-amber-500/10 text-amber-400 border border-amber-500/20"; statusText = "Pending Approval"; }
                    else if (sheet.status === "DRAFT") { statusColor = "bg-blue-500/10 text-blue-400 border border-blue-500/20"; statusText = "In Draft"; }
                  }

                  // Where does the link go?
                  // For managers, we send them to /manager/review/[id] if pending, or /manager/checkins/[id] if locked
                  // For admins, we can just send them to a generic view or reuse the manager review page since admins have access.
                  const targetHref = sheet 
                    ? (sheet.status === "LOCKED" ? `/manager/checkins/${sheet.id}` : `/manager/review/${sheet.id}`)
                    : "#";

                  return (
                    <Link key={user.id} href={sheet ? targetHref : "#"} className="p-4 flex items-center justify-between hover:bg-zinc-800/40 transition-colors group">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400">
                          <UserIcon size={20} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-zinc-100 font-medium">{user.name}</h4>
                            {user.empId && <span className="text-xs text-zinc-500 bg-zinc-800 px-1.5 py-0.5 rounded">ID: {user.empId}</span>}
                          </div>
                          <p className="text-xs text-zinc-400 mt-0.5">
                            {user.email} &bull; {user.department?.name || "No Dept"} {isAdmin && user.manager && `• Mgr: ${user.manager.name}`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${statusColor}`}>
                          {statusText}
                        </span>
                        {sheet && <ChevronRight className="text-zinc-600 group-hover:text-zinc-300 transition-colors" size={20} />}
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
