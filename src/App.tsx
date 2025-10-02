import { useCallback, useEffect, useRef, useState } from 'react';

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

function App() {
  const sceneId = useGameState((state) => state.sceneId);
  const startScene = useGameState((state) => state.startScene);
  const currentNode = useGameState(selectCurrentNode);
  const goToNode = useGameState((state) => state.goToNode);
  const reset = useGameState((state) => state.reset);

  const hasStarted = Boolean(sceneId);
  const [feedbackByChoice, setFeedbackByChoice] = useState<ChoiceFeedback>({});
  const advanceTimeoutRef = useRef<number | null>(null);

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
    if (currentNode?.npc.text) {
      speak(currentNode.npc.text);
    }

    setFeedbackByChoice({});
    clearAdvanceTimeout();
  }, [currentNode?.id, currentNode?.npc.text, clearAdvanceTimeout, speak]);

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
      setFeedbackByChoice((prev) => ({
        ...prev,
        [choice.id]: { evaluation: choice.eval, message: choice.feedback },
      }));

      if (choice.eval === 'good') {
        speak(choice.text);
      }

      if (choice.eval === 'good' || choice.eval === 'ok') {
        scheduleAdvance(choice);
      }
    },
    [scheduleAdvance, speak],
  );

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
              onClick={() => startScene(CAFE_SCENE_ID)}
              className="rounded-full bg-emerald-600 px-6 py-3 text-lg font-semibold text-white shadow-lg transition hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
            >
              Start Scene
            </button>
          </div>
        )}

        {hasStarted && currentNode && (
          <section className="rounded-2xl bg-white p-8 shadow-xl">
            <div className="flex flex-col gap-8">
              <div>
                <h2 className="text-xl font-semibold text-emerald-700">
                  {currentNode.npc.speaker}
                </h2>
                <p className="mt-4 text-lg leading-relaxed text-slate-700" dir="rtl" lang="he">
                  {currentNode.npc.text}
                </p>
              </div>

              {currentNode.playerChoices.length > 0 ? (
                <ul className="flex flex-col gap-4">
                  {currentNode.playerChoices.map((choice) => {
                    const feedback = feedbackByChoice[choice.id];
                    return (
                      <li key={choice.id} className="flex flex-col items-end gap-2">
                        <button
                          type="button"
                          onClick={() => handleChoiceClick(choice)}
                          className="w-full rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-3 text-right text-lg font-semibold text-emerald-800 shadow-sm transition hover:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
                          dir="rtl"
                          lang="he"
                        >
                          {choice.text}
                        </button>
                        {feedback && (
                          <FeedbackChip evaluation={feedback.evaluation} message={feedback.message} />
                        )}
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <div className="flex flex-col items-center gap-4 rounded-xl bg-emerald-50 p-6 text-center">
                  <p className="text-lg font-semibold text-emerald-700" dir="rtl" lang="he">
                    כל הכבוד! סיימת את השיחה.
                  </p>
                  <button
                    type="button"
                    onClick={reset}
                    className="rounded-full bg-emerald-600 px-5 py-2 text-base font-semibold text-white shadow transition hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
                  >
                    התחל מחדש
                  </button>
                </div>
              )}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

export default App;
