"use client";

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import type { SocialActivity } from "@/lib/types";
import { assessRisk } from "@/lib/risk";
import { createCheckIn, getRiskAssessment } from "@/lib/api";
import { useCheckInStore } from "@/store/checkins";

const schema = z.object({
  sleepHours: z
    .number({ invalid_type_error: "Enter a number" })
    .min(0, "Must be ≥ 0")
    .max(24, "Must be ≤ 24"),
  socialActivity: z.enum(["low", "medium", "high"]),
  screenTimeHours: z
    .number({ invalid_type_error: "Enter a number" })
    .min(0, "Must be ≥ 0")
    .max(24, "Must be ≤ 24"),
  moodRating: z
    .union([z.number().min(1).max(5), z.nan()])
    .optional()
    .transform((v) => (typeof v === "number" && !Number.isNaN(v) ? v : undefined)),
});

type FormValues = z.infer<typeof schema>;

function fieldIds(name: string) {
  return { inputId: name, errorId: `${name}-error`, hintId: `${name}-hint` };
}

export function CheckInForm() {
  const addCheckIn = useCheckInStore((s) => s.addCheckIn);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isValid },
    reset,
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: "onChange",
    defaultValues: {
      sleepHours: 7,
      socialActivity: "medium",
      screenTimeHours: 4,
      moodRating: undefined,
    },
  });

  const values = watch();
  const liveRisk = useMemo(() => {
    return assessRisk({
      sleepHours: values.sleepHours ?? 0,
      socialActivity: (values.socialActivity as SocialActivity) ?? "medium",
      screenTimeHours: values.screenTimeHours ?? 0,
      moodRating: values.moodRating,
    });
  }, [values.sleepHours, values.socialActivity, values.screenTimeHours, values.moodRating]);

  const onSubmit = handleSubmit(async (data) => {
    setSubmitError(null);
    setSubmitting(true);

    try {
      // Optional: ask server for risk assessment (strategy demo). Fallback to local.
      await getRiskAssessment(data).catch(() => null);
      await createCheckIn(data).catch(() => null);

      addCheckIn({
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        sleepHours: data.sleepHours,
        socialActivity: data.socialActivity,
        screenTimeHours: data.screenTimeHours,
        moodRating: data.moodRating,
      });

      reset({
        sleepHours: data.sleepHours,
        socialActivity: data.socialActivity,
        screenTimeHours: data.screenTimeHours,
        moodRating: data.moodRating,
      });
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  });

  const sleep = fieldIds("sleepHours");
  const social = fieldIds("socialActivity");
  const screen = fieldIds("screenTimeHours");
  const mood = fieldIds("moodRating");

  return (
    <form onSubmit={onSubmit} className="space-y-6" noValidate>
      <div className="rounded-xl bg-white/5 p-4 ring-1 ring-white/10">
        <div className="mb-1 text-sm font-semibold text-white">Live estimate</div>
        <div className="text-xs text-slate-300">
          Risk score: <span className="font-semibold text-slate-100">{liveRisk.score}</span>
          {liveRisk.reasons.length > 0 ? (
            <span className="ml-2">• {liveRisk.reasons.join(", ")}</span>
          ) : (
            <span className="ml-2">• No risk factors detected</span>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl bg-white/5 p-4 ring-1 ring-white/10">
          <label htmlFor={sleep.inputId} className="block text-sm font-medium text-white">
            Sleep hours
          </label>
          <p id={sleep.hintId} className="mt-1 text-xs text-slate-300">
            Hours slept in the last 24 hours.
          </p>
          <input
            id={sleep.inputId}
            type="number"
            inputMode="decimal"
            step={0.5}
            min={0}
            max={24}
            aria-describedby={`${sleep.hintId} ${errors.sleepHours ? sleep.errorId : ""}`}
            aria-invalid={!!errors.sleepHours}
            className="mt-2 w-full rounded-lg bg-slate-950/40 px-3 py-2 text-sm text-slate-50 ring-1 ring-white/10 placeholder:text-slate-500 focus:ring-2 focus:ring-blue-400"
            {...register("sleepHours", { valueAsNumber: true })}
          />
          {errors.sleepHours ? (
            <p id={sleep.errorId} className="mt-2 text-xs text-rose-200">
              {errors.sleepHours.message}
            </p>
          ) : null}
        </div>

        <div className="rounded-xl bg-white/5 p-4 ring-1 ring-white/10">
          <label htmlFor={screen.inputId} className="block text-sm font-medium text-white">
            Screen time (hours)
          </label>
          <p id={screen.hintId} className="mt-1 text-xs text-slate-300">
            Total time on phone/computer/TV today.
          </p>
          <input
            id={screen.inputId}
            type="number"
            inputMode="decimal"
            step={0.5}
            min={0}
            max={24}
            aria-describedby={`${screen.hintId} ${errors.screenTimeHours ? screen.errorId : ""}`}
            aria-invalid={!!errors.screenTimeHours}
            className="mt-2 w-full rounded-lg bg-slate-950/40 px-3 py-2 text-sm text-slate-50 ring-1 ring-white/10 placeholder:text-slate-500 focus:ring-2 focus:ring-blue-400"
            {...register("screenTimeHours", { valueAsNumber: true })}
          />
          {errors.screenTimeHours ? (
            <p id={screen.errorId} className="mt-2 text-xs text-rose-200">
              {errors.screenTimeHours.message}
            </p>
          ) : null}
        </div>

        <div className="rounded-xl bg-white/5 p-4 ring-1 ring-white/10">
          <label htmlFor={social.inputId} className="block text-sm font-medium text-white">
            Social activity
          </label>
          <p id={social.hintId} className="mt-1 text-xs text-slate-300">
            Roughly how socially connected you felt today.
          </p>
          <select
            id={social.inputId}
            aria-describedby={social.hintId}
            className="mt-2 w-full rounded-lg bg-slate-950/40 px-3 py-2 text-sm text-slate-50 ring-1 ring-white/10 focus:ring-2 focus:ring-blue-400"
            {...register("socialActivity")}
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>

        <div className="rounded-xl bg-white/5 p-4 ring-1 ring-white/10">
          <label htmlFor={mood.inputId} className="block text-sm font-medium text-white">
            Mood rating <span className="text-slate-400">(optional)</span>
          </label>
          <p id={mood.hintId} className="mt-1 text-xs text-slate-300">
            1 = very low, 5 = very good.
          </p>
          <input
            id={mood.inputId}
            type="number"
            inputMode="numeric"
            step={1}
            min={1}
            max={5}
            placeholder="Leave blank"
            aria-describedby={mood.hintId}
            className="mt-2 w-full rounded-lg bg-slate-950/40 px-3 py-2 text-sm text-slate-50 ring-1 ring-white/10 placeholder:text-slate-500 focus:ring-2 focus:ring-blue-400"
            {...register("moodRating", { valueAsNumber: true })}
          />
        </div>
      </div>

      {submitError ? (
        <div
          className="rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-100 ring-1 ring-rose-400/20"
          role="alert"
        >
          {submitError}
        </div>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-slate-400">
          Your entries are stored locally in this browser.
        </p>
        <button
          type="submit"
          disabled={!isValid || submitting}
          className="inline-flex items-center justify-center rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-400 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? "Saving…" : "Save check-in"}
        </button>
      </div>
    </form>
  );
}
