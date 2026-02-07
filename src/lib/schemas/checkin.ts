import { z } from "zod";

export const checkInSchema = z.object({
  sleepHours: z.number().min(0).max(24),
  socialActivity: z.enum(["low", "medium", "high"]),
  screenTimeHours: z.number().min(0).max(24),
  moodRating: z.number().min(1).max(5).optional(),

  // Optional extras for a real daily-log API (UI currently doesn't send these)
  logDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "logDate must be YYYY-MM-DD")
    .optional(),
  timezone: z.string().min(1).optional(),
  notes: z.string().max(4000).optional(),
});

export type CheckInInput = z.infer<typeof checkInSchema>;
