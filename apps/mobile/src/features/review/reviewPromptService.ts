import type { SupabaseClient } from "@supabase/supabase-js";

import type { ReviewItemStateRow } from "./reviewService";

export type ReviewPrompt = {
  title: string;
  prompt: string;
  answerHint: string;
  templateType: string;
  source: "db" | "fallback";
};

type ExerciseRow = {
  template_id: string;
  content_refs: Record<string, unknown> | null;
  difficulty: number | null;
};

type TemplateRow = {
  template_type: string;
  schema_json: Record<string, unknown> | null;
};

const FALLBACK_PROMPTS: Record<string, Omit<ReviewPrompt, "source">> = {
  exercise: {
    title: "Exercise Review",
    prompt: "Recall the target meaning and usage for this exercise item.",
    answerHint: "Use a confidence grade from 0 to 5 based on recall quality.",
    templateType: "exercise_fallback",
  },
  vocab: {
    title: "Vocabulary Review",
    prompt: "Recall the meaning and reading of this vocabulary item.",
    answerHint: "Mentally produce the reading and one usage context.",
    templateType: "vocab_fallback",
  },
  sentence: {
    title: "Sentence Review",
    prompt: "Read the sentence and recall the core meaning.",
    answerHint: "Focus on comprehension over exact translation wording.",
    templateType: "sentence_fallback",
  },
};

const asRecord = (value: unknown): Record<string, unknown> | null => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
};

const asString = (value: unknown): string | null => {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const fallbackForItemType = (itemType: string): ReviewPrompt => {
  const fallback = FALLBACK_PROMPTS[itemType] ?? {
    title: "Review Item",
    prompt: `Review item type: ${itemType}`,
    answerHint: "Grade how well you recalled the answer.",
    templateType: "generic_fallback",
  };

  return {
    ...fallback,
    source: "fallback",
  };
};

const buildFromExercise = (
  itemType: string,
  exercise: ExerciseRow,
  template: TemplateRow | null,
): ReviewPrompt => {
  const contentRefs = asRecord(exercise.content_refs) ?? {};
  const schema = asRecord(template?.schema_json) ?? {};

  const prompt =
    asString(contentRefs.prompt) ??
    asString(contentRefs.question) ??
    asString(schema.prompt) ??
    fallbackForItemType(itemType).prompt;

  const answerHint =
    asString(contentRefs.answer_hint) ??
    asString(contentRefs.answer) ??
    asString(schema.answer_hint) ??
    `Difficulty: ${exercise.difficulty ?? "n/a"}`;

  const title =
    asString(contentRefs.title) ??
    asString(schema.title) ??
    `${(template?.template_type ?? itemType).replace(/_/g, " ")} review`;

  return {
    title,
    prompt,
    answerHint,
    templateType: template?.template_type ?? "unknown_template",
    source: "db",
  };
};

export const loadReviewPromptForItem = async (
  client: SupabaseClient,
  item: ReviewItemStateRow,
): Promise<ReviewPrompt> => {
  if (item.item_type !== "exercise") {
    return fallbackForItemType(item.item_type);
  }

  const { data: exerciseData, error: exerciseError } = await client
    .from("exercises")
    .select("template_id,content_refs,difficulty")
    .eq("id", item.item_id)
    .maybeSingle();

  if (exerciseError || !exerciseData) {
    return fallbackForItemType(item.item_type);
  }

  const exercise = exerciseData as unknown as ExerciseRow;

  const { data: templateData, error: templateError } = await client
    .from("exercise_templates")
    .select("template_type,schema_json")
    .eq("id", exercise.template_id)
    .maybeSingle();

  if (templateError) {
    return fallbackForItemType(item.item_type);
  }

  const template = (templateData as unknown as TemplateRow | null) ?? null;

  return buildFromExercise(item.item_type, exercise, template);
};
