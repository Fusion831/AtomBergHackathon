const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Starting Enterprise Demo Seeding...");

  // 1. Sanitize/Clean database to prevent duplicate and orphaned records
  console.log("Cleaning existing database tables...");
  await prisma.auditLog.deleteMany();
  await prisma.checkIn.deleteMany();
  await prisma.goal.deleteMany();
  await prisma.goalSheet.deleteMany();
  await prisma.goalCycle.deleteMany();
  await prisma.user.deleteMany();
  await prisma.department.deleteMany();

  // 2. Hash default credentials
  const commonPassword = await bcrypt.hash("password", 10);

  // 3. Seed Departments (Hierarchical structure)
  console.log("Seeding hierarchical departments...");
  const engineering = await prisma.department.create({
    data: {
      name: "Platform Engineering",
      description: "Core infrastructure, cloud deployments, systems security, and SRE tooling."
    }
  });

  const product = await prisma.department.create({
    data: {
      name: "Product Management",
      description: "UX design, product integrations, roadmap scheduling, and growth initiatives."
    }
  });

  const success = await prisma.department.create({
    data: {
      name: "Customer Success",
      description: "Enterprise account relations, CSAT audits, training, and tier support."
    }
  });

  const finance = await prisma.department.create({
    data: {
      name: "Finance Operations",
      description: "Corporate billing, ledger audits, compliance policies, and AP/AR."
    }
  });

  const dataAnalytics = await prisma.department.create({
    data: {
      name: "Data & Analytics",
      description: "Data warehousing, BI reporting, pipeline engineering, and predictive models."
    }
  });

  const hr = await prisma.department.create({
    data: {
      name: "Human Resources",
      description: "Talent acquisition, leadership training, and employee experience."
    }
  });

  // 4. Seed Admins
  console.log("Seeding Administrative users...");
  const admin = await prisma.user.create({
    data: {
      empId: "EMP-001",
      email: "admin@test.com",
      passwordHash: commonPassword,
      name: "System Admin",
      role: "ADMIN",
      departmentId: engineering.id
    }
  });

  const sarah = await prisma.user.create({
    data: {
      empId: "EMP-002",
      email: "sarah.chen@test.com",
      passwordHash: commonPassword,
      name: "Sarah Chen",
      role: "ADMIN",
      departmentId: hr.id,
      managerId: admin.id
    }
  });

  // 5. Seed Managers
  console.log("Seeding Department Managers...");
  const engManager = await prisma.user.create({
    data: {
      empId: "EMP-003",
      email: "manager@test.com",
      passwordHash: commonPassword,
      name: "Engineering Manager",
      role: "MANAGER",
      departmentId: engineering.id,
      managerId: admin.id
    }
  });

  const prodManager = await prisma.user.create({
    data: {
      empId: "EMP-004",
      email: "rahul.verma@test.com",
      passwordHash: commonPassword,
      name: "Rahul Verma",
      role: "MANAGER",
      departmentId: product.id,
      managerId: admin.id
    }
  });

  const csManager = await prisma.user.create({
    data: {
      empId: "EMP-005",
      email: "priya.nair@test.com",
      passwordHash: commonPassword,
      name: "Priya Nair",
      role: "MANAGER",
      departmentId: success.id,
      managerId: admin.id
    }
  });

  const finManager = await prisma.user.create({
    data: {
      empId: "EMP-006",
      email: "michael.torres@test.com",
      passwordHash: commonPassword,
      name: "Michael Torres",
      role: "MANAGER",
      departmentId: finance.id,
      managerId: admin.id
    }
  });

  const dataManager = await prisma.user.create({
    data: {
      empId: "EMP-007",
      email: "aditi.rao@test.com",
      passwordHash: commonPassword,
      name: "Aditi Rao",
      role: "MANAGER",
      departmentId: dataAnalytics.id,
      managerId: admin.id
    }
  });

  // 6. Seed Employees
  console.log("Seeding Employees across departments...");
  const empEng1 = await prisma.user.create({
    data: {
      empId: "EMP-101",
      email: "employee@test.com",
      passwordHash: commonPassword,
      name: "Alex Rivera",
      role: "EMPLOYEE",
      departmentId: engineering.id,
      managerId: engManager.id
    }
  });

  const empEng2 = await prisma.user.create({
    data: {
      empId: "EMP-102",
      email: "david.kim@test.com",
      passwordHash: commonPassword,
      name: "David Kim",
      role: "EMPLOYEE",
      departmentId: engineering.id,
      managerId: engManager.id
    }
  });

  const empEng3 = await prisma.user.create({
    data: {
      empId: "EMP-103",
      email: "elena.rostova@test.com",
      passwordHash: commonPassword,
      name: "Elena Rostova",
      role: "EMPLOYEE",
      departmentId: engineering.id,
      managerId: engManager.id
    }
  });

  const empEng4 = await prisma.user.create({
    data: {
      empId: "EMP-104",
      email: "marcus.vance@test.com",
      passwordHash: commonPassword,
      name: "Marcus Vance",
      role: "EMPLOYEE",
      departmentId: engineering.id,
      managerId: engManager.id
    }
  });

  const empProd1 = await prisma.user.create({
    data: {
      empId: "EMP-201",
      email: "sophie.dubois@test.com",
      passwordHash: commonPassword,
      name: "Sophie Dubois",
      role: "EMPLOYEE",
      departmentId: product.id,
      managerId: prodManager.id
    }
  });

  const empProd2 = await prisma.user.create({
    data: {
      empId: "EMP-202",
      email: "james.wilson@test.com",
      passwordHash: commonPassword,
      name: "James Wilson",
      role: "EMPLOYEE",
      departmentId: product.id,
      managerId: prodManager.id
    }
  });

  const empCS1 = await prisma.user.create({
    data: {
      empId: "EMP-301",
      email: "samira.begum@test.com",
      passwordHash: commonPassword,
      name: "Samira Begum",
      role: "EMPLOYEE",
      departmentId: success.id,
      managerId: csManager.id
    }
  });

  const empCS2 = await prisma.user.create({
    data: {
      empId: "EMP-302",
      email: "carlos.mendez@test.com",
      passwordHash: commonPassword,
      name: "Carlos Mendez",
      role: "EMPLOYEE",
      departmentId: success.id,
      managerId: csManager.id
    }
  });

  const empCS3 = await prisma.user.create({
    data: {
      empId: "EMP-303",
      email: "olivia.wild@test.com",
      passwordHash: commonPassword,
      name: "Olivia Wild",
      role: "EMPLOYEE",
      departmentId: success.id,
      managerId: csManager.id
    }
  });

  const empFin1 = await prisma.user.create({
    data: {
      empId: "EMP-401",
      email: "daniel.craig@test.com",
      passwordHash: commonPassword,
      name: "Daniel Craig",
      role: "EMPLOYEE",
      departmentId: finance.id,
      managerId: finManager.id
    }
  });

  const empData1 = await prisma.user.create({
    data: {
      empId: "EMP-501",
      email: "kenji.sato@test.com",
      passwordHash: commonPassword,
      name: "Kenji Sato",
      role: "EMPLOYEE",
      departmentId: dataAnalytics.id,
      managerId: dataManager.id
    }
  });

  // 7. Seed Goal Cycles
  console.log("Seeding performance Goal Cycle (FY2026 - Q2 active, Q3 planning)...");
  const cycle = await prisma.goalCycle.create({
    data: {
      name: "FY2026 Goal Cycle",
      startDate: new Date("2026-04-01T00:00:00Z"),
      endDate: new Date("2027-03-31T23:59:59Z"),
      isActive: true,
      activeQuarter: "Q2", 
      planningQuarter: "Q3" 
    }
  });

  // 8. Seed Goal Sheets & Goals for Q2 (Performance Tracking) and Q3 (Planning)
  console.log("Seeding Quarter-Aware Goal Sheets...");

  // --- A. Alex Rivera (employee@test.com) ---
  // Locked Q2 Sheet (Operational)
  const sheetAlexQ2 = await prisma.goalSheet.create({
    data: { userId: empEng1.id, cycleId: cycle.id, quarter: "Q2", status: "LOCKED" }
  });

  // Draft Q3 Sheet (Planning)
  const sheetAlexQ3 = await prisma.goalSheet.create({
    data: { userId: empEng1.id, cycleId: cycle.id, quarter: "Q3", status: "DRAFT" }
  });

  // --- B. Engineering Manager ---
  const sheetEngManagerQ2 = await prisma.goalSheet.create({
    data: { userId: engManager.id, cycleId: cycle.id, quarter: "Q2", status: "LOCKED" }
  });
  const sheetEngManagerQ3 = await prisma.goalSheet.create({
    data: { userId: engManager.id, cycleId: cycle.id, quarter: "Q3", status: "DRAFT" }
  });

  // Master shared goal for Q2
  const masterUptimeGoal = await prisma.goal.create({
    data: {
      sheetId: sheetEngManagerQ2.id,
      ownerId: engManager.id,
      departmentId: engineering.id,
      title: "Platform Stability Initiative",
      description: "Maintain 99.99% overall platform uptime by implementing multi-region failover structures.",
      thrustArea: "Platform Uptime",
      uomType: "PERCENTAGE",
      targetValue: 99.99,
      weightage: 40,
      status: "ON_TRACK",
      goalType: "SHARED"
    }
  });

  // Alex Rivera Q2 goals
  const alexGoal1 = await prisma.goal.create({
    data: {
      sheetId: sheetAlexQ2.id,
      ownerId: empEng1.id,
      departmentId: engineering.id,
      title: "Reduce API Latency",
      description: "Optimize middleware and database indices to reduce response times by 20%.",
      thrustArea: "Performance Optimization",
      uomType: "PERCENTAGE",
      targetValue: 20,
      weightage: 40,
      status: "ON_TRACK",
      goalType: "INDIVIDUAL"
    }
  });

  const alexGoal2 = await prisma.goal.create({
    data: {
      sheetId: sheetAlexQ2.id,
      ownerId: empEng1.id,
      departmentId: engineering.id,
      title: "Build SRE Alerts Dashboard",
      description: "Deliver real-time Grafana dashboard for automated outage alerts.",
      thrustArea: "Productivity Tooling",
      uomType: "PERCENTAGE",
      targetValue: 100,
      weightage: 30,
      status: "COMPLETED",
      goalType: "INDIVIDUAL"
    }
  });

  const alexGoal3 = await prisma.goal.create({
    data: {
      sheetId: sheetAlexQ2.id,
      ownerId: empEng1.id,
      departmentId: engineering.id,
      title: "Platform Stability Initiative",
      description: "Maintain 99.99% overall platform uptime by implementing multi-region failover structures.",
      thrustArea: "Platform Uptime",
      uomType: "PERCENTAGE",
      targetValue: 99.99,
      weightage: 30,
      status: "ON_TRACK",
      goalType: "SHARED",
      parentGoalId: masterUptimeGoal.id
    }
  });

  // Alex Rivera Q3 goals (Planning)
  await prisma.goal.create({
    data: {
      sheetId: sheetAlexQ3.id,
      ownerId: empEng1.id,
      departmentId: engineering.id,
      title: "Migrate Auth to NextAuth v5",
      description: "Upgrade system authentication to use standard Jose and NextAuth v5 middleware.",
      thrustArea: "Security & Tech Debt",
      uomType: "PERCENTAGE",
      targetValue: 100,
      weightage: 50,
      status: "NOT_STARTED",
      goalType: "INDIVIDUAL"
    }
  });

  await prisma.goal.create({
    data: {
      sheetId: sheetAlexQ3.id,
      ownerId: empEng1.id,
      departmentId: engineering.id,
      title: "Optimise NextJS Server Action Bundles",
      description: "Reduce hydration and server bundle size by 15%.",
      thrustArea: "Performance Optimization",
      uomType: "PERCENTAGE",
      targetValue: 15,
      weightage: 50,
      status: "NOT_STARTED",
      goalType: "INDIVIDUAL"
    }
  });

  // Seed Alex Rivera Q1 & Q2 Check-ins for Q2 Goals
  const checkAlex1Q1 = await prisma.checkIn.create({
    data: {
      goalId: alexGoal1.id,
      period: "Q1",
      actualValue: 12,
      actualDate: new Date("2026-06-15T12:00:00Z"),
      progressScore: 60,
      status: "ON_TRACK",
      employeeComment: "Core API middleware refactored. Latency dropped by 12%. On path for target.",
      managerComment: "Excellent initial middleware improvements. Focus on index coverage next."
    }
  });

  const checkAlex1Q2 = await prisma.checkIn.create({
    data: {
      goalId: alexGoal1.id,
      period: "Q2",
      actualValue: 18,
      actualDate: new Date("2026-09-18T10:30:00Z"),
      progressScore: 90,
      status: "ON_TRACK",
      employeeComment: "Database queries indexed, current latency reduction is at 18%.",
      managerComment: "Awesome caching work, latency numbers validated and verified."
    }
  });

  await prisma.goal.update({ where: { id: alexGoal1.id }, data: { currentProgress: 90 } });

  await prisma.checkIn.create({
    data: {
      goalId: alexGoal2.id,
      period: "Q1",
      actualValue: 50,
      actualDate: new Date("2026-06-12T14:00:00Z"),
      progressScore: 50,
      status: "ON_TRACK",
      employeeComment: "Backend skeletons for SRE metrics ingested successfully. Frontend mockups finalized.",
      managerComment: "Solid progress on mockups."
    }
  });

  await prisma.checkIn.create({
    data: {
      goalId: alexGoal2.id,
      period: "Q2",
      actualValue: 100,
      actualDate: new Date("2026-09-15T11:00:00Z"),
      progressScore: 100,
      status: "COMPLETED",
      employeeComment: "Fully shipped the live SRE alerting dashboard.",
      managerComment: "Exceptional delivery! This significantly improves response times."
    }
  });

  await prisma.goal.update({ where: { id: alexGoal2.id }, data: { currentProgress: 100 } });

  await prisma.checkIn.create({
    data: {
      goalId: alexGoal3.id,
      period: "Q1",
      actualValue: 99.95,
      actualDate: new Date("2026-06-20T09:00:00Z"),
      progressScore: 80,
      status: "ON_TRACK",
      employeeComment: "99.95% uptime maintained.",
      managerComment: "Terrific job keeping the system highly responsive."
    }
  });

  await prisma.checkIn.create({
    data: {
      goalId: alexGoal3.id,
      period: "Q2",
      actualValue: 99.98,
      actualDate: new Date("2026-09-20T09:00:00Z"),
      progressScore: 95,
      status: "ON_TRACK",
      employeeComment: "Highly stable second quarter.",
      managerComment: "Excellent results. Regional failover times were well within tolerance."
    }
  });

  await prisma.goal.update({ where: { id: alexGoal3.id }, data: { currentProgress: 95 } });


  // --- C. David Kim (david.kim@test.com) ---
  const sheetDavidQ2 = await prisma.goalSheet.create({
    data: { userId: empEng2.id, cycleId: cycle.id, quarter: "Q2", status: "LOCKED" }
  });
  const sheetDavidQ3 = await prisma.goalSheet.create({
    data: { userId: empEng2.id, cycleId: cycle.id, quarter: "Q3", status: "DRAFT" }
  });

  const davidGoal1 = await prisma.goal.create({
    data: {
      sheetId: sheetDavidQ2.id,
      ownerId: empEng2.id,
      departmentId: engineering.id,
      title: "CI/CD Pipeline Speed Optimization",
      description: "Decrease build and deployment pipelines durations below 10 minutes.",
      thrustArea: "SRE Productivity",
      uomType: "NUMERIC",
      targetValue: 10,
      weightage: 50,
      status: "ON_TRACK",
      goalType: "INDIVIDUAL"
    }
  });

  const davidGoal2 = await prisma.goal.create({
    data: {
      sheetId: sheetDavidQ2.id,
      ownerId: empEng2.id,
      departmentId: engineering.id,
      title: "Platform Stability Initiative",
      description: "Maintain 99.99% overall platform uptime by implementing multi-region failover structures.",
      thrustArea: "Platform Uptime",
      uomType: "PERCENTAGE",
      targetValue: 99.99,
      weightage: 50,
      status: "ON_TRACK",
      goalType: "SHARED",
      parentGoalId: masterUptimeGoal.id
    }
  });

  await prisma.checkIn.create({
    data: {
      goalId: davidGoal1.id,
      period: "Q1",
      actualValue: 18,
      actualDate: new Date("2026-06-10T10:00:00Z"),
      progressScore: 40,
      status: "ON_TRACK",
      employeeComment: "Integrated runner caching.",
      managerComment: "Great start."
    }
  });

  await prisma.checkIn.create({
    data: {
      goalId: davidGoal1.id,
      period: "Q2",
      actualValue: 11,
      actualDate: new Date("2026-09-11T10:00:00Z"),
      progressScore: 90,
      status: "ON_TRACK",
      employeeComment: "Multi-stage builds automated.",
      managerComment: "Extremely close to the 10-minute threshold."
    }
  });
  await prisma.goal.update({ where: { id: davidGoal1.id }, data: { currentProgress: 90 } });


  // --- D. Kenji Sato (kenji.sato@test.com) ---
  const sheetKenjiQ2 = await prisma.goalSheet.create({
    data: { userId: empData1.id, cycleId: cycle.id, quarter: "Q2", status: "LOCKED" }
  });
  const sheetKenjiQ3 = await prisma.goalSheet.create({
    data: { userId: empData1.id, cycleId: cycle.id, quarter: "Q3", status: "DRAFT" }
  });

  const kenjiGoal1 = await prisma.goal.create({
    data: {
      sheetId: sheetKenjiQ2.id,
      ownerId: empData1.id,
      departmentId: dataAnalytics.id,
      title: "Predictive Churn ML Model",
      description: "Build customer churn model yielding predictive accuracy of 90% or higher.",
      thrustArea: "Data Science Products",
      uomType: "PERCENTAGE",
      targetValue: 90,
      weightage: 60,
      status: "ON_TRACK",
      goalType: "INDIVIDUAL"
    }
  });

  const kenjiGoal2 = await prisma.goal.create({
    data: {
      sheetId: sheetKenjiQ2.id,
      ownerId: empData1.id,
      departmentId: dataAnalytics.id,
      title: "Snowflake Pipeline Optimization",
      description: "Decrease warehouse queries latency by 30% through clustering optimization.",
      thrustArea: "Infrastructure Performance",
      uomType: "PERCENTAGE",
      targetValue: 30,
      weightage: 40,
      status: "COMPLETED",
      goalType: "INDIVIDUAL"
    }
  });

  await prisma.checkIn.create({
    data: {
      goalId: kenjiGoal1.id,
      period: "Q1",
      actualValue: 80,
      actualDate: new Date("2026-06-18T10:00:00Z"),
      progressScore: 75,
      status: "ON_TRACK",
      employeeComment: "Random Forest baseline model completed.",
      managerComment: "Solid baseline."
    }
  });
  await prisma.checkIn.create({
    data: {
      goalId: kenjiGoal1.id,
      period: "Q2",
      actualValue: 88,
      actualDate: new Date("2026-09-18T10:00:00Z"),
      progressScore: 95,
      status: "ON_TRACK",
      employeeComment: "Tuned hyperparameters using XGBoost.",
      managerComment: "Excellent optimization loop."
    }
  });
  await prisma.goal.update({ where: { id: kenjiGoal1.id }, data: { currentProgress: 95 } });


  // --- E. Sophie Dubois (empProd1) - Submitted Q3 Planning ---
  const sheetSophieQ2 = await prisma.goalSheet.create({
    data: { userId: empProd1.id, cycleId: cycle.id, quarter: "Q2", status: "LOCKED" }
  });

  const sheetSophieQ3 = await prisma.goalSheet.create({
    data: {
      userId: empProd1.id,
      cycleId: cycle.id,
      quarter: "Q3",
      status: "SUBMITTED",
      submittedAt: new Date("2026-05-10T12:00:00Z")
    }
  });

  await prisma.goal.create({
    data: {
      sheetId: sheetSophieQ3.id,
      ownerId: empProd1.id,
      departmentId: product.id,
      title: "Product UX Engagement Lift",
      description: "Improve core feature click-through rate by 15% through a simplified user dashboard.",
      thrustArea: "User Engagement",
      uomType: "PERCENTAGE",
      targetValue: 15,
      weightage: 50,
      status: "NOT_STARTED",
      goalType: "INDIVIDUAL"
    }
  });

  await prisma.goal.create({
    data: {
      sheetId: sheetSophieQ3.id,
      ownerId: empProd1.id,
      departmentId: product.id,
      title: "Launch Integration Partner Module",
      description: "Deliver and launch unified integration hub with 3 top SaaS partners.",
      thrustArea: "Core Deliverables",
      uomType: "PERCENTAGE",
      targetValue: 100,
      weightage: 50,
      status: "NOT_STARTED",
      goalType: "INDIVIDUAL"
    }
  });


  // --- F. Samira Begum (empCS1) - Q3 Under Review ---
  const sheetSamiraQ2 = await prisma.goalSheet.create({
    data: { userId: empCS1.id, cycleId: cycle.id, quarter: "Q2", status: "LOCKED" }
  });

  const sheetSamiraQ3 = await prisma.goalSheet.create({
    data: {
      userId: empCS1.id,
      cycleId: cycle.id,
      quarter: "Q3",
      status: "UNDER_REVIEW",
      submittedAt: new Date("2026-05-12T14:30:00Z")
    }
  });

  await prisma.goal.create({
    data: {
      sheetId: sheetSamiraQ3.id,
      ownerId: empCS1.id,
      departmentId: success.id,
      title: "Enterprise CSAT Elevation",
      description: "Elevate overall CSAT rating to 95% across premium support accounts.",
      thrustArea: "Customer Satisfaction",
      uomType: "PERCENTAGE",
      targetValue: 95,
      weightage: 40,
      status: "NOT_STARTED",
      goalType: "INDIVIDUAL"
    }
  });


  // --- G. Daniel Craig (empFin1) - Q3 in Draft ---
  const sheetDanielQ2 = await prisma.goalSheet.create({
    data: { userId: empFin1.id, cycleId: cycle.id, quarter: "Q2", status: "LOCKED" }
  });

  const sheetDanielQ3 = await prisma.goalSheet.create({
    data: {
      userId: empFin1.id,
      cycleId: cycle.id,
      quarter: "Q3",
      status: "DRAFT"
    }
  });

  await prisma.goal.create({
    data: {
      sheetId: sheetDanielQ3.id,
      ownerId: empFin1.id,
      departmentId: finance.id,
      title: "AP/AR Automated Invoicing Migration",
      description: "Migrate 90% of legacy accounts to custom automated billing dashboard.",
      thrustArea: "Operational Efficiency",
      uomType: "PERCENTAGE",
      targetValue: 90,
      weightage: 50,
      status: "NOT_STARTED",
      goalType: "INDIVIDUAL"
    }
  });


  // --- H. Elena Rostova (empEng3) - Locked Q2 sheet with UNLOCK REQUESTED ---
  const sheetElenaQ2 = await prisma.goalSheet.create({
    data: {
      userId: empEng3.id,
      cycleId: cycle.id,
      quarter: "Q2",
      status: "LOCKED",
      unlockRequested: true,
      unlockReason: "Our AWS budget cap shifted mid-quarter. I need to restate Q2 resource optimization targets."
    }
  });

  // Draft Q3 Sheet (Planning)
  const sheetElenaQ3 = await prisma.goalSheet.create({
    data: {
      userId: empEng3.id,
      cycleId: cycle.id,
      quarter: "Q3",
      status: "DRAFT"
    }
  });

  await prisma.goal.create({
    data: {
      sheetId: sheetElenaQ2.id,
      ownerId: empEng3.id,
      departmentId: engineering.id,
      title: "Deploy Multi-Cloud Backup Clusters",
      description: "Achieve warm standby secondary disaster recovery replication on Azure.",
      thrustArea: "Disaster Recovery",
      uomType: "PERCENTAGE",
      targetValue: 100,
      weightage: 50,
      status: "ON_TRACK",
      goalType: "INDIVIDUAL"
    }
  });

  await prisma.goal.create({
    data: {
      sheetId: sheetElenaQ2.id,
      ownerId: empEng3.id,
      departmentId: engineering.id,
      title: "Optimise K8s Resource Requests",
      description: "Achieve 20% cluster infrastructure savings by rightsizing node allocations.",
      thrustArea: "Cost Optimization",
      uomType: "PERCENTAGE",
      targetValue: 20,
      weightage: 50,
      status: "ON_TRACK",
      goalType: "INDIVIDUAL"
    }
  });


  // 9. Seed System Audit Logs for Governance Feed
  console.log("Seeding chronologically consistent Governance Audit Logs...");

  await prisma.auditLog.create({
    data: {
      actorId: admin.id,
      action: "CREATE_CYCLE",
      entityType: "GoalCycle",
      entityId: cycle.id,
      newValues: { name: "FY2026 Goal Cycle", startDate: "2026-04-01T00:00:00Z", endDate: "2027-03-31T23:59:59Z" },
      createdAt: new Date("2026-04-02T09:00:00Z")
    }
  });

  await prisma.auditLog.create({
    data: {
      actorId: admin.id,
      action: "SET_ACTIVE_CYCLE",
      entityType: "GoalCycle",
      entityId: cycle.id,
      newValues: { isActive: true },
      createdAt: new Date("2026-04-02T09:05:00Z")
    }
  });

  await prisma.auditLog.create({
    data: {
      actorId: admin.id,
      action: "SET_ACTIVE_QUARTER",
      entityType: "GoalCycle",
      entityId: cycle.id,
      newValues: { activeQuarter: "Q2" },
      createdAt: new Date("2026-04-02T09:10:00Z")
    }
  });

  await prisma.auditLog.create({
    data: {
      actorId: admin.id,
      action: "SET_PLANNING_QUARTER",
      entityType: "GoalCycle",
      entityId: cycle.id,
      newValues: { planningQuarter: "Q3" },
      createdAt: new Date("2026-04-02T09:12:00Z")
    }
  });

  await prisma.auditLog.create({
    data: {
      actorId: empEng1.id,
      action: "SUBMIT_SHEET",
      entityType: "GoalSheet",
      entityId: sheetAlexQ2.id,
      newValues: { status: "SUBMITTED", quarter: "Q2" },
      createdAt: new Date("2026-04-10T10:00:00Z")
    }
  });

  await prisma.auditLog.create({
    data: {
      actorId: engManager.id,
      action: "APPROVE_SHEET",
      entityType: "GoalSheet",
      entityId: sheetAlexQ2.id,
      newValues: { status: "LOCKED", quarter: "Q2" },
      createdAt: new Date("2026-04-12T14:00:00Z")
    }
  });

  await prisma.auditLog.create({
    data: {
      actorId: empEng3.id,
      action: "REQUEST_UNLOCK",
      entityType: "GoalSheet",
      entityId: sheetElenaQ2.id,
      newValues: { reason: "AWS budget capping requires target weight adjustment.", quarter: "Q2" },
      createdAt: new Date("2026-07-02T10:00:00Z")
    }
  });

  console.log("Database seeded successfully with high-fidelity corporate dataset.");
}

main()
  .catch((e) => {
    console.error("Encountered seeding error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });