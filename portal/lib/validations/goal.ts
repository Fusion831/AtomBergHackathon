import { z } from "zod";

// Define enums natively in Zod to prevent Next.js client-side Prisma serialization crashes
export const GoalSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(5, "Title must be at least 5 characters"),
  description: z.string().optional(),
  thrustArea: z.string().min(2, "Thrust area is required"),
  uomType: z.enum(["NUMERIC", "PERCENTAGE", "TIMELINE", "ZERO_BASED"]),
  metricDirection: z.enum(["HIGHER_IS_BETTER", "LOWER_IS_BETTER"]).optional().default("HIGHER_IS_BETTER"),
  targetValue: z.coerce.number().optional().nullable(),
  targetDate: z.coerce.date().optional().nullable(),
  weightage: z.coerce.number()
    .min(10, "Minimum weightage is 10%")
    .max(100, "Maximum weightage is 100%"),
});

export type GoalInput = z.infer<typeof GoalSchema>;
