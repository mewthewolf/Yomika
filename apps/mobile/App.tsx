import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  type GestureResponderEvent,
  type LayoutChangeEvent,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import type { Session } from "@supabase/supabase-js";

import { HAS_SUPABASE_ENV } from "./src/config/env";
import {
  applyFuriganaMode,
  loadFuriganaMode,
  loadReaderSentences,
  persistFuriganaMode,
  trackReaderOpen,
  type FuriganaMode,
  type ReaderSentence,
} from "./src/features/reader/readerService";
import {
  loadReviewPromptForItem,
  type ReviewPrompt,
} from "./src/features/review/reviewPromptService";
import {
  loadDueReviewItems,
  submitReviewGrade,
  type ReviewItemStateRow,
} from "./src/features/review/reviewService";
import { runSm2Simulation } from "./src/features/review/sm2Simulation";
import type { ReviewGrade } from "./src/features/review/sm2";
import {
  HeuristicDigitalInkProvider,
  recognizeWithFallback,
} from "./src/features/writing/digitalInkProvider";
import {
  WRITING_PROMPTS,
  calculateTraceMetrics,
  getTraceFeedback,
  persistTraceMetrics,
  type WritingMode,
  type TraceMetrics,
  type TracePoint,
} from "./src/features/writing/writingService";
import { supabase } from "./src/lib/supabase";

type AppTab = "review" | "reader" | "writing";
type AuthMode = "sign_in" | "sign_up";

type CanvasSize = {
  width: number;
  height: number;
};

const GRADES: ReviewGrade[] = [0, 1, 2, 3, 4, 5];

export default function App() {
  const [bootLoading, setBootLoading] = useState(true);
  const [bootError, setBootError] = useState<string | null>(null);

  const [session, setSession] = useState<Session | null>(null);

  const [authMode, setAuthMode] = useState<AuthMode>("sign_in");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authMessage, setAuthMessage] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<AppTab>("review");

  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [reviewQueue, setReviewQueue] = useState<ReviewItemStateRow[]>([]);
  const [reviewStartedAt, setReviewStartedAt] = useState<number>(Date.now());
  const [gradeSubmitting, setGradeSubmitting] = useState(false);
  const [reviewPrompt, setReviewPrompt] = useState<ReviewPrompt | null>(null);
  const [reviewPromptLoading, setReviewPromptLoading] = useState(false);
  const [reviewPromptError, setReviewPromptError] = useState<string | null>(null);

  const [readerLoading, setReaderLoading] = useState(false);
  const [readerError, setReaderError] = useState<string | null>(null);
  const [readerSentences, setReaderSentences] = useState<ReaderSentence[]>([]);
  const [activeSentenceIndex, setActiveSentenceIndex] = useState(0);
  const [furiganaMode, setFuriganaMode] = useState<FuriganaMode>("partial");
  const [furiganaSaving, setFuriganaSaving] = useState(false);

  const [writingPromptIndex, setWritingPromptIndex] = useState(0);
  const [writingMode, setWritingMode] = useState<WritingMode>("guided");
  const [showReference, setShowReference] = useState(true);
  const [tracePoints, setTracePoints] = useState<TracePoint[]>([]);
  const [traceStartedAt, setTraceStartedAt] = useState<number | null>(null);
  const [canvasSize, setCanvasSize] = useState<CanvasSize>({ width: 0, height: 0 });
  const [writingSaving, setWritingSaving] = useState(false);
  const [writingError, setWritingError] = useState<string | null>(null);
  const [writingMessage, setWritingMessage] = useState<string | null>(null);
  const [lastTraceMetrics, setLastTraceMetrics] = useState<TraceMetrics | null>(null);
  const [lastRecognition, setLastRecognition] = useState<string | null>(null);

  const user = session?.user ?? null;
  const currentReviewItem = reviewQueue[0] ?? null;
  const activeSentence = readerSentences[activeSentenceIndex] ?? null;
  const activeWritingPrompt = WRITING_PROMPTS[writingPromptIndex] ?? WRITING_PROMPTS[0];

  const sm2SelfCheck = useMemo(() => runSm2Simulation(), []);
  const digitalInkProvider = useMemo(() => new HeuristicDigitalInkProvider(), []);

  const refreshReviewQueue = useCallback(async () => {
    if (!supabase || !user) {
      return;
    }

    setReviewLoading(true);
    setReviewError(null);

    try {
      const queue = await loadDueReviewItems(supabase, user.id);
      setReviewQueue(queue);
      setReviewStartedAt(Date.now());
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load review queue.";
      setReviewError(message);
    } finally {
      setReviewLoading(false);
    }
  }, [user]);

  const refreshReader = useCallback(async () => {
    if (!supabase || !user) {
      return;
    }

    setReaderLoading(true);
    setReaderError(null);

    try {
      const [sentences, mode] = await Promise.all([
        loadReaderSentences(supabase),
        loadFuriganaMode(supabase, user.id),
      ]);
      setReaderSentences(sentences);
      setFuriganaMode(mode);
      setActiveSentenceIndex(0);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load reader data.";
      setReaderError(message);
    } finally {
      setReaderLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!HAS_SUPABASE_ENV || !supabase) {
      setBootError("Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY.");
      setBootLoading(false);
      return;
    }

    const client = supabase;
    let mounted = true;

    const bootstrap = async () => {
      setBootLoading(true);
      setBootError(null);

      const { data, error } = await client.auth.getSession();

      if (!mounted) {
        return;
      }

      if (error) {
        setBootError(error.message);
      } else {
        setSession(data.session);
      }

      setBootLoading(false);
    };

    bootstrap();

    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((_event, nextSession) => {
      if (!mounted) {
        return;
      }
      setSession(nextSession);
      setAuthError(null);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!user || !supabase) {
      setReviewQueue([]);
      setReaderSentences([]);
      return;
    }

    refreshReviewQueue();
    refreshReader();
  }, [user, refreshReviewQueue, refreshReader]);

  useEffect(() => {
    if (!user || !supabase || !activeSentence) {
      return;
    }

    trackReaderOpen(supabase, user.id, activeSentence.id).catch(() => {
      // Non-blocking instrumentation for sprint baseline.
    });
  }, [user, activeSentence]);

  useEffect(() => {
    if (!supabase || !currentReviewItem) {
      setReviewPrompt(null);
      setReviewPromptError(null);
      return;
    }

    const client = supabase;
    let mounted = true;

    const loadPrompt = async () => {
      setReviewPromptLoading(true);
      setReviewPromptError(null);

      try {
        const prompt = await loadReviewPromptForItem(client, currentReviewItem);
        if (!mounted) {
          return;
        }
        setReviewPrompt(prompt);
      } catch (error) {
        if (!mounted) {
          return;
        }
        const message = error instanceof Error ? error.message : "Failed to load review prompt.";
        setReviewPromptError(message);
      } finally {
        if (mounted) {
          setReviewPromptLoading(false);
        }
      }
    };

    loadPrompt();

    return () => {
      mounted = false;
    };
  }, [currentReviewItem]);

  const submitAuth = useCallback(async () => {
    if (!supabase) {
      return;
    }

    setAuthLoading(true);
    setAuthError(null);
    setAuthMessage(null);

    try {
      if (authMode === "sign_in") {
        const { error } = await supabase.auth.signInWithPassword({
          email: authEmail.trim(),
          password: authPassword,
        });

        if (error) {
          throw error;
        }
      } else {
        const { data, error } = await supabase.auth.signUp({
          email: authEmail.trim(),
          password: authPassword,
        });

        if (error) {
          throw error;
        }

        if (!data.session) {
          setAuthMessage("Sign-up submitted. Check your email for confirmation if enabled.");
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Authentication failed.";
      setAuthError(message);
    } finally {
      setAuthLoading(false);
    }
  }, [authEmail, authMode, authPassword]);

  const signOut = useCallback(async () => {
    if (!supabase) {
      return;
    }

    await supabase.auth.signOut();
    setActiveTab("review");
  }, []);

  const handleSubmitGrade = useCallback(
    async (grade: ReviewGrade) => {
      if (!supabase || !user || !currentReviewItem) {
        return;
      }

      setGradeSubmitting(true);
      setReviewError(null);

      try {
        const latency = Date.now() - reviewStartedAt;
        await submitReviewGrade(supabase, user.id, currentReviewItem, grade, latency);
        await refreshReviewQueue();
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to submit review grade.";
        setReviewError(message);
      } finally {
        setGradeSubmitting(false);
      }
    },
    [currentReviewItem, refreshReviewQueue, reviewStartedAt, user],
  );

  const changeFuriganaMode = useCallback(
    async (mode: FuriganaMode) => {
      if (!supabase || !user) {
        return;
      }

      setFuriganaMode(mode);
      setFuriganaSaving(true);

      try {
        await persistFuriganaMode(supabase, user.id, mode);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to save furigana mode.";
        setReaderError(message);
      } finally {
        setFuriganaSaving(false);
      }
    },
    [user],
  );

  const onTraceStart = useCallback((event: GestureResponderEvent) => {
    const { locationX, locationY } = event.nativeEvent;
    const now = Date.now();

    setTraceStartedAt(now);
    setTracePoints([{ x: locationX, y: locationY, t: now }]);
    setWritingError(null);
    setWritingMessage(null);
  }, []);

  const onTraceMove = useCallback((event: GestureResponderEvent) => {
    const { locationX, locationY } = event.nativeEvent;
    const now = Date.now();

    setTracePoints((previous) => {
      if (previous.length >= 1200) {
        return previous;
      }

      const last = previous[previous.length - 1];
      if (last) {
        const dx = locationX - last.x;
        const dy = locationY - last.y;
        if (dx * dx + dy * dy < 6.25) {
          return previous;
        }
      }

      return [...previous, { x: locationX, y: locationY, t: now }];
    });
  }, []);

  const onCanvasLayout = useCallback((event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setCanvasSize({ width, height });
  }, []);

  const clearTrace = useCallback(() => {
    setTracePoints([]);
    setTraceStartedAt(null);
    setLastTraceMetrics(null);
    setLastRecognition(null);
    setWritingMessage(null);
    setWritingError(null);
  }, []);

  const nextWritingPrompt = useCallback(() => {
    setWritingPromptIndex((current) => (current + 1) % WRITING_PROMPTS.length);
    clearTrace();
    setShowReference(writingMode === "guided");
  }, [clearTrace, writingMode]);

  const toggleWritingMode = useCallback((mode: WritingMode) => {
    setWritingMode(mode);
    setShowReference(mode === "guided");
    clearTrace();
  }, [clearTrace]);

  const toggleReference = useCallback(() => {
    setShowReference((value) => !value);
  }, [clearTrace]);

  const saveTraceSession = useCallback(async () => {
    if (!supabase || !user) {
      return;
    }

    if (tracePoints.length < 4) {
      setWritingError("Draw a longer trace before saving this writing session.");
      return;
    }

    if (canvasSize.width <= 0 || canvasSize.height <= 0) {
      setWritingError("Canvas is not ready yet. Try again in a moment.");
      return;
    }

    const durationMs = traceStartedAt ? Math.max(1, Date.now() - traceStartedAt) : 1;
    const metrics = calculateTraceMetrics(tracePoints, durationMs, canvasSize.width, canvasSize.height);

    setWritingSaving(true);
    setWritingError(null);

    try {
      const recognition = await recognizeWithFallback(digitalInkProvider, {
        points: tracePoints,
        canvasWidth: canvasSize.width,
        canvasHeight: canvasSize.height,
        promptGlyph: activeWritingPrompt.glyph,
      });

      const recognitionTag =
        recognition.status === "recognized"
          ? `${recognition.provider}_${recognition.confidence}`
          : `fallback_${recognition.reason ?? "unknown"}`;

      await persistTraceMetrics(
        supabase,
        user.id,
        activeWritingPrompt,
        metrics,
        writingMode,
        recognitionTag,
      );

      setLastTraceMetrics(metrics);
      setLastRecognition(
        recognition.status === "recognized"
          ? `Digital ink recognized ${recognition.matchedGlyph ?? "glyph"} at ${recognition.confidence}% confidence.`
          : `Digital ink fallback activated (${recognition.reason ?? "unknown reason"}).`,
      );
      const feedback = getTraceFeedback(metrics.traceScore);
      setWritingMessage(`Saved ${writingMode} trace with score ${metrics.traceScore}. ${feedback}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to save trace metrics.";
      setWritingError(message);
    } finally {
      setWritingSaving(false);
    }
  }, [activeWritingPrompt, canvasSize.height, canvasSize.width, digitalInkProvider, tracePoints, traceStartedAt, user, writingMode]);

  const displayedSentence = useMemo(() => {
    if (!activeSentence) {
      return "";
    }

    if (activeSentence.tokens.length === 0) {
      if (furiganaMode === "off" || !activeSentence.reading_kana) {
        return activeSentence.text_ja;
      }

      if (furiganaMode === "partial") {
        return `${activeSentence.text_ja}\n${activeSentence.reading_kana}`;
      }

      return `${activeSentence.text_ja} (${activeSentence.reading_kana})`;
    }

    return applyFuriganaMode(activeSentence.tokens, furiganaMode);
  }, [activeSentence, furiganaMode]);

  if (bootLoading) {
    return (
      <SafeAreaView style={styles.pageCenter}>
        <ActivityIndicator size="large" color="#2e4f7d" />
        <Text style={styles.centerText}>Bootstrapping Sprint 2 baseline...</Text>
      </SafeAreaView>
    );
  }

  if (bootError) {
    return (
      <SafeAreaView style={styles.pageCenter}>
        <Text style={styles.errorTitle}>Configuration issue</Text>
        <Text style={styles.errorText}>{bootError}</Text>
      </SafeAreaView>
    );
  }

  if (!session) {
    return (
      <SafeAreaView style={styles.page}>
        <View style={styles.authCard}>
          <Text style={styles.title}>Yomika Sprint Workspace</Text>
          <Text style={styles.subtitle}>Auth + review + reader + writing trace mode</Text>

          <View style={styles.modeRow}>
            <Pressable
              style={[styles.modeButton, authMode === "sign_in" && styles.modeButtonActive]}
              onPress={() => setAuthMode("sign_in")}
            >
              <Text style={styles.modeButtonText}>Sign in</Text>
            </Pressable>
            <Pressable
              style={[styles.modeButton, authMode === "sign_up" && styles.modeButtonActive]}
              onPress={() => setAuthMode("sign_up")}
            >
              <Text style={styles.modeButtonText}>Sign up</Text>
            </Pressable>
          </View>

          <TextInput
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder="Email"
            placeholderTextColor="#6f7b8c"
            value={authEmail}
            onChangeText={setAuthEmail}
            style={styles.input}
          />
          <TextInput
            secureTextEntry
            placeholder="Password"
            placeholderTextColor="#6f7b8c"
            value={authPassword}
            onChangeText={setAuthPassword}
            style={styles.input}
          />

          <Pressable
            style={[styles.primaryButton, authLoading && styles.buttonDisabled]}
            onPress={submitAuth}
            disabled={authLoading}
          >
            <Text style={styles.primaryButtonText}>
              {authLoading ? "Working..." : authMode === "sign_in" ? "Sign in" : "Create account"}
            </Text>
          </Pressable>

          {authError ? <Text style={styles.errorText}>{authError}</Text> : null}
          {authMessage ? <Text style={styles.infoText}>{authMessage}</Text> : null}
        </View>
        <StatusBar style="dark" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.page}>
      <View style={styles.headerCard}>
        <View>
          <Text style={styles.title}>Yomika Sprint Workspace</Text>
          <Text style={styles.subtitle}>{session.user.email ?? "Authenticated user"}</Text>
        </View>
        <Pressable style={styles.secondaryButton} onPress={signOut}>
          <Text style={styles.secondaryButtonText}>Sign out</Text>
        </Pressable>
      </View>

      <View style={styles.tabRow}>
        <Pressable
          style={[styles.tabButton, activeTab === "review" && styles.tabButtonActive]}
          onPress={() => setActiveTab("review")}
        >
          <Text style={styles.tabText}>Review</Text>
        </Pressable>
        <Pressable
          style={[styles.tabButton, activeTab === "reader" && styles.tabButtonActive]}
          onPress={() => setActiveTab("reader")}
        >
          <Text style={styles.tabText}>Reader</Text>
        </Pressable>
        <Pressable
          style={[styles.tabButton, activeTab === "writing" && styles.tabButtonActive]}
          onPress={() => setActiveTab("writing")}
        >
          <Text style={styles.tabText}>Writing</Text>
        </Pressable>
      </View>

      {activeTab === "review" ? (
        <View style={styles.panel}>
          <View style={styles.panelHeaderRow}>
            <Text style={styles.panelTitle}>SM-2 Review Queue</Text>
            <Pressable style={styles.secondaryButton} onPress={refreshReviewQueue}>
              <Text style={styles.secondaryButtonText}>Refresh</Text>
            </Pressable>
          </View>

          <Text style={[styles.simulationText, sm2SelfCheck.passed ? styles.simulationPass : styles.simulationFail]}>
            SM-2 self-check: {sm2SelfCheck.details}
          </Text>

          {reviewLoading ? <ActivityIndicator color="#2e4f7d" /> : null}
          {reviewError ? <Text style={styles.errorText}>{reviewError}</Text> : null}

          {currentReviewItem ? (
            <>
              <Text style={styles.itemMeta}>
                {currentReviewItem.item_type}:{currentReviewItem.skill_type}
              </Text>

              {reviewPromptLoading ? <ActivityIndicator color="#2e4f7d" /> : null}
              {reviewPromptError ? <Text style={styles.errorText}>{reviewPromptError}</Text> : null}

              <Text style={styles.itemPrompt}>{reviewPrompt?.title ?? "Review Prompt"}</Text>
              <Text style={styles.itemBody}>
                {reviewPrompt?.prompt ?? "Load a prompt and evaluate your recall."}
              </Text>
              <Text style={styles.itemHint}>
                {reviewPrompt?.answerHint ?? "Use 0-5 grading after your recall attempt."}
              </Text>

              <Text style={styles.itemStats}>
                Template {reviewPrompt?.templateType ?? "n/a"} ({reviewPrompt?.source ?? "n/a"}) | Ease {currentReviewItem.ease.toFixed(2)} | Interval {currentReviewItem.interval_days}d | Repetitions {currentReviewItem.repetitions}
              </Text>

              <View style={styles.gradeRow}>
                {GRADES.map((grade) => (
                  <Pressable
                    key={grade}
                    style={[styles.gradeButton, gradeSubmitting && styles.buttonDisabled]}
                    onPress={() => handleSubmitGrade(grade)}
                    disabled={gradeSubmitting}
                  >
                    <Text style={styles.gradeButtonText}>{grade}</Text>
                  </Pressable>
                ))}
              </View>
              <Text style={styles.hintText}>0-2 resets interval, 3-5 advances schedule.</Text>
            </>
          ) : (
            <Text style={styles.infoText}>No due review items. Use refresh to re-check queue.</Text>
          )}
        </View>
      ) : null}

      {activeTab === "reader" ? (
        <View style={styles.panel}>
          <View style={styles.panelHeaderRow}>
            <Text style={styles.panelTitle}>Reading Mode</Text>
            <Pressable style={styles.secondaryButton} onPress={refreshReader}>
              <Text style={styles.secondaryButtonText}>Reload</Text>
            </Pressable>
          </View>

          <View style={styles.modeRow}>
            {(["full", "partial", "off"] as FuriganaMode[]).map((mode) => (
              <Pressable
                key={mode}
                style={[styles.modeButton, furiganaMode === mode && styles.modeButtonActive]}
                onPress={() => changeFuriganaMode(mode)}
                disabled={furiganaSaving}
              >
                <Text style={styles.modeButtonText}>{mode}</Text>
              </Pressable>
            ))}
          </View>

          {readerLoading ? <ActivityIndicator color="#2e4f7d" /> : null}
          {readerError ? <Text style={styles.errorText}>{readerError}</Text> : null}

          {activeSentence ? (
            <>
              <Text style={styles.itemPrompt}>{displayedSentence}</Text>
              <Text style={styles.translationText}>{activeSentence.translation_en ?? "No translation yet."}</Text>

              <ScrollView style={styles.sentenceList}>
                {readerSentences.map((sentence, index) => (
                  <Pressable
                    key={sentence.id}
                    style={[
                      styles.sentenceRow,
                      index === activeSentenceIndex && styles.sentenceRowActive,
                    ]}
                    onPress={() => setActiveSentenceIndex(index)}
                  >
                    <Text style={styles.sentenceLabel}>{sentence.text_ja}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            </>
          ) : (
            <Text style={styles.infoText}>No sentence data available yet.</Text>
          )}
        </View>
      ) : null}

      {activeTab === "writing" ? (
        <View style={styles.panel}>
          <View style={styles.panelHeaderRow}>
            <Text style={styles.panelTitle}>Writing Trace Mode</Text>
            <Pressable style={styles.secondaryButton} onPress={nextWritingPrompt}>
              <Text style={styles.secondaryButtonText}>Next prompt</Text>
            </Pressable>
          </View>

          <View style={styles.modeRow}>
            {(["guided", "freehand"] as WritingMode[]).map((mode) => (
              <Pressable
                key={mode}
                style={[styles.modeButton, writingMode === mode && styles.modeButtonActive]}
                onPress={() => toggleWritingMode(mode)}
              >
                <Text style={styles.modeButtonText}>{mode}</Text>
              </Pressable>
            ))}
          </View>

          <View style={styles.glyphCard}>
            {showReference ? (
              <>
                <Text style={styles.glyphText}>{activeWritingPrompt.glyph}</Text>
                <Text style={styles.glyphMeta}>
                  {activeWritingPrompt.reading} • {activeWritingPrompt.meaning}
                </Text>
              </>
            ) : (
              <Text style={styles.hiddenReference}>Reference hidden. Draw from memory, then reveal.</Text>
            )}
            <Text style={styles.glyphInstruction}>{activeWritingPrompt.instruction}</Text>
          </View>

          <View
            style={styles.canvas}
            onLayout={onCanvasLayout}
            onStartShouldSetResponder={() => true}
            onMoveShouldSetResponder={() => true}
            onResponderGrant={onTraceStart}
            onResponderMove={onTraceMove}
            onResponderRelease={() => {
              // no-op baseline; metrics are derived on explicit save.
            }}
          >
            {tracePoints.map((point, index) => (
              <View
                key={`${point.t}-${index}`}
                style={[styles.traceDot, { left: point.x - 2, top: point.y - 2 }]}
              />
            ))}
          </View>

          <View style={styles.actionsRow}>
            <Pressable style={styles.secondaryButton} onPress={clearTrace}>
              <Text style={styles.secondaryButtonText}>Clear</Text>
            </Pressable>
            <Pressable
              style={styles.secondaryButton}
              onPress={toggleReference}
            >
              <Text style={styles.secondaryButtonText}>
                {showReference ? "Hide ref" : "Reveal ref"}
              </Text>
            </Pressable>
            <Pressable
              style={[styles.primaryButton, writingSaving && styles.buttonDisabled]}
              onPress={saveTraceSession}
              disabled={writingSaving}
            >
              <Text style={styles.primaryButtonText}>{writingSaving ? "Saving..." : "Save session"}</Text>
            </Pressable>
          </View>

          {writingError ? <Text style={styles.errorText}>{writingError}</Text> : null}
          {writingMessage ? <Text style={styles.infoText}>{writingMessage}</Text> : null}

          {lastTraceMetrics ? (
            <>
              <Text style={styles.itemStats}>
                Score {lastTraceMetrics.traceScore} | Points {lastTraceMetrics.pointCount} | Duration {lastTraceMetrics.durationMs}ms | Coverage {lastTraceMetrics.coverageRatio}
              </Text>
              {lastRecognition ? <Text style={styles.hintText}>{lastRecognition}</Text> : null}
            </>
          ) : (
            <Text style={styles.hintText}>Raw trace points stay local; only derived metrics are persisted.</Text>
          )}
        </View>
      ) : null}

      <StatusBar style="dark" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: "#eef3f8",
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 12,
  },
  pageCenter: {
    flex: 1,
    backgroundColor: "#eef3f8",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingHorizontal: 24,
  },
  centerText: {
    fontSize: 15,
    color: "#24364f",
  },
  authCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 16,
    borderColor: "#ced9e6",
    borderWidth: 1,
    marginTop: 80,
    gap: 10,
  },
  headerCard: {
    backgroundColor: "#ffffff",
    borderRadius: 14,
    borderColor: "#ced9e6",
    borderWidth: 1,
    padding: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#14233a",
  },
  subtitle: {
    fontSize: 13,
    color: "#40536d",
  },
  tabRow: {
    flexDirection: "row",
    gap: 8,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#b9c9de",
    backgroundColor: "#ffffff",
    alignItems: "center",
  },
  tabButtonActive: {
    backgroundColor: "#d7e7fb",
    borderColor: "#6694cf",
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#173157",
  },
  panel: {
    flex: 1,
    backgroundColor: "#ffffff",
    borderRadius: 14,
    borderColor: "#ced9e6",
    borderWidth: 1,
    padding: 14,
    gap: 10,
  },
  panelHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  panelTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#16263e",
  },
  simulationText: {
    fontSize: 12,
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderWidth: 1,
  },
  simulationPass: {
    color: "#14643b",
    borderColor: "#9cd2b4",
    backgroundColor: "#ecfbf2",
  },
  simulationFail: {
    color: "#7c2630",
    borderColor: "#dfafb5",
    backgroundColor: "#fff1f2",
  },
  itemMeta: {
    fontSize: 12,
    color: "#4c6280",
    textTransform: "uppercase",
  },
  itemPrompt: {
    fontSize: 18,
    color: "#192c49",
    lineHeight: 27,
  },
  itemBody: {
    fontSize: 14,
    lineHeight: 22,
    color: "#22395a",
  },
  itemHint: {
    fontSize: 13,
    color: "#3f5880",
  },
  itemStats: {
    fontSize: 13,
    color: "#466082",
  },
  gradeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  gradeButton: {
    minWidth: 46,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: "#8aa7cc",
    backgroundColor: "#f5f9ff",
  },
  gradeButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1f4f8a",
  },
  modeRow: {
    flexDirection: "row",
    gap: 8,
  },
  modeButton: {
    flex: 1,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: "#afc2da",
    backgroundColor: "#f6f8fb",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
  },
  modeButtonActive: {
    backgroundColor: "#d7e7fb",
    borderColor: "#6694cf",
  },
  modeButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#244160",
  },
  primaryButton: {
    borderRadius: 10,
    backgroundColor: "#2f69ad",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  primaryButtonText: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 14,
  },
  secondaryButton: {
    borderRadius: 9,
    borderWidth: 1,
    borderColor: "#9cb2ce",
    backgroundColor: "#f4f8fd",
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  secondaryButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#1e436f",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  input: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#b8c9de",
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: "#172842",
    backgroundColor: "#fbfdff",
  },
  sentenceList: {
    marginTop: 4,
  },
  sentenceRow: {
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderBottomColor: "#dde6f0",
    borderBottomWidth: 1,
  },
  sentenceRowActive: {
    backgroundColor: "#edf4ff",
  },
  sentenceLabel: {
    fontSize: 14,
    color: "#1b2d49",
  },
  translationText: {
    fontSize: 13,
    color: "#4e6380",
  },
  hintText: {
    fontSize: 12,
    color: "#5d7090",
  },
  infoText: {
    fontSize: 13,
    color: "#3e5c81",
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#722f39",
  },
  errorText: {
    fontSize: 13,
    color: "#8d3440",
  },
  glyphCard: {
    borderWidth: 1,
    borderColor: "#c7d6e8",
    borderRadius: 10,
    backgroundColor: "#f8fbff",
    padding: 10,
    gap: 4,
  },
  glyphText: {
    fontSize: 56,
    color: "#183058",
    fontWeight: "700",
    textAlign: "center",
  },
  glyphMeta: {
    fontSize: 13,
    color: "#35557f",
    textAlign: "center",
  },
  glyphInstruction: {
    fontSize: 12,
    color: "#4f6788",
    textAlign: "center",
  },
  hiddenReference: {
    fontSize: 13,
    color: "#3f5f86",
    textAlign: "center",
    paddingVertical: 12,
  },
  canvas: {
    flex: 1,
    minHeight: 220,
    borderWidth: 1,
    borderColor: "#b6c8df",
    borderRadius: 12,
    backgroundColor: "#ffffff",
    position: "relative",
    overflow: "hidden",
  },
  traceDot: {
    position: "absolute",
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#2e69ad",
  },
  actionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
  },
});
