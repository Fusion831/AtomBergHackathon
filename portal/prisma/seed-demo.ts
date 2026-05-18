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

interface GoalDef {
  title: string;
  description: string;
  thrustArea: string;
  uomType: UomType;
  targetValue: number;
}

const DEPT_GOALS: Record<string, { Q1: GoalDef[]; Q2: GoalDef[]; Q3: GoalDef[] }> = {
  "Platform Engineering": {
    Q1: [
      { title: "Kubernetes Migration Phase 1", description: "Successfully migrate 60% of legacy core microservices to centralized EKS cluster.", thrustArea: "Infrastructure Security", uomType: UomType.PERCENTAGE, targetValue: 60 },
      { title: "Reduce Database Query Latency", description: "Optimize index coverage and slow query logs to reduce response times by 30%.", thrustArea: "Performance Optimization", uomType: UomType.PERCENTAGE, targetValue: 30 }
    ],
    Q2: [
      { title: "Scale Multi-Region Clusters", description: "Achieve warm standby secondary disaster recovery replication on Azure.", thrustArea: "Platform Uptime", uomType: UomType.PERCENTAGE, targetValue: 100 },
      { title: "Build Automated SRE Alerter", description: "Deliver real-time Grafana dashboard for automated outage alerts.", thrustArea: "Productivity Tooling", uomType: UomType.PERCENTAGE, targetValue: 100 }
    ],
    Q3: [
      { title: "Draft Security Tokenization Engine", description: "Propose end-to-end tokenization architecture for API secure payments.", thrustArea: "Security & Tech Debt", uomType: UomType.PERCENTAGE, targetValue: 100 },
      { title: "Migrate API Gateway", description: "Upgrade central ingress control to NextAuth v5 and Jose tokens.", thrustArea: "Platform Optimization", uomType: UomType.PERCENTAGE, targetValue: 100 }
    ]
  },
  "Product Management": {
    Q1: [
      { title: "Q1 UX Research & Wireframing", description: "Conduct user feedback loops on core widgets and refine mockups.", thrustArea: "User Engagement", uomType: UomType.PERCENTAGE, targetValue: 100 },
      { title: "Feature Adoption Analysis", description: "Implement Mixpanel tracking across new billing modules to monitor engagement.", thrustArea: "Product Metrics", uomType: UomType.PERCENTAGE, targetValue: 100 }
    ],
    Q2: [
      { title: "Launch Partner Integration Hub", description: "Deliver and launch unified integration hub with 3 top SaaS partners.", thrustArea: "Core Deliverables", uomType: UomType.PERCENTAGE, targetValue: 100 },
      { title: "Revamp Core User Onboarding", description: "Improve core feature click-through rate by 15% through a simplified user dashboard.", thrustArea: "User Experience", uomType: UomType.PERCENTAGE, targetValue: 15 }
    ],
    Q3: [
      { title: "Draft Mobile Web App Roadmap", description: "Submit wireframes and product requirement docs for the Q4 mobile initiative.", thrustArea: "Mobile Alignment", uomType: UomType.PERCENTAGE, targetValue: 100 },
      { title: "Launch Beta Feedback Loop", description: "Establish premium customer advisory board for beta feature testing.", thrustArea: "User Engagement", uomType: UomType.PERCENTAGE, targetValue: 100 }
    ]
  },
  "Customer Success": {
    Q1: [
      { title: "CSAT Improvement Plan", description: "Improve average account CSAT rating to 90% through proactive support.", thrustArea: "Customer Satisfaction", uomType: UomType.PERCENTAGE, targetValue: 90 },
      { title: "Premium Account QBRs", description: "Complete Q1 Quarterly Business Reviews for top 15 enterprise accounts.", thrustArea: "Engagement Metrics", uomType: UomType.PERCENTAGE, targetValue: 100 }
    ],
    Q2: [
      { title: "Reduce Churn in High-Tier Accounts", description: "Maintain churn rate below 2% by implementing proactive check-ins.", thrustArea: "Revenue Retention", uomType: UomType.PERCENTAGE, targetValue: 2 },
      { title: "Build Help Center V2", description: "Re-organize self-service knowledge base to decrease support ticket volume by 15%.", thrustArea: "Support Efficiency", uomType: UomType.PERCENTAGE, targetValue: 15 }
    ],
    Q3: [
      { title: "Customer Advocacy Program", description: "Sign up 5 enterprise accounts for public case studies and video testimonials.", thrustArea: "Brand Advocacy", uomType: UomType.PERCENTAGE, targetValue: 100 },
      { title: "Draft Customer Support SLAs", description: "Establish high-fidelity support response time targets for Q4 cycles.", thrustArea: "Operational Efficiency", uomType: UomType.PERCENTAGE, targetValue: 100 }
    ]
  },
  "Finance Operations": {
    Q1: [
      { title: "Ledger Audit Integration", description: "Successfully integrate cloud expense reporting into centralized billing ledger.", thrustArea: "Accounting Compliance", uomType: UomType.PERCENTAGE, targetValue: 100 },
      { title: "Expense Reconciliation Audit", description: "Reduce end-of-month reconciliation turnaround duration to under 3 days.", thrustArea: "Process Efficiency", uomType: UomType.PERCENTAGE, targetValue: 100 }
    ],
    Q2: [
      { title: "AP/AR Automated Billing Dashboard", description: "Migrate 90% of legacy accounts to custom automated billing dashboard.", thrustArea: "Operational Efficiency", uomType: UomType.PERCENTAGE, targetValue: 90 },
      { title: "Tax Compliance Reporting", description: "Submit audited reports for regional tax structures with zero warnings.", thrustArea: "Regulatory Risk", uomType: UomType.PERCENTAGE, targetValue: 100 }
    ],
    Q3: [
      { title: "Capital Expenditure Modeling", description: "Submit Q4 CapEx forecast to the executive board.", thrustArea: "Financial Planning", uomType: UomType.PERCENTAGE, targetValue: 100 },
      { title: "Draft Vendor Payments V2", description: "Refactor automated ACH payments processor system rules.", thrustArea: "Systems Architecture", uomType: UomType.PERCENTAGE, targetValue: 100 }
    ]
  },
  "Data & Analytics": {
    Q1: [
      { title: "Snowflake Warehouse Optimization", description: "Decrease warehouse queries latency by 30% through clustering optimization.", thrustArea: "Infrastructure Performance", uomType: UomType.PERCENTAGE, targetValue: 30 },
      { title: "BI Performance Dashboard", description: "Deliver unified company executive BI dashboard with real-time analytics updates.", thrustArea: "Business Intelligence", uomType: UomType.PERCENTAGE, targetValue: 100 }
    ],
    Q2: [
      { title: "Predictive Churn ML Model Tuning", description: "Build customer churn model yielding predictive accuracy of 90% or higher.", thrustArea: "Data Science Products", uomType: UomType.PERCENTAGE, targetValue: 90 },
      { title: "Kafka Real-Time Pipelines", description: "Migrate core ledger analytics ingestion pipeline to event-driven Kafka stream.", thrustArea: "Pipeline Engineering", uomType: UomType.PERCENTAGE, targetValue: 100 }
    ],
    Q3: [
      { title: "Draft Unified Customer Lakehouse", description: "Submit architecture design for Delta Lake integrations.", thrustArea: "Strategic Analytics", uomType: UomType.PERCENTAGE, targetValue: 100 },
      { title: "Implement Anomaly Alerting", description: "Develop automated detection scripts for core telemetry logs.", thrustArea: "Operational Excellence", uomType: UomType.PERCENTAGE, targetValue: 100 }
    ]
  },
  "Human Resources": {
    Q1: [
      { title: "Talent Acquisition Redesign", description: "Scale recruitment channels to reduce Average Time-to-Hire to under 25 days.", thrustArea: "Hiring Efficiency", uomType: UomType.PERCENTAGE, targetValue: 100 },
      { title: "Leadership Development Program", description: "Enroll and certify 85% of department managers in regional executive coaching.", thrustArea: "Manager Enablement", uomType: UomType.PERCENTAGE, targetValue: 85 }
    ],
    Q2: [
      { title: "Employee Retention Initiatives", description: "Develop high-fidelity feedback loops to maintain voluntary annual turnover below 5%.", thrustArea: "Retention Metrics", uomType: UomType.PERCENTAGE, targetValue: 5 },
      { title: "Annual Review Cycle Prep", description: "Draft standard competency frameworks and performance guidelines.", thrustArea: "Career Frameworks", uomType: UomType.PERCENTAGE, targetValue: 100 }
    ],
    Q3: [
      { title: "Draft Talent Management Portal", description: "Propose functional specifications for self-service internal mobility tools.", thrustArea: "Internal Mobility", uomType: UomType.PERCENTAGE, targetValue: 100 },
      { title: "Redesign Workspace Benefits", description: "Align medical and wellness packages with remote-first standard structures.", thrustArea: "Compensation Plans", uomType: UomType.PERCENTAGE, targetValue: 100 }
    ]
  }
};

async function main() {
  console.log("Starting Enterprise High-Fidelity Seeding...");

  // 1. Clear database
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
  const depts: Record<string, any> = {};
  const deptList = [
    { name: "Platform Engineering", desc: "Core infrastructure, cloud deployments, systems security, and SRE tooling." },
    { name: "Product Management", desc: "UX design, product integrations, roadmap scheduling, and growth initiatives." },
    { name: "Customer Success", desc: "Enterprise account relations, CSAT audits, training, and tier support." },
    { name: "Finance Operations", desc: "Corporate billing, ledger audits, compliance policies, and AP/AR." },
    { name: "Data & Analytics", desc: "Data warehousing, BI reporting, pipeline engineering, and predictive models." },
    { name: "Human Resources", desc: "Talent acquisition, leadership training, and employee experience." }
  ];

  for (const d of deptList) {
    const dept = await prisma.department.create({
      data: { name: d.name, description: d.desc }
    });
    depts[d.name] = dept;
  }

  // 3. Admin & HR Advisor
  const admin = await prisma.user.create({
    data: { empId: "EMP-001", email: "admin@test.com", passwordHash: commonPassword, name: "System Admin", role: Role.ADMIN, departmentId: depts["Platform Engineering"].id }
  });

  const sarah = await prisma.user.create({
    data: { empId: "EMP-002", email: "sarah.chen@test.com", passwordHash: commonPassword, name: "Sarah Chen", role: Role.ADMIN, departmentId: depts["Human Resources"].id, managerId: admin.id }
  });

  // 4. Managers
  const managers = [
    { empId: "EMP-003", email: "manager@test.com", name: "Engineering Manager", role: Role.MANAGER, deptName: "Platform Engineering" },
    { empId: "EMP-004", email: "rahul.verma@test.com", name: "Rahul Verma", role: Role.MANAGER, deptName: "Product Management" },
    { empId: "EMP-005", email: "priya.nair@test.com", name: "Priya Nair", role: Role.MANAGER, deptName: "Customer Success" },
    { empId: "EMP-006", email: "michael.torres@test.com", name: "Michael Torres", role: Role.MANAGER, deptName: "Finance Operations" },
    { empId: "EMP-007", email: "aditi.rao@test.com", name: "Aditi Rao", role: Role.MANAGER, deptName: "Data & Analytics" }
  ];

  const managerRecords: Record<string, any> = {};
  for (const m of managers) {
    const rec = await prisma.user.create({
      data: { empId: m.empId, email: m.email, passwordHash: commonPassword, name: m.name, role: m.role as Role, departmentId: depts[m.deptName].id, managerId: admin.id }
    });
    managerRecords[m.deptName] = rec;
  }

  // 5. Employees
  const employees = [
    { empId: "EMP-101", email: "employee@test.com", name: "Alex Rivera", role: Role.EMPLOYEE, deptName: "Platform Engineering", manager: managerRecords["Platform Engineering"] },
    { empId: "EMP-102", email: "david.kim@test.com", name: "David Kim", role: Role.EMPLOYEE, deptName: "Platform Engineering", manager: managerRecords["Platform Engineering"] },
    { empId: "EMP-103", email: "elena.rostova@test.com", name: "Elena Rostova", role: Role.EMPLOYEE, deptName: "Platform Engineering", manager: managerRecords["Platform Engineering"] },
    { empId: "EMP-104", email: "marcus.vance@test.com", name: "Marcus Vance", role: Role.EMPLOYEE, deptName: "Platform Engineering", manager: managerRecords["Platform Engineering"] },
    { empId: "EMP-201", email: "sophie.dubois@test.com", name: "Sophie Dubois", role: Role.EMPLOYEE, deptName: "Product Management", manager: managerRecords["Product Management"] },
    { empId: "EMP-202", email: "james.wilson@test.com", name: "James Wilson", role: Role.EMPLOYEE, deptName: "Product Management", manager: managerRecords["Product Management"] },
    { empId: "EMP-301", email: "samira.begum@test.com", name: "Samira Begum", role: Role.EMPLOYEE, deptName: "Customer Success", manager: managerRecords["Customer Success"] },
    { empId: "EMP-302", email: "carlos.mendez@test.com", name: "Carlos Mendez", role: Role.EMPLOYEE, deptName: "Customer Success", manager: managerRecords["Customer Success"] },
    { empId: "EMP-303", email: "olivia.wild@test.com", name: "Olivia Wild", role: Role.EMPLOYEE, deptName: "Customer Success", manager: managerRecords["Customer Success"] },
    { empId: "EMP-401", email: "daniel.craig@test.com", name: "Daniel Craig", role: Role.EMPLOYEE, deptName: "Finance Operations", manager: managerRecords["Finance Operations"] },
    { empId: "EMP-501", email: "kenji.sato@test.com", name: "Kenji Sato", role: Role.EMPLOYEE, deptName: "Data & Analytics", manager: managerRecords["Data & Analytics"] }
  ];

  const employeeRecords: { record: any; deptName: string }[] = [];
  for (const e of employees) {
    const rec = await prisma.user.create({
      data: { empId: e.empId, email: e.email, passwordHash: commonPassword, name: e.name, role: e.role as Role, departmentId: depts[e.deptName].id, managerId: e.manager.id }
    });
    employeeRecords.push({ record: rec, deptName: e.deptName });
  }

  // 6. Goal Cycle
  const cycle = await prisma.goalCycle.create({
    data: {
      name: "FY2026 Goal Cycle",
      startDate: new Date("2026-04-01T00:00:00Z"),
      endDate: new Date("2027-03-31T23:59:59Z"),
      isActive: true,
      activeQuarter: CheckInPeriod.Q2,
      planningQuarter: CheckInPeriod.Q3
    }
  });

  // 7. Seed Q1, Q2, and Q3 sheets for all managers and employees
  const allParticipants = [
    { record: sarah, deptName: "Human Resources", isManager: true },
    ...Object.values(managerRecords).map(m => ({
      record: m,
      deptName: Object.keys(managerRecords).find(k => managerRecords[k].id === m.id)!,
      isManager: true
    })),
    ...employeeRecords.map(e => ({ record: e.record, deptName: e.deptName, isManager: false }))
  ];

  // Explicitly create a Master Shared Goal for Q2
  const platformEngManager = managerRecords["Platform Engineering"];
  const sheetEngManagerQ2 = await prisma.goalSheet.create({
    data: { userId: platformEngManager.id, cycleId: cycle.id, quarter: CheckInPeriod.Q2, status: GoalSheetStatus.LOCKED }
  });

  const masterUptimeGoal = await prisma.goal.create({
    data: {
      sheetId: sheetEngManagerQ2.id,
      ownerId: platformEngManager.id,
      departmentId: depts["Platform Engineering"].id,
      title: "Platform Stability Initiative",
      description: "Maintain 99.99% overall platform uptime by implementing multi-region failover structures.",
      thrustArea: "Platform Uptime",
      uomType: UomType.PERCENTAGE,
      targetValue: 99.99,
      weightage: 50,
      status: GoalStatus.ON_TRACK,
      goalType: GoalType.SHARED
    }
  });

  console.log(`Seeding Q1, Q2, Q3 data for all ${allParticipants.length} enterprise participants...`);
  for (const part of allParticipants) {
    const user = part.record;
    const dept = depts[part.deptName];
    const goalsDef = DEPT_GOALS[part.deptName] || DEPT_GOALS["Platform Engineering"];

    // ---------------- Q1 LOCKED (Archived History) ----------------
    const sheetQ1 = await prisma.goalSheet.create({
      data: { userId: user.id, cycleId: cycle.id, quarter: CheckInPeriod.Q1, status: GoalSheetStatus.LOCKED, approvedAt: new Date("2026-06-30T17:00:00Z"), lockedAt: new Date("2026-06-30T17:05:00Z") }
    });

    for (let i = 0; i < goalsDef.Q1.length; i++) {
      const gDef = goalsDef.Q1[i];
      const weight = i === 0 ? 60 : 40;
      const goal = await prisma.goal.create({
        data: {
          sheetId: sheetQ1.id,
          ownerId: user.id,
          departmentId: dept.id,
          title: gDef.title,
          description: gDef.description,
          thrustArea: gDef.thrustArea,
          uomType: gDef.uomType,
          targetValue: gDef.targetValue,
          weightage: weight,
          status: GoalStatus.COMPLETED,
          goalType: GoalType.INDIVIDUAL,
          currentProgress: 100
        }
      });

      // Q1 check-in
      await prisma.checkIn.create({
        data: {
          goalId: goal.id,
          period: CheckInPeriod.Q1,
          actualValue: gDef.targetValue,
          actualDate: new Date("2026-06-15T12:00:00Z"),
          progressScore: 100,
          status: GoalStatus.COMPLETED,
          employeeComment: `Q1 operational sprint deliverables fully completed for: ${gDef.title}. Verified core thresholds.`,
          managerComment: `Excellent execution and highly stable rollout. Metric validated and approved.`
        }
      });
    }

    // ---------------- Q2 LOCKED (Active Execution) ----------------
    let sheetQ2 = null;
    if (user.id === platformEngManager.id) {
      sheetQ2 = sheetEngManagerQ2;
    } else {
      sheetQ2 = await prisma.goalSheet.create({
        data: { userId: user.id, cycleId: cycle.id, quarter: CheckInPeriod.Q2, status: GoalSheetStatus.LOCKED, approvedAt: new Date("2026-09-30T17:00:00Z"), lockedAt: new Date("2026-09-30T17:05:00Z") }
      });
    }

    // Custom flow for Elena (Unlock requested)
    if (user.email === "elena.rostova@test.com") {
      await prisma.goalSheet.update({
        where: { id: sheetQ2.id },
        data: {
          unlockRequested: true,
          unlockReason: "Our AWS budget cap shifted mid-quarter. I need to restate Q2 resource optimization targets."
        }
      });
    }

    for (let i = 0; i < goalsDef.Q2.length; i++) {
      const gDef = goalsDef.Q2[i];
      const weight = i === 0 ? 50 : 50;

      // Check if we can cascade master stability goal to Platform Engineering direct reports
      const isSharedCascade = part.deptName === "Platform Engineering" && !part.isManager && i === 0;

      const goal = await prisma.goal.create({
        data: {
          sheetId: sheetQ2.id,
          ownerId: user.id,
          departmentId: dept.id,
          title: isSharedCascade ? "Platform Stability Initiative" : gDef.title,
          description: isSharedCascade ? "Maintain 99.99% overall platform uptime by implementing multi-region failover structures." : gDef.description,
          thrustArea: isSharedCascade ? "Platform Uptime" : gDef.thrustArea,
          uomType: gDef.uomType,
          targetValue: isSharedCascade ? 99.99 : gDef.targetValue,
          weightage: weight,
          status: GoalStatus.ON_TRACK,
          goalType: isSharedCascade ? GoalType.SHARED : GoalType.INDIVIDUAL,
          parentGoalId: isSharedCascade ? masterUptimeGoal.id : null
        }
      });

      const q1Score = i === 0 ? 60 : 40;
      const q2Score = i === 0 ? 90 : 80;

      // Q1 check-in (earlier progress)
      await prisma.checkIn.create({
        data: {
          goalId: goal.id,
          period: CheckInPeriod.Q1,
          actualValue: isSharedCascade ? 99.95 : (gDef.targetValue * (q1Score / 100)),
          actualDate: new Date("2026-06-12T10:00:00Z"),
          progressScore: q1Score,
          status: GoalStatus.ON_TRACK,
          employeeComment: "Initial telemetry hooks and pipelines verified. On track for targeted delivery.",
          managerComment: "Good initial milestone alignment."
        }
      });

      // Q2 check-in (current active progress)
      await prisma.checkIn.create({
        data: {
          goalId: goal.id,
          period: CheckInPeriod.Q2,
          actualValue: isSharedCascade ? 99.98 : (gDef.targetValue * (q2Score / 100)),
          actualDate: new Date("2026-09-15T14:30:00Z"),
          progressScore: q2Score,
          status: GoalStatus.ON_TRACK,
          employeeComment: "System architecture optimized, metrics verified under high stress conditions.",
          managerComment: "Valid performance. Approved for phase close."
        }
      });

      await prisma.goal.update({
        where: { id: goal.id },
        data: { currentProgress: q2Score, status: GoalStatus.ON_TRACK }
      });
    }

    // ---------------- Q3 PLANNING (Draft/Submitted/Under Review) ----------------
    let statusQ3: GoalSheetStatus = GoalSheetStatus.DRAFT;
    let submittedAt = null;

    if (user.email === "sophie.dubois@test.com") {
      statusQ3 = GoalSheetStatus.SUBMITTED;
      submittedAt = new Date("2026-05-10T12:00:00Z");
    } else if (user.email === "samira.begum@test.com") {
      statusQ3 = GoalSheetStatus.UNDER_REVIEW;
      submittedAt = new Date("2026-05-12T14:30:00Z");
    }

    const sheetQ3 = await prisma.goalSheet.create({
      data: { userId: user.id, cycleId: cycle.id, quarter: CheckInPeriod.Q3, status: statusQ3, submittedAt }
    });

    for (let i = 0; i < goalsDef.Q3.length; i++) {
      const gDef = goalsDef.Q3[i];
      const weight = i === 0 ? 50 : 50;

      await prisma.goal.create({
        data: {
          sheetId: sheetQ3.id,
          ownerId: user.id,
          departmentId: dept.id,
          title: gDef.title,
          description: gDef.description,
          thrustArea: gDef.thrustArea,
          uomType: gDef.uomType,
          targetValue: gDef.targetValue,
          weightage: weight,
          status: GoalStatus.NOT_STARTED,
          goalType: GoalType.INDIVIDUAL
        }
      });
    }
  }

  // 8. Seed Cron Audit Logs
  console.log("Seeding chronologically consistent Audit Logs...");
  await prisma.auditLog.create({
    data: {
      actorId: admin.id,
      action: "CREATE_CYCLE",
      entityType: "GoalCycle",
      entityId: cycle.id,
      newValues: { name: "FY2026 Goal Cycle", startDate: "2026-04-01" },
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

  console.log("Database seeded successfully with premium enterprise dataset.");
}

main()
  .catch((e) => {
    console.error("Encountered seeding error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
