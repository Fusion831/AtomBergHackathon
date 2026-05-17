require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  await prisma.goalCycle.updateMany({
    where: { isActive: true },
    data: { activeQuarter: "Q1" }
  });
  console.log("Checkin window opened for Q1!");
}
main().then(() => process.exit(0)).catch(console.error);
