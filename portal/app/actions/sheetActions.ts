"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/authOptions";
import { revalidatePath } from "next/cache";

export async function submitGoalSheet(sheetId: string) {
  const session = await getServerSession(authOptions);
  if (!session) return { success: false, message: "Unauthorized" };

  try {
    const sheet = await prisma.goalSheet.findUnique({
      where: { id: sheetId, userId: session.user.id },
      include: { goals: true }
    });

    if (!sheet) return { success: false, message: "Sheet not found" };
    if (sheet.status !== "DRAFT") return { success: false, message: "Sheet is already submitted" };

    const totalWeight = sheet.goals.reduce((acc, goal) => acc + goal.weightage, 0);
    
    if (totalWeight !== 100) {
      return { 
        success: false, 
        message: `Your goals current equal ${totalWeight}%. Please adjust weightages to total exactly 100% before submitting.` 
      };
    }

    if (sheet.goals.length === 0) {
      return { success: false, message: "You must add at least one goal before submitting." };
    }

    await prisma.$transaction(async (tx) => {
      // 1. Lock the sheet status
      await tx.goalSheet.update({
        where: { id: sheetId },
        data: { 
          status: "SUBMITTED",
          submittedAt: new Date()
        }
      });

      // 2. Add an audit log entry for this workflow transition
      await tx.auditLog.create({
        data: {
          actorId: session.user.id,
          action: "SUBMIT_SHEET",
          entityType: "GoalSheet",
          entityId: sheetId,
          oldValues: { status: "DRAFT" },
          newValues: { status: "SUBMITTED" }
        }
      });
    });

    revalidatePath("/dashboard");
    revalidatePath("/goals/draft");
    revalidatePath("/manager/review");
    return { success: true };
    
  } catch (error) {
    return { success: false, message: "An unexpected error occurred during submission." };
  }
}

export async function requestUnlock(sheetId: string, reason: string) {
  const session = await getServerSession(authOptions);
  if (!session) return { success: false, message: "Unauthorized" };

  try {
    const sheet = await prisma.goalSheet.findFirst({
      where: { id: sheetId, userId: session.user.id }
    });

    if (!sheet) return { success: false, message: "Sheet not found" };
    if (sheet.status !== "LOCKED") return { success: false, message: "Only locked sheets can request unlocks." };
    if (sheet.unlockRequested) return { success: false, message: "An unlock request is already pending." };

    await prisma.$transaction(async (tx) => {
      await tx.goalSheet.update({
        where: { id: sheetId },
        data: { 
          unlockRequested: true,
          unlockReason: reason
        }
      });

      await tx.auditLog.create({
        data: {
          actorId: session.user.id,
          action: "REQUEST_UNLOCK",
          entityType: "GoalSheet",
          entityId: sheetId,
          oldValues: {},
          newValues: { reason }
        }
      });
    });

    revalidatePath("/goals/draft");
    revalidatePath("/dashboard");
    return { success: true };
    
  } catch (error) {
    console.error("Error in requestUnlock:", error);
    return { success: false, message: "An error occurred while requesting unlock." };
  }
}
