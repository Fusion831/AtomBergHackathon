"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/authOptions";
import { revalidatePath } from "next/cache";
import { calculateProgressScore, determineStatus } from "@/lib/progress";
import { CheckInPeriod } from "@prisma/client";

export async function upsertCheckIn(
  goalId: string, 
  period: CheckInPeriod, 
  data: { actualValue?: number; actualDate?: Date; employeeComment?: string }
) {
  const session = await getServerSession(authOptions);
  if (!session) return { success: false, message: "Unauthorized" };

  try {
    const goal = await prisma.goal.findUnique({
      where: { id: goalId },
      include: { sheet: true, childGoals: true }
    });

    if (!goal) return { success: false, message: "Goal not found" };

    if (goal.ownerId !== session.user.id && session.user.role !== "ADMIN") {
      return { success: false, message: "Not authorized to update this goal" };
    }

    // Master shared goals might not have a sheet, so we skip the locked check for them
    if (goal.sheetId && goal.sheet?.status !== "LOCKED") {
      return { success: false, message: "Goal sheet must be locked before checking in." };
    }

    const score = calculateProgressScore(goal.uomType, goal.targetValue, data.actualValue || null, goal.targetDate, data.actualDate || null);
    const status = determineStatus(score);

    const result = await prisma.$transaction(async (tx) => {
      // Enforce active window
      const activeCycle = await tx.goalCycle.findFirst({ where: { isActive: true } });
      if (!activeCycle || activeCycle.activeQuarter !== period) {
        return { success: false, message: "Check-in window is currently closed for this period." };
      }

      // 1. Update the parent check-in
      const existingCheckIn = await tx.checkIn.findUnique({
        where: { goalId_period: { goalId, period } }
      });

      if (existingCheckIn) {
        await tx.checkIn.update({
          where: { id: existingCheckIn.id },
          data: {
            actualValue: data.actualValue !== undefined ? data.actualValue : existingCheckIn.actualValue,
            actualDate: data.actualDate !== undefined ? data.actualDate : existingCheckIn.actualDate,
            employeeComment: data.employeeComment !== undefined ? data.employeeComment : existingCheckIn.employeeComment,
            progressScore: score,
            status: status
          }
        });

        await tx.auditLog.create({
          data: {
            actorId: session.user.id,
            action: "UPDATE_CHECKIN",
            entityType: "CheckIn",
            entityId: existingCheckIn.id,
            oldValues: { actualValue: existingCheckIn.actualValue, score: existingCheckIn.progressScore },
            newValues: { actualValue: data.actualValue, score }
          }
        });
      } else {
        const newCheckIn = await tx.checkIn.create({
          data: {
            goalId,
            period,
            actualValue: data.actualValue,
            actualDate: data.actualDate,
            employeeComment: data.employeeComment,
            progressScore: score,
            status: status
          }
        });

        await tx.auditLog.create({
          data: {
            actorId: session.user.id,
            action: "CREATE_CHECKIN",
            entityType: "CheckIn",
            entityId: newCheckIn.id,
            oldValues: null,
            newValues: { actualValue: data.actualValue, score }
          }
        });
      }

      await tx.goal.update({
        where: { id: goalId },
        data: { currentProgress: score, status }
      });

      // 2. Propagate to all child goals if this is a master shared goal
      if (goal.goalType === "SHARED" && goal.childGoals.length > 0) {
        for (const child of goal.childGoals) {
          // Verify child is linked correctly
          const existingChildCheckIn = await tx.checkIn.findUnique({
            where: { goalId_period: { goalId: child.id, period } }
          });

          if (existingChildCheckIn) {
            await tx.checkIn.update({
              where: { id: existingChildCheckIn.id },
              data: {
                actualValue: data.actualValue !== undefined ? data.actualValue : existingChildCheckIn.actualValue,
                actualDate: data.actualDate !== undefined ? data.actualDate : existingChildCheckIn.actualDate,
                progressScore: score,
                status: status
              }
            });
          } else {
            await tx.checkIn.create({
              data: {
                goalId: child.id,
                period,
                actualValue: data.actualValue,
                actualDate: data.actualDate,
                progressScore: score,
                status: status
              }
            });
          }

          await tx.goal.update({
            where: { id: child.id },
            data: { currentProgress: score, status }
          });

          await tx.auditLog.create({
            data: {
              actorId: session.user.id,
              action: "PROPAGATE_CHECKIN",
              entityType: "Goal",
              entityId: child.id,
              oldValues: null,
              newValues: { actualValue: data.actualValue, score }
            }
          });
        }
      }

      return { success: true };
    });

    if (!result.success) return result;

    revalidatePath("/checkins");
    revalidatePath("/manager/checkins");
    revalidatePath("/manager/shared-goals");
    return { success: true };

  } catch (error) {
    console.error(error);
    return { success: false, message: "An unexpected error occurred." };
  }
}

export async function addManagerCheckInComment(checkInId: string, managerComment: string) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== "MANAGER" && session.user.role !== "ADMIN")) {
    return { success: false, message: "Unauthorized" };
  }

  try {
    const checkIn = await prisma.checkIn.findUnique({
      where: { id: checkInId },
      include: { goal: { include: { sheet: { include: { user: true } } } } }
    });

    if (!checkIn) return { success: false, message: "Check-in not found" };

    if (session.user.role !== "ADMIN" && checkIn.goal.sheet?.user.managerId !== session.user.id) {
      return { success: false, message: "Not authorized to comment on this check-in" };
    }

    await prisma.$transaction(async (tx) => {
      await tx.checkIn.update({
        where: { id: checkInId },
        data: { managerComment }
      });

      await tx.auditLog.create({
        data: {
          actorId: session.user.id,
          action: "MANAGER_COMMENT_CHECKIN",
          entityType: "CheckIn",
          entityId: checkInId,
          oldValues: { managerComment: checkIn.managerComment },
          newValues: { managerComment }
        }
      });
    });

    revalidatePath("/manager/checkins");
    return { success: true };

  } catch (error) {
    return { success: false, message: "An error occurred adding manager comment." };
  }
}
