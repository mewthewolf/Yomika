import { Platform } from "react-native";

import type { SupabaseClient } from "@supabase/supabase-js";

import { trackStudyEvent } from "../analytics/studyEvents";
import { nextSm2Schedule, type ReviewGrade, type ReviewScheduleState } from "./sm2";

export type ReviewItemStateRow = {
  user_id: string;
  item_type: string;
  item_id: string;
  skill_type: string;
  due_at: string;
  stability: number;
  difficulty: number;
  interval_days: number;
  ease: number;
  repetitions: number;
  lapses: number;
  created_at: string;
  updated_at: string;
};

type RawReviewItemStateRow = Omit<ReviewItemStateRow, "stability" | "difficulty" | "ease" | "interval_days" | "repetitions" | "lapses"> & {
  stability: string | number;
  difficulty: string | number;
  interval_days: string | number;
  ease: string | number;
  repetitions: string | number;
  lapses: string | number;
};

const DEMO_ITEM_ID = "00000000-0000-0000-0000-000000000001";
const QUEUE_EVENT_ID = "00000000-0000-0000-0000-000000000002";

const toNumber = (value: string | number, fallback = 0): number => {
  const parsed = Number(value);
  if (Number.isNaN(parsed)) {
    return fallback;
  }

  return parsed;
};

const normalizeReviewItem = (item: RawReviewItemStateRow): ReviewItemStateRow => ({
  ...item,
  stability: toNumber(item.stability, 0),
  difficulty: toNumber(item.difficulty, 0),
  interval_days: Math.max(0, Math.trunc(toNumber(item.interval_days, 0))),
  ease: toNumber(item.ease, 2.5),
  repetitions: Math.max(0, Math.trunc(toNumber(item.repetitions, 0))),
  lapses: Math.max(0, Math.trunc(toNumber(item.lapses, 0))),
});

const toReviewScheduleState = (item: ReviewItemStateRow): ReviewScheduleState => ({
  ease: item.ease,
  intervalDays: item.interval_days,
  repetitions: item.repetitions,
  lapses: item.lapses,
});

export const ensureReviewSeed = async (
  client: SupabaseClient,
  userId: string,
): Promise<void> => {
  const dueAt = new Date(Date.now() - 60_000).toISOString();

  const { error } = await client.from("user_item_state").upsert(
    {
      user_id: userId,
      item_type: "exercise",
      item_id: DEMO_ITEM_ID,
      skill_type: "recognition",
      due_at: dueAt,
      stability: 0.1,
      difficulty: 0,
      interval_days: 0,
      ease: 2.5,
      repetitions: 0,
      lapses: 0,
    },
    {
      onConflict: "user_id,item_type,item_id,skill_type",
      ignoreDuplicates: true,
    },
  );

  if (error) {
    throw error;
  }
};

export const loadDueReviewItems = async (
  client: SupabaseClient,
  userId: string,
): Promise<ReviewItemStateRow[]> => {
  const now = new Date().toISOString();

  const query = async () =>
    client
      .from("user_item_state")
      .select(
        "user_id,item_type,item_id,skill_type,due_at,stability,difficulty,interval_days,ease,repetitions,lapses,created_at,updated_at",
      )
      .eq("user_id", userId)
      .lte("due_at", now)
      .order("due_at", { ascending: true })
      .limit(20);

  let { data, error } = await query();

  if (error) {
    throw error;
  }

  if (!data || data.length === 0) {
    await ensureReviewSeed(client, userId);
    const retry = await query();
    data = retry.data;
    error = retry.error;
  }

  if (error) {
    throw error;
  }

  const queue = ((data ?? []) as RawReviewItemStateRow[]).map(normalizeReviewItem);

  await trackStudyEvent(client, {
    userId,
    itemType: "review_queue",
    itemId: QUEUE_EVENT_ID,
    skillType: "queue",
    result: `loaded_${queue.length}`,
    device: Platform.OS,
  });

  return queue;
};

export const submitReviewGrade = async (
  client: SupabaseClient,
  userId: string,
  item: ReviewItemStateRow,
  grade: ReviewGrade,
  latencyMs: number,
): Promise<void> => {
  const next = nextSm2Schedule(toReviewScheduleState(item), grade);

  const { error: updateError } = await client
    .from("user_item_state")
    .update({
      due_at: next.dueAt,
      stability: next.stability,
      difficulty: next.difficulty,
      interval_days: next.intervalDays,
      ease: next.ease,
      repetitions: next.repetitions,
      lapses: next.lapses,
    })
    .eq("user_id", userId)
    .eq("item_type", item.item_type)
    .eq("item_id", item.item_id)
    .eq("skill_type", item.skill_type);

  if (updateError) {
    throw updateError;
  }

  await trackStudyEvent(client, {
    userId,
    itemType: item.item_type,
    itemId: item.item_id,
    skillType: item.skill_type,
    result: `grade_${grade}`,
    latencyMs,
    device: Platform.OS,
  });
};
