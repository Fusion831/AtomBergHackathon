import { CheckInPeriod } from "@prisma/client";

/**
 * BRD Quarter Lifecycle Engine
 *
 * Automatically resolves the active EXECUTION quarter from the calendar date,
 * matching the official BRD scheduling model:
 *
 *   May–Jun  → Goal Setting Season  (no active check-in)
 *   Jul–Sep  → Q1 Execution Active
 *   Oct–Dec  → Q2 Execution Active
 *   Jan–Feb  → Q3 Execution Active
 *   Mar–Apr  → Q4_ANNUAL Finalization Active
 *
 * CRITICAL DISTINCTION:
 *   - Execution quarters = automatic (driven by this engine)
 *   - Planning quarter   = manual (Admin toggles in DB)
 */

export type QuarterState = "HISTORICAL" | "ACTIVE_EXECUTION" | "PLANNING_OPEN" | "PLANNING_LOCKED" | "GOAL_SETTING";

export interface LifecycleCycle {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  // Derived automatic execution quarter
  activeQuarter: CheckInPeriod | null;
  // Admin-controlled planning quarter
  planningQuarter: CheckInPeriod | null;
  // The raw DB value (what admin has manually set)
  dbActiveQuarter: CheckInPeriod | null;
}

/**
 * Resolves the active execution quarter from a given date using BRD rules.
 * Returns null during Goal Setting season (May–June).
 */
export function resolveActiveExecutionQuarter(date?: Date): CheckInPeriod | null {
  const d = date ?? new Date();
  const month = d.getMonth(); // 0 = Jan, 11 = Dec

  // May (4) & June (5) → Goal Setting Season
  if (month === 4 || month === 5) return null;
  // July (6) – September (8) → Q1 Active
  if (month >= 6 && month <= 8) return "Q1";
  // October (9) – December (11) → Q2 Active
  if (month >= 9 && month <= 11) return "Q2";
  // January (0) – February (1) → Q3 Active
  if (month === 0 || month === 1) return "Q3";
  // March (2) – April (3) → Q4/Annual
  return "Q4_ANNUAL";
}

/**
 * Returns a human-readable label for a quarter.
 */
export function getQuarterLabel(q: CheckInPeriod | null): string {
  if (!q) return "Goal Setting";
  const map: Record<CheckInPeriod, string> = {
    Q1: "Q1",
    Q2: "Q2",
    Q3: "Q3",
    Q4_ANNUAL: "Q4 / Annual",
  };
  return map[q] ?? q;
}

/**
 * Returns the quarter that precedes the active execution quarter (used for "historical" tab).
 * Q1 execution → Q4_ANNUAL historical, etc.
 */
export function resolveHistoricalQuarter(activeQuarter: CheckInPeriod | null): CheckInPeriod {
  if (!activeQuarter) return "Q4_ANNUAL";
  const prev: Record<CheckInPeriod, CheckInPeriod> = {
    Q1: "Q4_ANNUAL",
    Q2: "Q1",
    Q3: "Q2",
    Q4_ANNUAL: "Q3",
  };
  return prev[activeQuarter];
}

/**
 * Wraps a raw Prisma GoalCycle record with lifecycle-aware derived fields.
 *
 * Strategy:
 *   - If the DB has an `activeQuarter` manually set by admin → respect it (admin override)
 *   - Otherwise → derive automatically from calendar date
 *   - planningQuarter is always from DB (manual admin control only)
 */
export function getLifecycleAwareCycle(rawCycle: any | null): LifecycleCycle | null {
  if (!rawCycle) return null;

  const calendarDerived = resolveActiveExecutionQuarter();
  // Admin override: if admin has explicitly set activeQuarter in DB, honour it;
  // otherwise fall back to calendar-derived value.
  const activeQuarter: CheckInPeriod | null = rawCycle.activeQuarter ?? calendarDerived;

  return {
    id: rawCycle.id,
    name: rawCycle.name,
    startDate: rawCycle.startDate,
    endDate: rawCycle.endDate,
    isActive: rawCycle.isActive,
    activeQuarter,
    planningQuarter: rawCycle.planningQuarter ?? null,
    dbActiveQuarter: rawCycle.activeQuarter ?? null,
  };
}

/**
 * Returns the lifecycle state for a given quarter relative to the active cycle.
 */
export function getQuarterState(
  quarter: CheckInPeriod,
  cycle: LifecycleCycle | null
): QuarterState {
  if (!cycle) return "PLANNING_LOCKED";
  if (cycle.activeQuarter === quarter) return "ACTIVE_EXECUTION";
  if (cycle.planningQuarter === quarter) return "PLANNING_OPEN";
  // A quarter before the active one is historical
  const order: CheckInPeriod[] = ["Q1", "Q2", "Q3", "Q4_ANNUAL"];
  const activeIdx = cycle.activeQuarter ? order.indexOf(cycle.activeQuarter) : -1;
  const thisIdx = order.indexOf(quarter);
  if (activeIdx >= 0 && thisIdx < activeIdx) return "HISTORICAL";
  return "PLANNING_LOCKED";
}
