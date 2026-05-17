require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
  
  // Find a DRAFT sheet and lock it first
  let sheet = await prisma.goalSheet.findFirst({ where: { status: 'DRAFT' } });
  if (!sheet) {
    console.log("No draft sheet found to lock");
    return;
  }
  
  // Lock the sheet
  sheet = await prisma.goalSheet.update({
    where: { id: sheet.id },
    data: { status: 'LOCKED', lockedAt: new Date() }
  });
  console.log("Sheet locked, attempting unlock request...");
  
  try {
    await prisma.$transaction(async (tx) => {
      await tx.goalSheet.update({
        where: { id: sheet.id },
        data: { 
          unlockRequested: true,
          unlockReason: "testing"
        }
      });

      await tx.auditLog.create({
        data: {
          actorId: sheet.userId,
          action: "REQUEST_UNLOCK",
          entityType: "GoalSheet",
          entityId: sheet.id,
          oldValues: {},
          newValues: { reason: "testing" }
        }
      });
    });
    console.log("Success");
  } catch(e) {
    console.error(e);
  }
}
main().then(() => process.exit(0));
