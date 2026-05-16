const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding database...");

  // Clean the database first
  await prisma.auditLog.deleteMany();
  await prisma.checkIn.deleteMany();
  await prisma.goal.deleteMany();
  await prisma.goalSheet.deleteMany();
  await prisma.user.deleteMany();
  await prisma.department.deleteMany();

  const dept = await prisma.department.create({
    data: {
      name: "Engineering",
    }
  });

  const adminPassword = await bcrypt.hash("admin123", 10);
  const managerPassword = await bcrypt.hash("manager123", 10);
  const employeePassword = await bcrypt.hash("employee123", 10);

  const admin = await prisma.user.create({
    data: {
      email: "admin@atomquest.com",
      passwordHash: adminPassword,
      name: "System Admin",
      role: "ADMIN",
      departmentId: dept.id
    }
  });

  const manager = await prisma.user.create({
    data: {
      email: "manager@atomquest.com",
      passwordHash: managerPassword,
      name: "Engineering Manager",
      role: "MANAGER",
      departmentId: dept.id
    }
  });

  const employee = await prisma.user.create({
    data: {
      email: "employee@atomquest.com",
      passwordHash: employeePassword,
      name: "Software Engineer",
      role: "EMPLOYEE",
      departmentId: dept.id,
      managerId: manager.id
    }
  });

  console.log("Database seeded successfully.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });