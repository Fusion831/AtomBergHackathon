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
  await prisma.goalCycle.deleteMany();
  await prisma.user.deleteMany();
  await prisma.department.deleteMany();

  const dept = await prisma.department.create({
    data: {
      name: "Engineering",
      description: "Engineering Department"
    }
  });

  const commonPassword = await bcrypt.hash("password", 10);

  const admin = await prisma.user.create({
    data: {
      email: "admin@test.com",
      passwordHash: commonPassword,
      name: "System Admin",
      role: "ADMIN",
      departmentId: dept.id
    }
  });

  const manager = await prisma.user.create({
    data: {
      email: "manager@test.com",
      passwordHash: commonPassword,
      name: "Engineering Manager",
      role: "MANAGER",
      departmentId: dept.id,
      managerId: admin.id
    }
  });

  const employee = await prisma.user.create({
    data: {
      email: "employee@test.com",
      passwordHash: commonPassword,
      name: "Software Engineer",
      role: "EMPLOYEE",
      departmentId: dept.id,
      managerId: manager.id
    }
  });

  const cycle = await prisma.goalCycle.create({
    data: {
      name: "FY 2026-2027",
      startDate: new Date("2026-04-01T00:00:00Z"),
      endDate: new Date("2027-03-31T23:59:59Z"),
      isActive: true
    }
  });

  const sheet = await prisma.goalSheet.create({
    data: {
      userId: employee.id,
      cycleId: cycle.id,
      status: "DRAFT"
    }
  });

  await prisma.goal.create({
    data: {
      sheetId: sheet.id,
      ownerId: employee.id,
      departmentId: dept.id,
      title: "Ship Q1 Features",
      description: "Deliver all planned features for Q1 on time.",
      thrustArea: "Productivity",
      uomType: "PERCENTAGE",
      targetValue: 100,
      weightage: 50,
      status: "NOT_STARTED",
      goalType: "INDIVIDUAL"
    }
  });

  await prisma.goal.create({
    data: {
      sheetId: sheet.id,
      ownerId: employee.id,
      departmentId: dept.id,
      title: "Reduce Bug Backlog",
      description: "Resolve 20 P2 bugs from the backlog.",
      thrustArea: "Quality",
      uomType: "NUMERIC",
      targetValue: 20,
      weightage: 50,
      status: "NOT_STARTED",
      goalType: "INDIVIDUAL"
    }
  });

  // Manager's own goal sheet (goes to Admin for approval)
  const managerSheet = await prisma.goalSheet.create({
    data: {
      userId: manager.id,
      cycleId: cycle.id,
      status: "DRAFT"
    }
  });

  await prisma.goal.create({
    data: {
      sheetId: managerSheet.id,
      ownerId: manager.id,
      departmentId: dept.id,
      title: "Improve Team Velocity",
      description: "Increase sprint velocity by 20% through process improvements and tooling upgrades.",
      thrustArea: "Leadership",
      uomType: "PERCENTAGE",
      targetValue: 20,
      weightage: 50,
      status: "NOT_STARTED",
      goalType: "INDIVIDUAL"
    }
  });

  await prisma.goal.create({
    data: {
      sheetId: managerSheet.id,
      ownerId: manager.id,
      departmentId: dept.id,
      title: "Complete All Quarterly Check-ins",
      description: "Ensure 100% of team members complete their quarterly check-ins on time.",
      thrustArea: "People Management",
      uomType: "PERCENTAGE",
      targetValue: 100,
      weightage: 50,
      status: "NOT_STARTED",
      goalType: "INDIVIDUAL"
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