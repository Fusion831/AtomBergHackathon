import { prisma } from './lib/prisma';

async function main() {
  try {
    const user = await prisma.user.findFirst();
    const sheet = await prisma.goalSheet.findFirst();

    if (!user || !sheet) {
      console.log('No user or sheet found');
      return;
    }

    console.log(`Using user ${user.id} and sheet ${sheet.id}`);

    const log = await prisma.auditLog.create({
      data: {
        actorId: user.id,
        action: 'UNLOCK_REQUESTED',
        entityType: 'GoalSheet',
        entityId: sheet.id,
        oldValues: JSON.stringify({}),
        newValues: JSON.stringify({ reason: 'test' }),
      }
    });
    console.log('AuditLog created:', log.id);

    const updatedSheet = await prisma.goalSheet.update({
      where: { id: sheet.id },
      data: {
        unlockRequested: true,
        unlockReason: 'test'
      }
    });
    console.log('GoalSheet updated:', updatedSheet.id);
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
