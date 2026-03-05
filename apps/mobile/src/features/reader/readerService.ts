import { Platform } from "react-native";

import type { SupabaseClient } from "@supabase/supabase-js";

import { trackStudyEvent } from "../analytics/studyEvents";

export type FuriganaMode = "full" | "partial" | "off";

export type SentenceToken = {
  token_index: number;
  surface: string;
  reading: string | null;
};

export type ReaderSentence = {
  id: string;
  text_ja: string;
  reading_kana: string | null;
  translation_en: string | null;
  tokens: SentenceToken[];
};

type SentenceRow = Omit<ReaderSentence, "tokens">;

const FALLBACK_SENTENCES: ReaderSentence[] = [
  {
    id: "00000000-0000-0000-0000-000000000010",
    text_ja: "日本語を毎日少しずつ勉強します。",
    reading_kana: "にほんごをまいにちすこしずつべんきょうします。",
    translation_en: "I study Japanese a little every day.",
    tokens: [
      { token_index: 0, surface: "日本語", reading: "にほんご" },
      { token_index: 1, surface: "を", reading: null },
      { token_index: 2, surface: "毎日", reading: "まいにち" },
      { token_index: 3, surface: "少しずつ", reading: "すこしずつ" },
      { token_index: 4, surface: "勉強", reading: "べんきょう" },
      { token_index: 5, surface: "します", reading: null },
      { token_index: 6, surface: "。", reading: null },
    ],
  },
  {
    id: "00000000-0000-0000-0000-000000000011",
    text_ja: "今日は図書館で漢字を復習した。",
    reading_kana: "きょうはとしょかんでかんじをふくしゅうした。",
    translation_en: "Today I reviewed kanji at the library.",
    tokens: [
      { token_index: 0, surface: "今日", reading: "きょう" },
      { token_index: 1, surface: "は", reading: null },
      { token_index: 2, surface: "図書館", reading: "としょかん" },
      { token_index: 3, surface: "で", reading: null },
      { token_index: 4, surface: "漢字", reading: "かんじ" },
      { token_index: 5, surface: "を", reading: null },
      { token_index: 6, surface: "復習", reading: "ふくしゅう" },
      { token_index: 7, surface: "した", reading: null },
      { token_index: 8, surface: "。", reading: null },
    ],
  },
];

const READER_SETTINGS_EVENT_ID = "00000000-0000-0000-0000-000000000003";

const groupTokensBySentence = (tokens: SentenceToken[]): Map<string, SentenceToken[]> => {
  const map = new Map<string, SentenceToken[]>();

  for (const token of tokens as unknown as (SentenceToken & { sentence_id: string })[]) {
    const sentenceId = token.sentence_id;
    const group = map.get(sentenceId) ?? [];
    group.push({
      token_index: token.token_index,
      surface: token.surface,
      reading: token.reading,
    });
    map.set(sentenceId, group);
  }

  return map;
};

export const loadReaderSentences = async (
  client: SupabaseClient,
): Promise<ReaderSentence[]> => {
  const { data: sentenceData, error: sentenceError } = await client
    .from("sentences")
    .select("id,text_ja,reading_kana,translation_en")
    .order("created_at", { ascending: true })
    .limit(10);

  if (sentenceError) {
    throw sentenceError;
  }

  const sentenceRows = (sentenceData ?? []) as SentenceRow[];

  if (sentenceRows.length === 0) {
    return FALLBACK_SENTENCES;
  }

  const sentenceIds = sentenceRows.map((sentence) => sentence.id);

  const { data: tokenData, error: tokenError } = await client
    .from("sentence_tokens")
    .select("sentence_id,token_index,surface,reading")
    .in("sentence_id", sentenceIds)
    .order("token_index", { ascending: true });

  if (tokenError) {
    throw tokenError;
  }

  const groupedTokens = groupTokensBySentence((tokenData ?? []) as SentenceToken[]);

  return sentenceRows.map((row) => ({
    ...row,
    tokens: groupedTokens.get(row.id) ?? [],
  }));
};

export const applyFuriganaMode = (
  tokens: SentenceToken[],
  mode: FuriganaMode,
): string => {
  if (tokens.length === 0) {
    return "";
  }

  return tokens
    .map((token, index) => {
      if (!token.reading || mode === "off") {
        return token.surface;
      }

      if (mode === "partial" && index % 2 === 1) {
        return token.surface;
      }

      return `${token.surface}(${token.reading})`;
    })
    .join("");
};

export const persistFuriganaMode = async (
  client: SupabaseClient,
  userId: string,
  mode: FuriganaMode,
): Promise<void> => {
  const { error } = await client.from("user_settings").upsert(
    {
      user_id: userId,
      furigana_mode: mode,
    },
    {
      onConflict: "user_id",
    },
  );

  if (error) {
    throw error;
  }

  await trackStudyEvent(client, {
    userId,
    itemType: "reader_settings",
    itemId: READER_SETTINGS_EVENT_ID,
    skillType: "reading",
    result: `furigana_${mode}`,
    device: Platform.OS,
  });
};

export const loadFuriganaMode = async (
  client: SupabaseClient,
  userId: string,
): Promise<FuriganaMode> => {
  const { data, error } = await client
    .from("user_settings")
    .select("furigana_mode")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  const mode = data?.furigana_mode;
  if (mode === "full" || mode === "partial" || mode === "off") {
    return mode;
  }

  return "partial";
};

export const trackReaderOpen = async (
  client: SupabaseClient,
  userId: string,
  sentenceId: string,
): Promise<void> => {
  await trackStudyEvent(client, {
    userId,
    itemType: "sentence",
    itemId: sentenceId,
    skillType: "reading",
    result: "opened",
    device: Platform.OS,
  });
};
