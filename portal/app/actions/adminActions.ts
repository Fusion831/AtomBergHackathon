"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/authOptions";
import { revalidatePath } from "next/cache";
import { CheckInPeriod } from "@prisma/client";

export async function unlockGoalSheet(sheetId: string, reason: string) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return { success: false, message: "Unauthorized" };
  }

  try {
    const sheet = await prisma.goalSheet.findUnique({
      where: { id: sheetId }
    });

    if (!sheet) return { success: false, message: "Sheet not found" };

    if (sheet.status !== "LOCKED" && sheet.status !== "APPROVED") {
      return { success: false, message: "Sheet is not locked." };
    }

    await prisma.$transaction(async (tx) => {
      // Revert to DRAFT so the employee can modify it
      await tx.goalSheet.update({
        where: { id: sheetId },
        data: { 
          status: "DRAFT",
          lockedAt: null,
          approvedAt: null
        }
      });

      await tx.auditLog.create({
        data: {
          actorId: session.user.id,
          action: "ADMIN_UNLOCK_SHEET",
          entityType: "GoalSheet",
          entityId: sheetId,
          oldValues: { status: sheet.status },
          newValues: { status: "DRAFT", reason }
        }
      });
    });

    revalidatePath("/admin/governance");
    return { success: true };
  } catch (error) {
    return { success: false, message: "An unexpected error occurred." };
  }
}

export async function createGoalCycle(name: string, startDate: Date, endDate: Date) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return { success: false, message: "Unauthorized" };
  }

  try {
    await prisma.$transaction(async (tx) => {
      // Optional: deactivate others if you want only one active at a time
      // await tx.goalCycle.updateMany({ data: { isActive: false } });

      const cycle = await tx.goalCycle.create({
        data: {
          name,
          startDate,
          endDate,
          isActive: false, // Create as inactive initially
        }
      });

      await tx.auditLog.create({
        data: {
          actorId: session.user.id,
          action: "CREATE_CYCLE",
          entityType: "GoalCycle",
          entityId: cycle.id,
          oldValues: {},
          newValues: { name, startDate, endDate }
        }
      });
    });

    revalidatePath("/admin/governance");
    return { success: true };
  } catch (error) {
    return { success: false, message: "Error creating cycle." };
  }
}

export async function setActiveCycle(cycleId: string) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return { success: false, message: "Unauthorized" };
  }

  try {
    await prisma.$transaction(async (tx) => {
      // Deactivate all
      await tx.goalCycle.updateMany({
        where: { isActive: true },
        data: { isActive: false }
      });

      // Activate the target
      await tx.goalCycle.update({
        where: { id: cycleId },
        data: { isActive: true }
      });

      await tx.auditLog.create({
        data: {
          actorId: session.user.id,
          action: "SET_ACTIVE_CYCLE",
          entityType: "GoalCycle",
          entityId: cycleId,
          oldValues: {},
          newValues: { isActive: true }
        }
      });
    });

    revalidatePath("/admin/governance");
    return { success: true };
  } catch (error) {
    return { success: false, message: "Error activating cycle." };
  }
}

export async function setActiveQuarter(cycleId: string, quarter: CheckInPeriod | null) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return { success: false, message: "Unauthorized" };
  }

  try {
    await prisma.$transaction(async (tx) => {
      const cycle = await tx.goalCycle.findUnique({ where: { id: cycleId } });
      
      await tx.goalCycle.update({
        where: { id: cycleId },
        data: { activeQuarter: quarter }
      });

      await tx.auditLog.create({
        data: {
          actorId: session.user.id,
          action: "SET_ACTIVE_QUARTER",
          entityType: "GoalCycle",
          entityId: cycleId,
          oldValues: { activeQuarter: cycle?.activeQuarter },
          newValues: { activeQuarter: quarter }
        }
      });
    });

    revalidatePath("/admin/governance");
    // Also revalidate the routes that depend on this
    revalidatePath("/checkins");
    revalidatePath("/manager/checkins");
    return { success: true };
  } catch (error) {
    return { success: false, message: "Error setting active quarter." };
  }
}
