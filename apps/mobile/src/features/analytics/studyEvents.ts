import type { SupabaseClient } from "@supabase/supabase-js";

type StudyEventInput = {
  userId: string;
  itemType: string;
  itemId: string;
  skillType: string;
  result: string;
  latencyMs?: number;
  device?: string;
};

export const trackStudyEvent = async (
  client: SupabaseClient,
  input: StudyEventInput,
): Promise<void> => {
  const { error } = await client.from("study_events").insert({
    user_id: input.userId,
    occurred_at: new Date().toISOString(),
    item_type: input.itemType,
    item_id: input.itemId,
    skill_type: input.skillType,
    result: input.result,
    latency_ms: input.latencyMs,
    device: input.device,
  });

  if (error) {
    throw error;
  }
};
