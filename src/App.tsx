import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { FeedbackChip } from './components';
import { selectCurrentNode, useGameState } from './game/state';
import type { PlayerChoice } from './scenes/types';

const CAFE_SCENE_ID = 'cafe';

type ChoiceFeedback = Record<
  string,
  {
    evaluation: PlayerChoice['eval'];
    message: string;
  }
>;

type ConfidenceLevel = 'notSure' | 'kindaSure' | 'verySure';

type PendingConfidence = {
  choice: PlayerChoice;
  isMicroReview: boolean;
  contextNodeId: string;
};

type MicroReviewData = {
  id: string;
  nodeId: string;
  speaker: string;
  text: string;
  choices: PlayerChoice[];
};

type Attempt = {
  itemId: string;
  itemLabel: string;
  evaluation: PlayerChoice['eval'];
  confidence: ConfidenceLevel;
  quality: number;
  timestamp: number;
  sourceNodeId: string;
  isMicroReview: boolean;
};

type WeakItem = {
  itemId: string;
  itemLabel: string;
  averageQuality: number;
  attempts: number;
};

const ConfidenceButtons = ({ onSelect }: { onSelect: (level: ConfidenceLevel) => void }) => (
  <div className="flex w-full justify-between gap-2">
    <button
      type="button"
      onClick={() => onSelect('notSure')}
      className="flex-1 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-800 shadow-sm transition hover:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2"
    >
      Not sure
    </button>
    <button
      type="button"
      onClick={() => onSelect('kindaSure')}
      className="flex-1 rounded-xl border border-sky-200 bg-sky-50 px-3 py-2 text-sm font-semibold text-sky-800 shadow-sm transition hover:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:ring-offset-2"
    >
      Kinda sure
    </button>
    <button
      type="button"
      onClick={() => onSelect('verySure')}
      className="flex-1 rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-800 shadow-sm transition hover:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
    >
      Very sure
    </button>
  </div>
);

function App() {
  const sceneId = useGameState((state) => state.sceneId);
  const startScene = useGameState((state) => state.startScene);
  const currentNode = useGameState(selectCurrentNode);
  const goToNode = useGameState((state) => state.goToNode);
  const reset = useGameState((state) => state.reset);

  const hasStarted = Boolean(sceneId);
  const [feedbackByChoice, setFeedbackByChoice] = useState<ChoiceFeedback>({});
  const [microReviewFeedback, setMicroReviewFeedback] = useState<ChoiceFeedback>({});
  const advanceTimeoutRef = useRef<number | null>(null);
  const [pendingConfidence, setPendingConfidence] = useState<PendingConfidence | null>(null);
  const [pendingMicroReview, setPendingMicroReview] = useState<MicroReviewData | null>(null);
  const [activeMicroReview, setActiveMicroReview] = useState<MicroReviewData | null>(null);
  const [postMicroReviewChoice, setPostMicroReviewChoice] = useState<PlayerChoice | null>(null);
  const [attempts, setAttempts] = useState<Attempt[]>([]);

  const clearAdvanceTimeout = useCallback(() => {
    if (typeof window === 'undefined') {
      advanceTimeoutRef.current = null;
      return;
    }

    if (advanceTimeoutRef.current !== null) {
      window.clearTimeout(advanceTimeoutRef.current);
      advanceTimeoutRef.current = null;
    }
  }, []);

  useEffect(() => () => clearAdvanceTimeout(), [clearAdvanceTimeout]);

  const speak = useCallback((text: string) => {
    if (!text || typeof window === 'undefined') {
      return;
    }

    const synth = window.speechSynthesis;
    if (!synth) {
      return;
    }

    synth.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'he-IL';
    synth.speak(utterance);
  }, []);

  useEffect(() => {
    if (currentNode?.npc.text && !activeMicroReview) {
      speak(currentNode.npc.text);
    }

    setFeedbackByChoice({});
    setPendingConfidence(null);
    clearAdvanceTimeout();
  }, [currentNode?.id, currentNode?.npc.text, activeMicroReview, clearAdvanceTimeout, speak]);

  useEffect(() => {
    if (!activeMicroReview) {
      return;
    }

    setMicroReviewFeedback({});
    setPendingConfidence(null);
    if (activeMicroReview.text) {
      speak(activeMicroReview.text);
    }
    clearAdvanceTimeout();
  }, [activeMicroReview, clearAdvanceTimeout, speak]);

  const scheduleAdvance = useCallback(
    (choice: PlayerChoice) => {
      const proceed = () => {
        goToNode(choice.nextNodeId, choice.reward ?? 0, choice.wordsLearned ?? []);
      };

      if (typeof window === 'undefined') {
        proceed();
        return;
      }

      clearAdvanceTimeout();
      const delay = 800 + Math.random() * 400;
      const timeoutId = window.setTimeout(() => {
        proceed();
        advanceTimeoutRef.current = null;
      }, delay);
      advanceTimeoutRef.current = timeoutId;
    },
    [clearAdvanceTimeout, goToNode],
  );

  const handleChoiceClick = useCallback(
    (choice: PlayerChoice) => {
      if (pendingConfidence) {
        return;
      }

      const isMicroReview = Boolean(activeMicroReview);

      if (isMicroReview) {
        setMicroReviewFeedback((prev) => ({
          ...prev,
          [choice.id]: { evaluation: choice.eval, message: choice.feedback },
        }));
      } else {
        setFeedbackByChoice((prev) => ({
          ...prev,
          [choice.id]: { evaluation: choice.eval, message: choice.feedback },
        }));
      }

      if (choice.eval === 'good') {
        speak(choice.text);
      }

      const nodeId = isMicroReview
        ? activeMicroReview?.nodeId ?? currentNode?.id ?? ''
        : currentNode?.id ?? '';

      if (!nodeId) {
        return;
      }

      setPendingConfidence({ choice, isMicroReview, contextNodeId: nodeId });
    },
    [activeMicroReview, currentNode?.id, pendingConfidence, speak],
  );

  const computeQuality = useCallback((evaluation: PlayerChoice['eval'], confidence: ConfidenceLevel) => {
    const isCorrect = evaluation === 'good' || evaluation === 'ok';

    if (confidence === 'verySure') {
      return isCorrect ? 5 : 0;
    }

    if (confidence === 'kindaSure') {
      return isCorrect ? 4 : 1;
    }

    return isCorrect ? 3 : 1;
  }, []);

  const maybeScheduleMicroReview = useCallback(
    (nodeId: string) => {
      if (pendingMicroReview || activeMicroReview || !currentNode || currentNode.id !== nodeId) {
        return;
      }

      setPendingMicroReview({
        id: `micro-${nodeId}-${Date.now()}`,
        nodeId,
        speaker: currentNode.npc.speaker,
        text: currentNode.npc.text,
        choices: currentNode.playerChoices,
      });
    },
    [activeMicroReview, currentNode, pendingMicroReview],
  );

  const handleConfidenceSelect = useCallback(
    (level: ConfidenceLevel) => {
      if (!pendingConfidence) {
        return;
      }

      const { choice, isMicroReview, contextNodeId } = pendingConfidence;
      setPendingConfidence(null);

      const quality = computeQuality(choice.eval, level);
      setAttempts((prev) => [
        ...prev,
        {
          itemId: choice.id,
          itemLabel: choice.text,
          evaluation: choice.eval,
          confidence: level,
          quality,
          timestamp: Date.now(),
          sourceNodeId: contextNodeId,
          isMicroReview,
        },
      ]);

      if (isMicroReview) {
        if (!activeMicroReview) {
          return;
        }

        if (choice.eval === 'wrong') {
          return;
        }

        setActiveMicroReview(null);
        const nextChoice = postMicroReviewChoice;
        setPostMicroReviewChoice(null);
        if (nextChoice) {
          scheduleAdvance(nextChoice);
        }
        return;
      }

      if (choice.eval === 'wrong') {
        maybeScheduleMicroReview(contextNodeId);
        return;
      }

      if (pendingMicroReview) {
        setActiveMicroReview(pendingMicroReview);
        setPendingMicroReview(null);
        setPostMicroReviewChoice(choice);
        return;
      }

      scheduleAdvance(choice);
    },
    [activeMicroReview, computeQuality, maybeScheduleMicroReview, pendingConfidence, pendingMicroReview, postMicroReviewChoice, scheduleAdvance],
  );

  const handleStartScene = useCallback(() => {
    setAttempts([]);
    setFeedbackByChoice({});
    setMicroReviewFeedback({});
    setPendingConfidence(null);
    setPendingMicroReview(null);
    setActiveMicroReview(null);
    setPostMicroReviewChoice(null);
    startScene(CAFE_SCENE_ID);
  }, [startScene]);

  const handleReset = useCallback(() => {
    clearAdvanceTimeout();
    setAttempts([]);
    setFeedbackByChoice({});
    setMicroReviewFeedback({});
    setPendingConfidence(null);
    setPendingMicroReview(null);
    setActiveMicroReview(null);
    setPostMicroReviewChoice(null);
    reset();
  }, [clearAdvanceTimeout, reset]);

  const weakestItems: WeakItem[] = useMemo(() => {
    if (attempts.length === 0) {
      return [];
    }

    const aggregated = new Map<string, { totalQuality: number; attempts: number; itemLabel: string }>();

    for (const attempt of attempts) {
      const existing = aggregated.get(attempt.itemId) ?? {
        totalQuality: 0,
        attempts: 0,
        itemLabel: attempt.itemLabel,
      };

      existing.totalQuality += attempt.quality;
      existing.attempts += 1;
      existing.itemLabel = attempt.itemLabel;

      aggregated.set(attempt.itemId, existing);
    }

    return Array.from(aggregated.entries())
      .map(([itemId, value]) => ({
        itemId,
        itemLabel: value.itemLabel,
        averageQuality: value.totalQuality / value.attempts,
        attempts: value.attempts,
      }))
      .sort((a, b) => a.averageQuality - b.averageQuality)
      .slice(0, 3);
  }, [attempts]);

  return (
    <div className="mx-auto flex min-h-screen max-w-2xl flex-col items-center bg-gradient-to-b from-emerald-50 via-white to-emerald-100 px-6 py-16 text-slate-900">
      <header className="w-full text-center">
        <h1 className="text-4xl font-bold tracking-tight text-emerald-700">
          Daily Hebrew Adventure
        </h1>
        <p className="mt-3 text-lg text-slate-600">
          Step into everyday conversations and grow your Hebrew vocabulary.
        </p>
      </header>

      <main className="mt-12 w-full flex-1">
        {!hasStarted && (
          <div className="flex flex-col items-center gap-6">
            <p className="text-center text-lg text-slate-600">
              Begin your journey with a warm welcome at the neighborhood café.
            </p>
            <button
              type="button"
              onClick={handleStartScene}
              className="rounded-full bg-emerald-600 px-6 py-3 text-lg font-semibold text-white shadow-lg transition hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
            >
              Start Scene
            </button>
          </div>
        )}

        {hasStarted && (activeMicroReview || currentNode) && (
          <section className="rounded-2xl bg-white p-8 shadow-xl">
            <div className="flex flex-col gap-8">
              {activeMicroReview ? (
                <>
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-wide text-emerald-500">Quick review</p>
                    <h2 className="mt-2 text-xl font-semibold text-emerald-700">{activeMicroReview.speaker}</h2>
                    <p className="mt-4 text-lg leading-relaxed text-slate-700" dir="rtl" lang="he">
                      {activeMicroReview.text}
                    </p>
                  </div>

                  <ul className="flex flex-col gap-4">
                    {activeMicroReview.choices.map((choice) => {
                      const feedback = microReviewFeedback[choice.id];
                      const awaitingConfidence = pendingConfidence?.choice.id === choice.id;
                      return (
                        <li key={choice.id} className="flex w-full flex-col items-end gap-2">
                          <button
                            type="button"
                            onClick={() => handleChoiceClick(choice)}
                            className="w-full rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-3 text-right text-lg font-semibold text-emerald-800 shadow-sm transition hover:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                            dir="rtl"
                            lang="he"
                            disabled={Boolean(pendingConfidence) && !awaitingConfidence}
                          >
                            {choice.text}
                          </button>
                          {feedback && (
                            <FeedbackChip evaluation={feedback.evaluation} message={feedback.message} />
                          )}
                          {awaitingConfidence && (
                            <div className="w-full text-left">
                              <p className="mb-2 text-sm font-medium text-slate-600">How confident did you feel?</p>
                              <ConfidenceButtons onSelect={handleConfidenceSelect} />
                            </div>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </>
              ) : (
                currentNode && (
                  <>
                    <div>
                      <h2 className="text-xl font-semibold text-emerald-700">{currentNode.npc.speaker}</h2>
                      <p className="mt-4 text-lg leading-relaxed text-slate-700" dir="rtl" lang="he">
                        {currentNode.npc.text}
                      </p>
                    </div>

                    {currentNode.playerChoices.length > 0 ? (
                      <ul className="flex flex-col gap-4">
                        {currentNode.playerChoices.map((choice) => {
                          const feedback = feedbackByChoice[choice.id];
                          const awaitingConfidence = pendingConfidence?.choice.id === choice.id;
                          return (
                            <li key={choice.id} className="flex flex-col items-end gap-2">
                              <button
                                type="button"
                                onClick={() => handleChoiceClick(choice)}
                                className="w-full rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-3 text-right text-lg font-semibold text-emerald-800 shadow-sm transition hover:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                                dir="rtl"
                                lang="he"
                                disabled={Boolean(pendingConfidence) && !awaitingConfidence}
                              >
                                {choice.text}
                              </button>
                              {feedback && (
                                <FeedbackChip evaluation={feedback.evaluation} message={feedback.message} />
                              )}
                              {awaitingConfidence && (
                                <div className="w-full text-left">
                                  <p className="mb-2 text-sm font-medium text-slate-600">How confident did you feel?</p>
                                  <ConfidenceButtons onSelect={handleConfidenceSelect} />
                                </div>
                              )}
                            </li>
                          );
                        })}
                      </ul>
                    ) : (
                      <div className="flex flex-col items-center gap-6 rounded-xl bg-emerald-50 p-6 text-center">
                        <p className="text-lg font-semibold text-emerald-700" dir="rtl" lang="he">
                          כל הכבוד! סיימת את השיחה.
                        </p>
                        <div className="w-full rounded-xl bg-white/70 p-4 text-left">
                          <h3 className="text-base font-semibold text-emerald-700">Focus on these next</h3>
                          {weakestItems.length > 0 ? (
                            <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-slate-700">
                              {weakestItems.map((item) => (
                                <li key={item.itemId}>
                                  <div className="flex items-center justify-between gap-4">
                                    <span dir="rtl" lang="he">{item.itemLabel}</span>
                                    <span className="text-xs font-semibold text-slate-500">
                                      {item.averageQuality.toFixed(1)} / 5 · {item.attempts} try{item.attempts === 1 ? '' : 's'}
                                    </span>
                                  </div>
                                </li>
                              ))}
                            </ol>
                          ) : (
                            <p className="mt-3 text-sm text-slate-600">No weaknesses detected yet—great job!</p>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={handleReset}
                          className="rounded-full bg-emerald-600 px-5 py-2 text-base font-semibold text-white shadow transition hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
                        >
                          התחל מחדש
                        </button>
                      </div>
                    )}
                  </>
                )
              )}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

export default App;
