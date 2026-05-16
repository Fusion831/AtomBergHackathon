const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  await prisma.goalSheet.updateMany({
    data: { status: 'DRAFT', submittedAt: null }
  });
  console.log('Reset successful');
}

main().catch(console.error).finally(() => prisma.$disconnect());
