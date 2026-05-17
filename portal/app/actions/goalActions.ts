"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/authOptions";
import { GoalSchema, GoalInput } from "@/lib/validations/goal";
import { revalidatePath } from "next/cache";

export async function saveGoal(input: GoalInput, sheetId: string) {
  const session = await getServerSession(authOptions);
  if (!session) return { success: false, message: "Unauthorized" };

  const parsed = GoalSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0].message };
  }

  const sheet = await prisma.goalSheet.findUnique({
    where: { id: sheetId, userId: session.user.id },
    include: { goals: true }
  });

  if (!sheet) return { success: false, message: "Goal sheet not found" };
  if (sheet.status !== "DRAFT") return { success: false, message: "Only draft sheets can be edited" };

  const isEditing = !!input.id;
  
  if (!isEditing && sheet.goals.length >= 8) {
    return { success: false, message: "Maximum of 8 goals allowed" };
  }

  try {
    await prisma.$transaction(async (tx) => {
      if (isEditing) {
        await tx.goal.update({
          where: { id: input.id, sheetId },
          data: parsed.data
        });
      } else {
        await tx.goal.create({
          data: {
            ...parsed.data,
            sheetId,
            ownerId: session.user.id
          }
        });
      }
    });

    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    return { success: false, message: "Failed to save goal" };
  }
}

export async function deleteGoal(goalId: string, sheetId: string) {
  const session = await getServerSession(authOptions);
  if (!session) return { success: false, message: "Unauthorized" };

  const sheet = await prisma.goalSheet.findUnique({
    where: { id: sheetId, userId: session.user.id },
  });

  if (!sheet || sheet.status !== "DRAFT") {
    return { success: false, message: "Cannot edit this sheet" };
  }

  try {
    await prisma.goal.delete({
      where: { id: goalId, sheetId }
    });
    revalidatePath("/dashboard");
    return { success: true };
  } catch {
    return { success: false, message: "Failed to delete goal" };
  }
}
