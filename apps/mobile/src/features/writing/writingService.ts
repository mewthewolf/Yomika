import { Platform } from "react-native";

import type { SupabaseClient } from "@supabase/supabase-js";

import { trackStudyEvent } from "../analytics/studyEvents";

export type WritingPrompt = {
  id: string;
  glyph: string;
  reading: string;
  meaning: string;
  instruction: string;
};

export type TracePoint = {
  x: number;
  y: number;
  t: number;
};

export type TraceMetrics = {
  durationMs: number;
  pointCount: number;
  pathLength: number;
  coverageRatio: number;
  speed: number;
  traceScore: number;
};

export type WritingMode = "guided" | "freehand";

export const WRITING_PROMPTS: WritingPrompt[] = [
  {
    id: "00000000-0000-0000-0000-000000000101",
    glyph: "あ",
    reading: "a",
    meaning: "hiragana a",
    instruction: "Trace the character with smooth continuous strokes.",
  },
  {
    id: "00000000-0000-0000-0000-000000000102",
    glyph: "日",
    reading: "にち / ひ",
    meaning: "day / sun",
    instruction: "Trace each box edge clearly and keep corners controlled.",
  },
  {
    id: "00000000-0000-0000-0000-000000000103",
    glyph: "学",
    reading: "がく",
    meaning: "study",
    instruction: "Keep top, middle, and lower components balanced in height.",
  },
];

const clamp = (value: number, min: number, max: number): number => {
  if (value < min) return min;
  if (value > max) return max;
  return value;
};

const distance = (a: TracePoint, b: TracePoint): number => {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
};

export const calculateTraceMetrics = (
  points: TracePoint[],
  durationMs: number,
  canvasWidth: number,
  canvasHeight: number,
): TraceMetrics => {
  if (points.length < 2 || canvasWidth <= 0 || canvasHeight <= 0) {
    return {
      durationMs,
      pointCount: points.length,
      pathLength: 0,
      coverageRatio: 0,
      speed: 0,
      traceScore: 0,
    };
  }

  let pathLength = 0;
  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;

  for (let i = 1; i < points.length; i += 1) {
    pathLength += distance(points[i - 1], points[i]);
  }

  for (const point of points) {
    minX = Math.min(minX, point.x);
    minY = Math.min(minY, point.y);
    maxX = Math.max(maxX, point.x);
    maxY = Math.max(maxY, point.y);
  }

  const bboxArea = Math.max(0, maxX - minX) * Math.max(0, maxY - minY);
  const canvasArea = canvasWidth * canvasHeight;
  const coverageRatio = clamp(canvasArea > 0 ? bboxArea / canvasArea : 0, 0, 1);
  const speed = pathLength / Math.max(durationMs, 1);

  const coverageScore = clamp(coverageRatio / 0.2, 0, 1);
  const lengthScore = clamp(pathLength / Math.max((canvasWidth + canvasHeight) * 0.8, 1), 0, 1);
  const speedScore = clamp(1 - Math.abs(speed - 0.22) / 0.22, 0, 1);

  const traceScore = Math.round(
    (coverageScore * 0.45 + lengthScore * 0.35 + speedScore * 0.2) * 100,
  );

  return {
    durationMs,
    pointCount: points.length,
    pathLength: Number(pathLength.toFixed(2)),
    coverageRatio: Number(coverageRatio.toFixed(3)),
    speed: Number(speed.toFixed(3)),
    traceScore,
  };
};

export const persistTraceMetrics = async (
  client: SupabaseClient,
  userId: string,
  prompt: WritingPrompt,
  metrics: TraceMetrics,
  mode: WritingMode,
  recognitionTag?: string,
): Promise<void> => {
  const recognitionPart = recognitionTag ? `_ink_${recognitionTag}` : "";

  await trackStudyEvent(client, {
    userId,
    itemType: "writing_trace",
    itemId: prompt.id,
    skillType: "writing",
    result: `${mode}_score_${metrics.traceScore}_points_${metrics.pointCount}${recognitionPart}`,
    latencyMs: metrics.durationMs,
    device: Platform.OS,
  });
};

export const getTraceFeedback = (traceScore: number): string => {
  if (traceScore >= 80) {
    return "Strong shape control. Keep stroke consistency this level.";
  }

  if (traceScore >= 60) {
    return "Solid attempt. Increase coverage and maintain smoother pacing.";
  }

  if (traceScore >= 40) {
    return "Partial form captured. Slow down and use more deliberate strokes.";
  }

  return "Low trace confidence. Focus on structure first, then speed.";
};
