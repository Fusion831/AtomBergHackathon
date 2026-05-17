require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

(async () => {
  try {
    console.log("=== Checking Locked Sheet ===");
    const sheet = await prisma.goalSheet.findFirst({ where: { status: 'LOCKED' } });
    console.log('Locked Sheet:', JSON.stringify(sheet, null, 2));
    
    console.log("\n=== Checking Audit Logs ===");
    const auditLogs = await prisma.auditLog.findMany({
      where: { action: 'REQUEST_UNLOCK' },
      include: { actor: { select: { name: true, email: true } } }
    });
    console.log('Audit Logs:', JSON.stringify(auditLogs, null, 2));
    
    console.log("\n✅ Database verification complete!");
  } catch (err) {
    console.error("❌ Error:", err);
  } finally {
    await prisma.$disconnect();
  }
})();
