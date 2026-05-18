import { PrismaClient, Role, GoalSheetStatus, GoalStatus, UomType, CheckInPeriod, GoalType, MetricDirection } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL is missing in environment variables.");
  process.exit(1);
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Starting Developer Lean Seeding...");

  // 1. Clean Database
  console.log("Cleaning database...");
  await prisma.auditLog.deleteMany();
  await prisma.checkIn.deleteMany();
  await prisma.goal.deleteMany();
  await prisma.goalSheet.deleteMany();
  await prisma.goalCycle.deleteMany();
  await prisma.user.deleteMany();
  await prisma.department.deleteMany();

  const commonPassword = await bcrypt.hash("password", 10);

  // 2. Departments
  console.log("Seeding departments...");
  const devOps = await prisma.department.create({
    data: { name: "DevOps Engineering", description: "Systems operation and pipeline automation." }
  });
  const design = await prisma.department.create({
    data: { name: "Product Design", description: "User research, interfaces, and experience models." }
  });

  // 3. Admin User
  const admin = await prisma.user.create({
    data: {
      empId: "EMP-DEV-001",
      email: "admin@test.com",
      passwordHash: commonPassword,
      name: "Dev Admin",
      role: Role.ADMIN,
      departmentId: devOps.id
    }
  });

  // 4. Manager User
  const manager = await prisma.user.create({
    data: {
      empId: "EMP-DEV-002",
      email: "manager@test.com",
      passwordHash: commonPassword,
      name: "Dev Manager",
      role: Role.MANAGER,
      departmentId: devOps.id,
      managerId: admin.id
    }
  });

  // 5. Employee User
  const employee = await prisma.user.create({
    data: {
      empId: "EMP-DEV-101",
      email: "employee@test.com",
      passwordHash: commonPassword,
      name: "Dev Employee",
      role: Role.EMPLOYEE,
      departmentId: devOps.id,
      managerId: manager.id
    }
  });

  // 6. Goal Cycle
  const cycle = await prisma.goalCycle.create({
    data: {
      name: "Dev FY2026",
      startDate: new Date("2026-04-01T00:00:00Z"),
      endDate: new Date("2027-03-31T23:59:59Z"),
      isActive: true,
      activeQuarter: CheckInPeriod.Q2,
      planningQuarter: CheckInPeriod.Q3
    }
  });

  // 7. Seed Q2 Sheets & Goals
  console.log("Seeding Q2 sheets for local mutation...");
  
  // Employee Q2
  const empSheetQ2 = await prisma.goalSheet.create({
    data: {
      userId: employee.id,
      cycleId: cycle.id,
      quarter: CheckInPeriod.Q2,
      status: GoalSheetStatus.LOCKED,
      approvedAt: new Date(),
      lockedAt: new Date()
    }
  });

  const empGoal1 = await prisma.goal.create({
    data: {
      sheetId: empSheetQ2.id,
      ownerId: employee.id,
      departmentId: devOps.id,
      title: "Improve Continuous Integration Pipelines",
      description: "Reduce automated test build cycle times from 15 minutes to under 8 minutes.",
      thrustArea: "Pipeline Automation",
      uomType: UomType.PERCENTAGE,
      metricDirection: MetricDirection.HIGHER_IS_BETTER,
      targetValue: 100,
      weightage: 60,
      status: GoalStatus.ON_TRACK
    }
  });

  const empGoal2 = await prisma.goal.create({
    data: {
      sheetId: empSheetQ2.id,
      ownerId: employee.id,
      departmentId: devOps.id,
      title: "Standardize Helm Security Configs",
      description: "Audit and upgrade Helm deployment charts to use secure context run rules.",
      thrustArea: "Systems Security",
      uomType: UomType.PERCENTAGE,
      metricDirection: MetricDirection.HIGHER_IS_BETTER,
      targetValue: 100,
      weightage: 40,
      status: GoalStatus.NOT_STARTED
    }
  });

  // Employee Checkin for Q2 Goal 1
  await prisma.checkIn.create({
    data: {
      goalId: empGoal1.id,
      period: CheckInPeriod.Q2,
      actualValue: 60,
      actualDate: new Date(),
      progressScore: 60,
      status: GoalStatus.ON_TRACK,
      employeeComment: "Initial workflow optimization has trimmed 3 minutes from test build loops.",
      managerComment: "Promising progress. Keep optimizing database scripts in migration blocks."
    }
  });

  // Update employee goal progression status
  await prisma.goal.update({
    where: { id: empGoal1.id },
    data: { currentProgress: 60 }
  });

  // Manager Q2
  const mgrSheetQ2 = await prisma.goalSheet.create({
    data: {
      userId: manager.id,
      cycleId: cycle.id,
      quarter: CheckInPeriod.Q2,
      status: GoalSheetStatus.LOCKED,
      approvedAt: new Date(),
      lockedAt: new Date()
    }
  });

  const mgrGoal1 = await prisma.goal.create({
    data: {
      sheetId: mgrSheetQ2.id,
      ownerId: manager.id,
      departmentId: devOps.id,
      title: "Secure Kubernetes Infrastructure",
      description: "Align internal microservices infrastructure to CIS Kubernetes Benchmark standards.",
      thrustArea: "Compliance Audits",
      uomType: UomType.PERCENTAGE,
      metricDirection: MetricDirection.HIGHER_IS_BETTER,
      targetValue: 100,
      weightage: 100,
      status: GoalStatus.ON_TRACK
    }
  });

  await prisma.checkIn.create({
    data: {
      goalId: mgrGoal1.id,
      period: CheckInPeriod.Q2,
      actualValue: 40,
      actualDate: new Date(),
      progressScore: 40,
      status: GoalStatus.ON_TRACK,
      employeeComment: "Scanned existing infrastructure. Configured initial vulnerability charts.",
      managerComment: "Approved milestone. Focus next on persistent secrets tokenization."
    }
  });

  await prisma.goal.update({
    where: { id: mgrGoal1.id },
    data: { currentProgress: 40 }
  });

  // 8. Seed Q3 Planning Sheets in DRAFT state
  console.log("Seeding Q3 planning draft sheets...");
  await prisma.goalSheet.create({
    data: {
      userId: employee.id,
      cycleId: cycle.id,
      quarter: CheckInPeriod.Q3,
      status: GoalSheetStatus.DRAFT
    }
  });

  await prisma.goalSheet.create({
    data: {
      userId: manager.id,
      cycleId: cycle.id,
      quarter: CheckInPeriod.Q3,
      status: GoalSheetStatus.DRAFT
    }
  });

  // 9. Initial Audit Logs
  await prisma.auditLog.create({
    data: {
      actorId: admin.id,
      action: "INIT_DEV_ENV",
      entityType: "User",
      entityId: employee.id,
      newValues: { status: "DEV_ACTIVE" }
    }
  });

  console.log("Developer Lean Seeding complete. Ready for stress-testing workflows.");
}

main()
  .catch((e) => {
    console.error("Lean Seeding error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
