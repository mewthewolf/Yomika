import { nextSm2Schedule, type ReviewGrade, type ReviewScheduleState } from "./sm2";

type SimulationStep = {
  grade: ReviewGrade;
  expected: {
    intervalDays: number;
    repetitions: number;
    lapses: number;
    ease: number;
  };
};

export type Sm2SimulationResult = {
  passed: boolean;
  details: string;
};

const STEPS: SimulationStep[] = [
  { grade: 5, expected: { intervalDays: 1, repetitions: 1, lapses: 0, ease: 2.6 } },
  { grade: 5, expected: { intervalDays: 6, repetitions: 2, lapses: 0, ease: 2.7 } },
  { grade: 4, expected: { intervalDays: 16, repetitions: 3, lapses: 0, ease: 2.7 } },
  { grade: 2, expected: { intervalDays: 1, repetitions: 0, lapses: 1, ease: 2.5 } },
  { grade: 5, expected: { intervalDays: 1, repetitions: 1, lapses: 1, ease: 2.6 } },
];

export const runSm2Simulation = (): Sm2SimulationResult => {
  let state: ReviewScheduleState = {
    ease: 2.5,
    intervalDays: 0,
    repetitions: 0,
    lapses: 0,
  };

  for (let index = 0; index < STEPS.length; index += 1) {
    const step = STEPS[index];
    const next = nextSm2Schedule(state, step.grade, new Date("2026-01-01T00:00:00.000Z"));

    const matches =
      next.intervalDays === step.expected.intervalDays &&
      next.repetitions === step.expected.repetitions &&
      next.lapses === step.expected.lapses &&
      next.ease === step.expected.ease;

    if (!matches) {
      return {
        passed: false,
        details:
          `Step ${index + 1} mismatch: expected ` +
          `${JSON.stringify(step.expected)} got ` +
          `${JSON.stringify({
            intervalDays: next.intervalDays,
            repetitions: next.repetitions,
            lapses: next.lapses,
            ease: next.ease,
          })}`,
      };
    }

    state = {
      ease: next.ease,
      intervalDays: next.intervalDays,
      repetitions: next.repetitions,
      lapses: next.lapses,
    };
  }

  return {
    passed: true,
    details: "Deterministic SM-2 progression checks passed for baseline sequence.",
  };
};
