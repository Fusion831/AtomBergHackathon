"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/authOptions";
import { revalidatePath } from "next/cache";

export async function approveGoalSheet(sheetId: string) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== "MANAGER" && session.user.role !== "ADMIN")) {
    return { success: false, message: "Unauthorized" };
  }

  try {
    const sheet = await prisma.goalSheet.findUnique({
      where: { id: sheetId },
      include: { user: true }
    });

    if (!sheet) return { success: false, message: "Sheet not found" };
    
    // Ensure the manager owns this employee's review or is an admin
    if (session.user.role !== "ADMIN" && sheet.user.managerId !== session.user.id) {
      return { success: false, message: "You are not authorized to review this sheet." };
    }

    if (sheet.status !== "UNDER_REVIEW" && sheet.status !== "SUBMITTED") {
      return { success: false, message: "Sheet is not in a reviewable state." };
    }

    await prisma.$transaction(async (tx) => {
      await tx.goalSheet.update({
        where: { id: sheetId },
        data: { 
          status: "LOCKED",
          approvedAt: new Date(),
          lockedAt: new Date()
        }
      });

      await tx.auditLog.create({
        data: {
          actorId: session.user.id,
          action: "APPROVE_SHEET",
          entityType: "GoalSheet",
          entityId: sheetId,
          oldValues: { status: sheet.status },
          newValues: { status: "LOCKED" }
        }
      });
    });

    revalidatePath("/manager/review");
    revalidatePath(`/manager/review/${sheetId}`);
    return { success: true };
    
  } catch (error) {
    return { success: false, message: "An unexpected error occurred during approval." };
  }
}

export async function rejectGoalSheet(sheetId: string) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== "MANAGER" && session.user.role !== "ADMIN")) {
    return { success: false, message: "Unauthorized" };
  }

  try {
    const sheet = await prisma.goalSheet.findUnique({
      where: { id: sheetId },
      include: { user: true }
    });

    if (!sheet) return { success: false, message: "Sheet not found" };
    
    if (session.user.role !== "ADMIN" && sheet.user.managerId !== session.user.id) {
      return { success: false, message: "You are not authorized to review this sheet." };
    }

    if (sheet.status !== "UNDER_REVIEW" && sheet.status !== "SUBMITTED") {
      return { success: false, message: "Sheet is not in a reviewable state." };
    }

    await prisma.$transaction(async (tx) => {
      await tx.goalSheet.update({
        where: { id: sheetId },
        data: { status: "DRAFT" } // Return for rework
      });

      await tx.auditLog.create({
        data: {
          actorId: session.user.id,
          action: "REJECT_SHEET",
          entityType: "GoalSheet",
          entityId: sheetId,
          oldValues: { status: sheet.status },
          newValues: { status: "DRAFT" }
        }
      });
    });

    revalidatePath("/manager/review");
    revalidatePath(`/manager/review/${sheetId}`);
    return { success: true };
    
  } catch (error) {
    return { success: false, message: "An unexpected error occurred." };
  }
}

export async function editGoalDuringReview(goalId: string, updates: { targetValue?: number; weightage?: number; managerComment?: string }) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== "MANAGER" && session.user.role !== "ADMIN")) {
    return { success: false, message: "Unauthorized" };
  }

  try {
    const goal = await prisma.goal.findUnique({
      where: { id: goalId },
      include: { sheet: { include: { user: true } } }
    });

    if (!goal || !goal.sheet) return { success: false, message: "Goal not found" };
    
    if (session.user.role !== "ADMIN" && goal.sheet.user.managerId !== session.user.id) {
      return { success: false, message: "You are not authorized to edit this goal." };
    }

    if (goal.sheet.status === "LOCKED" || goal.sheet.status === "APPROVED") {
      return { success: false, message: "This goal sheet has already been locked and can no longer be modified." };
    }

    // Set to UNDER_REVIEW implicitly if they start editing
    if (goal.sheet.status === "SUBMITTED") {
      await prisma.goalSheet.update({
        where: { id: goal.sheet.id },
        data: { status: "UNDER_REVIEW" }
      });
    }

    await prisma.$transaction(async (tx) => {
      await tx.goal.update({
        where: { id: goalId },
        data: updates
      });

      await tx.auditLog.create({
        data: {
          actorId: session.user.id,
          action: "MANAGER_EDIT_GOAL",
          entityType: "Goal",
          entityId: goalId,
          oldValues: { targetValue: goal.targetValue, weightage: goal.weightage },
          newValues: updates
        }
      });
    });

    revalidatePath(`/manager/review/${goal.sheet.id}`);
    return { success: true };
    
  } catch (error) {
    return { success: false, message: "An unexpected error occurred." };
  }
}
