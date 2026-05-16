import { UomType, GoalStatus, MetricDirection } from "@prisma/client";

export function calculateProgressScore(
  uomType: UomType,
  targetValue: number | null,
  actualValue: number | null,
  targetDate: Date | null,
  actualDate: Date | null,
  metricDirection: MetricDirection = "HIGHER_IS_BETTER"
): number {
  if (actualValue === null && actualDate === null) return 0;

  switch (uomType) {
    case "NUMERIC":
    case "PERCENTAGE":
      if (!targetValue || actualValue === null) return 0;
      
      let score = 0;
      if (metricDirection === "LOWER_IS_BETTER") {
        if (actualValue <= 0) return 100; // Perfect score if actual is 0 or less (e.g., 0 errors)
        score = (targetValue / actualValue) * 100;
      } else {
        score = (actualValue / targetValue) * 100;
      }
      
      return Math.min(Math.max(score, 0), 100); // Cap between 0 and 100

    case "ZERO_BASED":
      if (actualValue === null) return 0;
      return actualValue === 0 ? 100 : 0;

    case "TIMELINE":
      if (!targetDate || !actualDate) return 0;
      // Simple logic: if completed before or on target date, 100%. If after, maybe partial or 0%.
      // For enterprise MVP, let's do: 100% if on time, 0% if late or not done.
      const isComplete = actualDate.getTime() <= targetDate.getTime();
      return isComplete ? 100 : 0;

    default:
      return 0;
  }
}

export function determineStatus(score: number): GoalStatus {
  if (score >= 100) return "COMPLETED";
  if (score >= 50) return "ON_TRACK";
  return "NOT_STARTED";
}
