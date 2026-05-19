# AtomQuest - Enterprise Goal & Performance Management Portal

AtomQuest is a high-fidelity, enterprise-grade portal built for organizations to manage quarterly goals, performance tracking, and organizational alignment. Designed primarily for non-technical users, it simplifies structured goal-setting cycles and quarterly performance reviews while ensuring strict data safety, auditing, and cost-efficient cloud hosting.

---

## Why AtomQuest Matters

In many corporate goal-tracking systems, team metrics are overwritten or lost as soon as a new quarter begins, creating a historical blind spot. HR teams end up stitching together fragmented spreadsheets, and employees lose context on their year-over-year growth.

AtomQuest solves this by keeping every quarter historically isolated, fully auditable, and easily retrievable. At any moment, employees and managers can look back at past quarters, track active execution metrics in real time, and securely plan for the upcoming quarter all on a single unified screen.

---

## Cost Optimization, Serverless Architecture, and Caching

AtomQuest is built on a serverless cloud architecture designed to scale down to exactly $0 in hosting costs during periods of inactivity, while incorporating smart caching boundaries to minimize server execution cycles and database costs:

### 1. Serverless Execution & Scale-to-Zero
*   **Vercel Serverless Compute**: The application's server actions and business workflows only run when a user interacts with the platform. Once a goal is saved or a check-in is logged, the micro-container shuts down instantly, eliminating idle server expenses.
*   **Neon Serverless PostgreSQL**: Database compute capacity scales down to zero when the portal is idle, eliminating expensive hourly hosting bills.

### 2. Multi-Tier Caching & Read Minimization
To protect the database from redundant read operations, the architecture implements a multi-tier caching model:
*   **Next.js Request Memoization & React cache()**: Queries fetching locked, immutable goal sheets and historical quarter metrics are memoized at the server boundary. Multiple UI components requesting the same historical sheet within a single request cycle share a single memoized result, reducing duplicate queries.
*   **Client-Side Local State Caching**: Once goal configurations are validated and loaded into the UI, they are cached in the client-side state. Redundant Server Action calls are avoided for read-only locked sheets, preventing unnecessary server function invocations.
*   **Prisma Connection Pooling & Neon Cache**: PostgreSQL connections are pooled efficiently, and recurrent read queries are optimized through database indexing, keeping execution overhead low.

This modern setup gives you a production-ready, enterprise-grade architecture that is cheap to run, simple to deploy, and highly responsive.

---

## Core Features

*   **Quarterly Goal Planning**: Standardized goal sheets with weightage validations (total must equal exactly 100%, minimum 10% per goal, and a maximum of 8 goals).
*   **Structured Approvals**: A formal review workflow where goals are locked immediately upon manager approval to prevent unauthorized modifications.
*   **Flexible Performance Check-ins**: Periodic progress updates supporting four metric styles: Numeric progress, Percentages, Timelines, and perfect Zero-Based metrics (like safety incidents).
*   **Shared Goal Cascade**: Managers can assign master departmental goals to multiple team members simultaneously, with child sheets automatically keeping progress metrics in sync.
*   **Governance & Unlock Exceptions**: A safe system allowing locked sheets to return to draft state when employees request changes with clear business justifications.
*   **Permanent Audit Ledger**: Full history database logging of who changed what, and when with JSON snapshots of modified fields.

---

## System Workflows and User Journeys

The platform naturally guides three core corporate roles through their quarterly goals journey:

```
    [ Employee ]                     [ Manager ]                    [ Admin / HR ]
 ──────────────────               ─────────────────               ──────────────────
 1. Draft Q3 Goals                1. Inline Adjust Target         1. Open Q3 Planning Window
 2. Fix Weightage Errors          2. Approve & Lock Sheet         2. Manage Org Hierarchies
 3. Submit for Review             3. Cascade Shared KPIs          3. Approve Unlock Requests
 4. Perform Q2 Check-ins          4. Comment on Progress          4. Inspect Audit Logs
```

### 1. The Employee Journey (Alex Rivera)
*   **Draft**: Create quarterly goals aligned with department priorities.
*   **Validation Check**: The system catches errors (like missing metrics or unbalanced weightages) before submission.
*   **Execute**: Input quarterly achievements and comment on progress once sheets are locked.
*   **Change Request**: Ask managers to temporarily unlock a sheet if business goals shift.

### 2. The Manager Journey (Engineering Manager)
*   **Review**: Open team goal sheets and adjust targets or weightages inline.
*   **Approve**: Lock approved goal sheets to secure team targets.
*   **Guide**: Add comments to check-ins and push departmental goals to multiple team members' sheets.

### 3. The Admin/HR Journey (System Admin)
*   **Orchestrate**: Open new planning quarters, manage department structures, and view completion heatmaps.
*   **Supervise**: Inspect system audit logs and override locked sheets for employees when exceptions occur.

---

## The Quarter Lifecycle System

AtomQuest resolves quarterly scheduling in two parallel ways:

1.  **Automatic Execution (Driven by Date)**: The system automatically detects the current date and maps it to the active execution quarter (e.g., July-Sept represents Q1; Oct-Dec represents Q2). Employees perform active check-ins within these windows.
2.  **Manual Planning (Controlled by HR)**: Admins manually toggle which quarter is open for future goal creation, letting employees draft next quarter's goals without interrupting their active check-in window.

A dedicated Goal Setting Season (May and June) automatically closes active check-ins to allow full corporate alignment before the new fiscal cycle begins.

---

## System Architecture

AtomQuest is built to keep your interface fast, your database secure, and your audit records unalterable:

*   **Frontend**: Built with Next.js 15 (React 19), Tailwind CSS, and shadcn/ui. Uses static layouts and dynamic data streams for rapid page changes and smooth, clean dark-mode visuals.
*   **Backend & Domain Layer**: Business logic is written in secure Server Actions, acting as locked RPC endpoints. Payloads are validated using Zod schemas at the server boundary.
*   **Caching & Optimization**: Leverages React server-side memoization and local client states for immutable, locked goals, bypassing database hits.
*   **Persistence & Relations**: PostgreSQL managed through Prisma ORM. Employs self-referencing tables to build nested department structures and reporting management trees.
*   **Audit Engine**: A dedicated audit service automatically takes snapshots of state changes, packaging old and new values in relational JSONB fields.
*   **Security (Credential Hashing)**: Password protection is handled strictly on the server using BCrypt with 10 salt rounds to verify credentials safely through NextAuth.

---

## Visual System Diagrams

### A. Primary Enterprise Data Flow and Caching Layer
This diagram shows how users securely access the application, how Server Actions validate logic, and how local state and server-side memoization cache locked goals to bypass database hits.

```mermaid
flowchart TD
    %% Define User Personas
    subgraph Users [1. End Users & Roles]
        E[Employee \n Alex Rivera]
        M[Manager L1 \n Eng Manager]
        A[Admin / HR \n System Admin]
    end

    %% Define Vercel Edge Layer
    subgraph VercelEdge [2. Delivery & Presentation Layer - Vercel CDN]
        UI[Next.js Client Components \n Tailwind CSS + shadcn/ui]
        ClientCache[Client-Side Local State \n Cache Locked Goals - Skip RPC]
        Charts[Recharts Analytics Dashboard]
    end

    %% Define Caching & Serverless Compute Layer
    subgraph VercelCompute [3. Runtimes & Business Engines - Vercel Serverless]
        SA[Next.js Server Actions \n Secure RPC Endpoints]
        Z[Zod Payload Validation]
        ServerMemo[React cache / Memoization \n Cache Read-Only Locked Sheets]
        
        subgraph Logic [AtomQuest Core Engines]
            LE[BRD Quarter Lifecycle Engine \n lib/quarterLifecycle.ts]
            SM[Goal Sheet State Machine \n Validation: 100% total, max 8]
            PE[Progress Calculation & Cascading \n Numeric, Timeline, Zero-Based]
        end
    end

    %% Define Data Layer
    subgraph Database [4. Secure Persistence Layer]
        ORM[Prisma ORM \n Connection Pooling]
        DB[(Neon Serverless PostgreSQL)]
        Audit[System Audit Trail \n JSONB Snapshot Ledger]
    end

    %% Connections
    Users -->|HTTPS / UI Interactions| VercelEdge
    UI <--> Charts
    UI <--> ClientCache
    
    VercelEdge -->|Invokes Serverless Functions| SA
    SA -->|1. Validates Data| Z
    Z -->|2. Check Cache| ServerMemo
    ServerMemo -->|Cache Hit| Logic
    
    Logic -->|3. Generates Queries| ORM
    ORM <-->|4. ACID Transactions| DB
    ORM -->|5. Write Snapshots| Audit
    
    %% Styling for a professional, corporate look
    classDef edge fill:#fafafa,stroke:#e5e5e5,stroke-width:2px;
    classDef compute fill:#000000,stroke:#333333,stroke-width:2px,color:#ffffff;
    classDef database fill:#00e599,stroke:#00b377,stroke-width:2px,color:#000000;
    classDef users fill:#ffffff,stroke:#888888,stroke-width:1px,stroke-dasharray: 5 5;

    class VercelEdge edge;
    class VercelCompute compute;
    class Database database;
    class Users users;
```

### B. Goal Sheet State Machine
This diagram maps out how goal sheets progress from a draft state into final locked sheets, including review cycles and manager unlock requests.

```mermaid
stateDiagram-v2
    [*] --> DRAFT : Employee Initialized
    
    state DRAFT {
        [*] --> EditGoals
        EditGoals --> EnforceLimits : Save / Modify Goal
        EnforceLimits --> EditGoals : Valid (Max 8 goals, Min 10% weight)
    }

    DRAFT --> SUBMITTED : Enforce Weightage Sum = 100%
    
    SUBMITTED --> UNDER_REVIEW : Manager Opens Sheet
    
    UNDER_REVIEW --> DRAFT : Rework Requested
    UNDER_REVIEW --> APPROVED : Manager Confirms Weights
    
    APPROVED --> LOCKED : Auto-Promotion
    
    LOCKED --> UNLOCK_REQUESTED : Employee submits business justification
    
    UNLOCK_REQUESTED --> DRAFT : Manager/Admin Approved \n Resets lock flags, logs audit snapshot
    UNLOCK_REQUESTED --> LOCKED : Exception Rejected
```

### C. Quarter Lifecycle Engine Flow
This diagram details the logic used by `lib/quarterLifecycle.ts` to coordinate timing execution and planning states.

```mermaid
flowchart TD
    %% Styling
    classDef autoStyle fill:#1e1e2e,stroke:#f5c2e7,stroke-width:2px,color:#cdd6f4;
    classDef manualStyle fill:#1e1e2e,stroke:#89b4fa,stroke-width:2px,color:#cdd6f4;
    classDef engineStyle fill:#11111b,stroke:#a6e3a1,stroke-width:2px,color:#cdd6f4;

    subgraph Input [Quarter Execution & Planning Inputs]
        Date[Current Calendar Date \n local time]
        AdminConfig[Admin Panel Override \n GoalCycle DB Record]
    end

    subgraph Orchestrator [Quarter Lifecycle Engine]
        QLE[resolveActiveExecutionQuarter()]
        LAware[getLifecycleAwareCycle()]
    end
    class Orchestrator engineStyle;

    subgraph Automatic [Automatic Calendar Resolution]
        Setting[May - Jun \n Goal Setting Season \n Execution Active: NULL]
        Q1[Jul - Sep \n Execution Active: Q1]
        Q2[Oct - Dec \n Execution Active: Q2]
        Q3[Jan - Feb \n Execution Active: Q3]
        Q4[Mar - Apr \n Execution Active: Q4_ANNUAL]
    end
    class Automatic autoStyle;

    subgraph Manual [Manual Admin Governance Override]
        Planning[planningQuarter Open \n Employee submits future drafts]
        DbOverride[activeQuarter DB Configuration \n Suspends calendar logic]
    end
    class Manual manualStyle;

    %% Flows
    Date --> QLE
    AdminConfig --> LAware
    
    QLE -->|Derived by Month| Automatic
    LAware -->|Read Active DB Fields| DbOverride
    
    DbOverride -->|Override active?| LAware
    LAware -->|Enforces execution boundary| Planning
```

---

## Technology Stack

| Technology | Purpose | Key Benefits |
| :--- | :--- | :--- |
| **Next.js 15 (React 19)** | Application Framework | Unified frontend rendering, serverless server components, and fast layouts |
| **Prisma ORM** | Database Connector | Secure, type-safe queries with database integrity |
| **PostgreSQL** | Relational Storage | Robust data structure for audits and employee reporting hierarchies |
| **Tailwind CSS** | Styles & Layouts | Responsive dark-mode layouts with zero-runtime utility tokens |
| **shadcn/ui** | Design Components | Accessible design elements for a polished user experience |
| **NextAuth.js** | Access Control | Role-based authentication using secure session cookies |
| **Vercel** | Serverless Host | Zero-idle hosting cost, automated builds, and rapid edge asset deliveries |
| **Neon** | Serverless Database | Database instances that pause when idle to eliminate runtime billing |

---

## Beginner-Friendly Setup & Deployment

### 1. Prerequisites
Ensure you have Node.js (v18+) and a local PostgreSQL instance or a free account on Neon.tech.

### 2. Clone and Install
```bash
# Clone the repository
git clone https://github.com/your-username/atomquest-portal.git
cd atomquest-portal

# Install dependencies
npm install
```

### 3. Configure the Environment
Create a `.env` file in the root directory and add your connection string:
```env
DATABASE_URL="postgresql://username:password@localhost:5432/atomquest?schema=public"
NEXTAUTH_SECRET="your-super-secret-random-key"
NEXTAUTH_URL="http://localhost:3000"
```

### 4. Push Schema & Seed Database
```bash
# Sync your database with the Prisma schema
npx prisma db push

# Generate the local client types
npx prisma generate

# Seed the database with high-fidelity corporate test data
npm run seed
```

### 5. Launch the Server
```bash
npm run dev
```
Open http://localhost:3000 in your browser.

---

## High-Fidelity Pre-seeded Test Accounts

Our custom seed script preloads the system with a complete department structure, team goals, and historical quarters. Use these accounts to easily test every workflow:

| Role | Email Account | Seeded Password | Description / Persona |
| :--- | :--- | :--- | :--- |
| **Employee** | `employee@test.com` | `password` | **Alex Rivera**: Individual contributor in Platform Engineering, reporting to the Engineering Manager. Has goals ready for check-in. |
| **Manager** | `manager@test.com` | `password` | **Engineering Manager**: Direct L1 manager for Platform Engineering. Can approve sheets, cascade goals, and leave feedback. |
| **Admin / HR** | `admin@test.com` | `password` | **System Admin**: Controls global settings, approves unlock requests, and inspects organization audit logs. |

---

## Future Improvements
*   **Real-time Notifications**: Trigger automated emails or Microsoft Teams notifications when a goal sheet is submitted or an unlock request is approved.
*   **Microsoft Entra ID (SSO)**: Add Azure AD authentication to sync organizational hierarchies automatically.
*   **Predictive Performance Insights**: Add trend lines to estimate final annual scores based on early quarterly check-in metrics.
