export type ReviewGrade = 0 | 1 | 2 | 3 | 4 | 5;

export type ReviewScheduleState = {
  ease: number;
  intervalDays: number;
  repetitions: number;
  lapses: number;
};

export type NextReviewSchedule = ReviewScheduleState & {
  dueAt: string;
  difficulty: number;
  stability: number;
};

const MIN_EASE = 1.3;

const addDays = (date: Date, days: number): Date => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

const clamp = (value: number, min: number, max: number): number => {
  if (value < min) return min;
  if (value > max) return max;
  return value;
};

export const nextSm2Schedule = (
  state: ReviewScheduleState,
  grade: ReviewGrade,
  now: Date = new Date(),
): NextReviewSchedule => {
  let ease = Math.max(state.ease || 2.5, MIN_EASE);
  let repetitions = state.repetitions || 0;
  let intervalDays = Math.max(0, state.intervalDays || 0);
  let lapses = state.lapses || 0;

  if (grade < 3) {
    repetitions = 0;
    lapses += 1;
    intervalDays = 1;
    ease = Math.max(MIN_EASE, ease - 0.2);
  } else {
    repetitions += 1;

    if (repetitions === 1) {
      intervalDays = 1;
    } else if (repetitions === 2) {
      intervalDays = 6;
    } else {
      intervalDays = Math.max(1, Math.round(intervalDays * ease));
    }

    const qualityDelta = 5 - grade;
    ease = Math.max(
      MIN_EASE,
      ease + (0.1 - qualityDelta * (0.08 + qualityDelta * 0.02)),
    );
  }

  const dueAt = addDays(now, intervalDays).toISOString();
  const difficulty = clamp((5 - grade) / 5, 0, 1);
  const stability = Math.max(0.1, intervalDays);

  return {
    ease: Number(ease.toFixed(2)),
    intervalDays,
    repetitions,
    lapses,
    dueAt,
    difficulty: Number(difficulty.toFixed(2)),
    stability: Number(stability.toFixed(2)),
  };
};
