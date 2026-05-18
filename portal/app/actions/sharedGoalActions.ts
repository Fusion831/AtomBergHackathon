"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/authOptions";
import { revalidatePath } from "next/cache";
import { UomType, MetricDirection, CheckInPeriod } from "@prisma/client";

interface CreateSharedGoalInput {
  title: string;
  description: string;
  thrustArea: string;
  uomType: UomType;
  metricDirection?: MetricDirection;
  targetValue: number;
  targetDate?: Date | null;
  weightage?: number;
}

export async function createSharedGoal(data: CreateSharedGoalInput) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== "MANAGER" && session.user.role !== "ADMIN")) {
    return { success: false, message: "Unauthorized" };
  }

  try {
    const goal = await prisma.$transaction(async (tx) => {
      const newGoal = await tx.goal.create({
        data: {
          title: data.title,
          description: data.description,
          thrustArea: data.thrustArea,
          uomType: data.uomType,
          metricDirection: data.metricDirection || "HIGHER_IS_BETTER",
          targetValue: data.targetValue,
          targetDate: data.targetDate,
          weightage: data.weightage || 0, // Master goal might not need weightage if standalone
          goalType: "SHARED",
          ownerId: session.user.id,
          // Not attaching to a sheet directly if it's purely a master pool goal. 
          // But if the manager is tracking it on their own sheet, we could attach it.
          // Let's keep sheetId null for now to represent a standalone Department/Shared pool goal.
        }
      });

      await tx.auditLog.create({
        data: {
          actorId: session.user.id,
          action: "CREATE_SHARED_GOAL",
          entityType: "Goal",
          entityId: newGoal.id,
          oldValues: {},
          newValues: { title: newGoal.title, targetValue: newGoal.targetValue }
        }
      });

      return newGoal;
    });

    revalidatePath("/manager/shared-goals");
    return { success: true, goal };
  } catch (error) {
    return { success: false, message: "Error creating shared goal." };
  }
}

export async function assignSharedGoal(parentGoalId: string, employeeIds: string[], cycleId: string, quarter: CheckInPeriod) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== "MANAGER" && session.user.role !== "ADMIN")) {
    return { success: false, message: "Unauthorized" };
  }

  try {
    const parentGoal = await prisma.goal.findUnique({
      where: { id: parentGoalId }
    });

    if (!parentGoal) return { success: false, message: "Parent goal not found." };
    if (parentGoal.ownerId !== session.user.id && session.user.role !== "ADMIN") {
      return { success: false, message: "You do not own this shared goal." };
    }

    await prisma.$transaction(async (tx) => {
      for (const empId of employeeIds) {
        // Find their active DRAFT sheet for the cycle
        const sheet = await tx.goalSheet.findUnique({
          where: { userId_cycleId_quarter: { userId: empId, cycleId, quarter } }
        });

        if (!sheet) continue; // Skip if no sheet found for this cycle

        if (sheet.status !== "DRAFT") {
          // Rule: Can only assign goals if sheet is DRAFT
          // Explicitly reject SUBMITTED, UNDER_REVIEW, APPROVED, and LOCKED.
          continue;
        }

        // Enforce 8 goal limit
        const currentGoalCount = await tx.goal.count({ where: { sheetId: sheet.id } });
        if (currentGoalCount >= 8) continue;

        // Check if already assigned
        const existing = await tx.goal.findFirst({
          where: { sheetId: sheet.id, parentGoalId: parentGoal.id }
        });

        if (existing) continue;

        const childGoal = await tx.goal.create({
          data: {
            title: parentGoal.title,
            description: parentGoal.description,
            thrustArea: parentGoal.thrustArea,
            uomType: parentGoal.uomType,
            metricDirection: parentGoal.metricDirection,
            targetValue: parentGoal.targetValue,
            targetDate: parentGoal.targetDate,
            weightage: 10, // Default minimum weightage, employee must adjust
            goalType: "SHARED",
            ownerId: empId,
            sheetId: sheet.id,
            parentGoalId: parentGoal.id
          }
        });

        await tx.auditLog.create({
          data: {
            actorId: session.user.id,
            action: "ASSIGN_SHARED_GOAL",
            entityType: "Goal",
            entityId: childGoal.id,
            oldValues: {},
            newValues: { parentGoalId: parentGoal.id, employeeId: empId }
          }
        });
      }
    });

    revalidatePath("/manager/shared-goals");
    return { success: true };
  } catch (error) {
    console.error(error);
    return { success: false, message: "An error occurred during assignment." };
  }
}
