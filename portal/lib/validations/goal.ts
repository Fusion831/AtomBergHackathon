import { z } from "zod";
import { UomType, MetricDirection } from "@prisma/client";

export const GoalSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(5, "Title must be at least 5 characters"),
  description: z.string().optional(),
  thrustArea: z.string().min(2, "Thrust area is required"),
  uomType: z.nativeEnum(UomType),
  metricDirection: z.nativeEnum(MetricDirection).optional().default("HIGHER_IS_BETTER"),
  targetValue: z.coerce.number().optional().nullable(),
  targetDate: z.coerce.date().optional().nullable(),
  weightage: z.coerce.number()
    .min(10, "Minimum weightage is 10%")
    .max(100, "Maximum weightage is 100%"),
});

export type GoalInput = z.infer<typeof GoalSchema>;
