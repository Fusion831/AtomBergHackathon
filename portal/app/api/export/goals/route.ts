import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/authOptions";
import { prisma } from "@/lib/prisma";
import { CheckInPeriod } from "@prisma/client";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "MANAGER")) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const cycleId = searchParams.get("cycleId");
  const period = searchParams.get("period") as CheckInPeriod | "ALL";
  const departmentId = searchParams.get("departmentId");
  const managerId = searchParams.get("managerId");

  if (!cycleId) {
    return new NextResponse("Cycle ID is required", { status: 400 });
  }

  const isAdmin = session.user.role === "ADMIN";

  // Build the where clause for users
  const userWhere: any = {};
  if (!isAdmin) {
    userWhere.managerId = session.user.id;
  } else {
    if (departmentId) userWhere.departmentId = departmentId;
    if (managerId) userWhere.managerId = managerId;
  }

  // Fetch the data
  const users = await prisma.user.findMany({
    where: userWhere,
    include: {
      department: true,
      manager: true,
      goalSheets: {
        where: { cycleId },
        include: {
          cycle: true,
          goals: {
            include: {
              checkIns: period && period !== "ALL" ? { where: { period } } : true
            }
          }
        }
      }
    }
  });

  // Transform into CSV rows
  // Fields: Employee Name, Employee ID, Department, Manager, Goal Title, Target, Actual, Progress Score, Status, Quarter, Cycle
  const rows: string[] = [];
  const headers = [
    "Employee Name",
    "Employee ID",
    "Department",
    "Manager",
    "Cycle",
    "Quarter",
    "Goal Title",
    "UoM",
    "Metric Direction",
    "Target",
    "Actual",
    "Progress Score (%)",
    "Goal Status"
  ];
  
  rows.push(headers.map(h => `"${h}"`).join(","));

  users.forEach(user => {
    user.goalSheets.forEach(sheet => {
      sheet.goals.forEach(goal => {
        // If they filtered by period but there are no check-ins, we can either skip or show empty.
        // Usually, reports show the latest state or the check-in for that period.
        if (period && period !== "ALL" && goal.checkIns.length === 0) {
          // No check-in for this period, but we might still want to list the goal
        }

        const targetValue = goal.targetValue !== null ? goal.targetValue : (goal.targetDate ? new Date(goal.targetDate).toISOString().split('T')[0] : "N/A");
        
        if (goal.checkIns.length > 0) {
          goal.checkIns.forEach(checkIn => {
            const actualValue = checkIn.actualValue !== null ? checkIn.actualValue : (checkIn.actualDate ? new Date(checkIn.actualDate).toISOString().split('T')[0] : "N/A");
            
            const row = [
              user.name,
              user.empId || "N/A",
              user.department?.name || "N/A",
              user.manager?.name || "N/A",
              sheet.cycle.name,
              checkIn.period,
              goal.title,
              goal.uomType,
              goal.metricDirection,
              targetValue,
              actualValue,
              checkIn.progressScore !== null ? checkIn.progressScore.toFixed(2) : "N/A",
              checkIn.status
            ];
            rows.push(row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(","));
          });
        } else {
          // If no check-ins exist, print the goal anyway
          const row = [
            user.name,
            user.empId || "N/A",
            user.department?.name || "N/A",
            user.manager?.name || "N/A",
            sheet.cycle.name,
            "N/A",
            goal.title,
            goal.uomType,
            goal.metricDirection,
            targetValue,
            "N/A",
            "0",
            goal.status
          ];
          rows.push(row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(","));
        }
      });
    });
  });

  const csvContent = rows.join("\n");

  return new NextResponse(csvContent, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="achievement_report_${new Date().toISOString().split('T')[0]}.csv"`
    }
  });
}
