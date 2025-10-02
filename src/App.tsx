import { type DragEvent, useEffect, useMemo, useRef, useState } from 'react';

import { beginnerCafeConversation, type ResponseWord } from './game/conversation';
import type { GenderPresentation, PlayerLevel } from './scenes/types';

type GamePhase = 'profile' | 'intro' | 'play' | 'summary';

type PlayerProfile = {
  name: string;
  gender: GenderPresentation;
  level: PlayerLevel;
};

type DragItem = {
  source: 'bank' | 'slot';
  wordId: string;
  slotIndex?: number;
};

const genderOptions: { value: GenderPresentation; label: string }[] = [
  { value: 'masculine', label: 'Masculine' },
  { value: 'feminine', label: 'Feminine' },
  { value: 'neutral', label: 'Neutral' },
];

const levelOptions: { value: PlayerLevel; label: string }[] = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'advanced', label: 'Advanced' },
];

function WordToken({
  word,
  onDragStart,
  className = '',
  showTranslationBelow = false,
}: {
  word: ResponseWord;
  onDragStart: (event: DragEvent<HTMLDivElement>) => void;
  className?: string;
  showTranslationBelow?: boolean;
}) {
  return (
    <div
      draggable
      onDragStart={onDragStart}
      className={`cursor-grab select-none rounded-xl border border-slate-300 bg-white px-3 py-2 text-lg font-semibold text-slate-900 shadow transition hover:border-emerald-400 hover:shadow-lg dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 ${
        showTranslationBelow ? 'flex flex-col items-center gap-1 text-center' : ''
      } ${className}`}
      {...(!showTranslationBelow ? { title: word.translation } : {})}
    >
      <span>{word.text}</span>
      {showTranslationBelow ? (
        <span className="text-sm font-medium text-slate-500 dark:text-slate-300">{word.translation}</span>
      ) : null}
    </div>
  );
}

export default function App() {
  const conversation = beginnerCafeConversation;

  const [phase, setPhase] = useState<GamePhase>('profile');
  const [profile, setProfile] = useState<PlayerProfile>({
    name: '',
    gender: 'neutral',
    level: 'beginner',
  });

  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [slots, setSlots] = useState<(string | null)[]>([]);
  const [feedback, setFeedback] = useState<(boolean | null)[]>([]);
  const [stepSolved, setStepSolved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    attempts: 0,
    stepsCompleted: 0,
    wordsCorrect: 0,
  });

  const uniqueWordsRef = useRef(new Set<string>());
  const [uniqueWordCount, setUniqueWordCount] = useState(0);

  const currentStep = conversation.steps[currentStepIndex];

  useEffect(() => {
    if (!currentStep) {
      return;
    }

    setSlots(Array(currentStep.responseWordIds.length).fill(null));
    setFeedback(Array(currentStep.responseWordIds.length).fill(null));
    setStepSolved(false);
    setError(null);
  }, [currentStep]);

  const wordLookup = useMemo(() => {
    const map = new Map<string, ResponseWord>();
    if (!currentStep) {
      return map;
    }

    currentStep.wordBank.forEach((word) => {
      map.set(word.id, word);
    });

    return map;
  }, [currentStep]);

  const placedIds = useMemo(() => slots.filter((id): id is string => Boolean(id)), [slots]);

  const availableWords = useMemo(() => {
    if (!currentStep) {
      return [];
    }

    const placed = new Set(placedIds);

    return currentStep.wordBank.filter((word) => !placed.has(word.id));
  }, [currentStep, placedIds]);

  const handleProfileChange = <K extends keyof PlayerProfile>(
    field: K,
    value: PlayerProfile[K],
  ) => {
    setProfile((prev) => ({ ...prev, [field]: value }));
  };

  const handleStartGame = () => {
    setPhase('intro');
  };

  const handleEnterScene = () => {
    setPhase('play');
  };

  const parseDragItem = (event: DragEvent): DragItem | null => {
    try {
      const payload = event.dataTransfer.getData('application/json');
      return payload ? (JSON.parse(payload) as DragItem) : null;
    } catch {
      return null;
    }
  };

  const resetFeedback = () => {
    if (!currentStep) {
      return;
    }

    setFeedback(Array(currentStep.responseWordIds.length).fill(null));
    setError(null);
    setStepSolved(false);
  };

  const handleDropOnSlot = (slotIndex: number, event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const dragItem = parseDragItem(event);
    if (!dragItem) {
      return;
    }

    resetFeedback();

    setSlots((prev) => {
      const next = [...prev];

      if (dragItem.source === 'slot' && dragItem.slotIndex === slotIndex) {
        return prev;
      }

      const displaced = next[slotIndex];

      if (dragItem.source === 'slot' && typeof dragItem.slotIndex === 'number') {
        next[dragItem.slotIndex] = displaced ?? null;
      }

      next[slotIndex] = dragItem.wordId;

      return next;
    });
  };

  const handleDropToBank = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const dragItem = parseDragItem(event);
    if (!dragItem) {
      return;
    }

    if (dragItem.source === 'slot' && typeof dragItem.slotIndex === 'number') {
      resetFeedback();
      setSlots((prev) => {
        const next = [...prev];
        next[dragItem.slotIndex!] = null;
        return next;
      });
    }
  };

  const handleDragStartFromBank = (wordId: string) => (event: DragEvent<HTMLDivElement>) => {
    const payload: DragItem = { source: 'bank', wordId };
    event.dataTransfer.setData('application/json', JSON.stringify(payload));
    event.dataTransfer.effectAllowed = 'move';
  };

  const handleDragStartFromSlot = (wordId: string, slotIndex: number) =>
    (event: DragEvent<HTMLDivElement>) => {
      const payload: DragItem = { source: 'slot', wordId, slotIndex };
      event.dataTransfer.setData('application/json', JSON.stringify(payload));
      event.dataTransfer.effectAllowed = 'move';
    };

  const handleSubmit = () => {
    if (!currentStep) {
      return;
    }

    if (slots.some((slot) => slot === null)) {
      setError('Fill every response space before submitting.');
      return;
    }

    const evaluation = currentStep.responseWordIds.map((expected, index) => {
      return slots[index] === expected;
    });

    setFeedback(evaluation);
    setError(null);

    const allCorrect = evaluation.every(Boolean);

    setStats((prev) => {
      const updated = {
        attempts: prev.attempts + 1,
        stepsCompleted: prev.stepsCompleted,
        wordsCorrect: prev.wordsCorrect,
      };

      if (allCorrect && !stepSolved) {
        updated.stepsCompleted += 1;
        updated.wordsCorrect += currentStep.responseWordIds.length;
      }

      return updated;
    });

    if (allCorrect && !stepSolved) {
      setStepSolved(true);

      const nextWordSet = new Set(uniqueWordsRef.current);
      currentStep.responseWordIds.forEach((id) => nextWordSet.add(id));
      uniqueWordsRef.current = nextWordSet;
      setUniqueWordCount(nextWordSet.size);
    }
  };

  const handleNextStep = () => {
    if (currentStepIndex < conversation.steps.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
    } else {
      setPhase('summary');
    }
  };

  const renderProfilePhase = () => (
    <div className="mx-auto w-full max-w-xl rounded-3xl bg-white/90 p-8 shadow-xl backdrop-blur-lg">
      <h1 className="text-3xl font-extrabold text-slate-900">Daily Hebrew Adventure</h1>
      <p className="mt-2 text-slate-600">
        Set up your player profile to begin your first guided conversation.
      </p>

      <div className="mt-8 space-y-6">
        <label className="block">
          <span className="text-sm font-semibold uppercase tracking-wide text-slate-600">Player name</span>
          <input
            type="text"
            value={profile.name}
            onChange={(event) => handleProfileChange('name', event.target.value)}
            placeholder="Type your name"
            className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2 text-lg text-slate-900 shadow-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-300"
          />
        </label>

        <label className="block">
          <span className="text-sm font-semibold uppercase tracking-wide text-slate-600">Pronoun style</span>
          <select
            value={profile.gender}
            onChange={(event) =>
              handleProfileChange('gender', event.target.value as GenderPresentation)
            }
            className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2 text-lg text-slate-900 shadow-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-300"
          >
            {genderOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="text-sm font-semibold uppercase tracking-wide text-slate-600">Experience level</span>
          <select
            value={profile.level}
            onChange={(event) =>
              handleProfileChange('level', event.target.value as PlayerLevel)
            }
            className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2 text-lg text-slate-900 shadow-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-300"
          >
            {levelOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <button
          type="button"
          onClick={handleStartGame}
          className="w-full rounded-xl bg-emerald-500 px-4 py-3 text-lg font-semibold text-white shadow-lg transition hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2"
        >
          Begin adventure
        </button>
      </div>
    </div>
  );

  const renderIntroPhase = () => (
    <div className="mx-auto w-full max-w-3xl rounded-3xl bg-white/90 p-10 text-center shadow-xl backdrop-blur-lg">
      <p className="text-sm uppercase tracking-[0.3em] text-slate-500">{conversation.location}</p>
      <h2 className="mt-3 text-4xl font-black text-slate-900">{conversation.title}</h2>
      <p className="mt-6 text-lg leading-relaxed text-slate-700">{conversation.intro}</p>
      <button
        type="button"
        onClick={handleEnterScene}
        className="mt-8 inline-flex items-center justify-center rounded-xl bg-emerald-500 px-6 py-3 text-lg font-semibold text-white shadow-lg transition hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2"
      >
        Enter the scene
      </button>
    </div>
  );

  const renderPlayPhase = () => (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 rounded-3xl bg-white/90 p-10 shadow-xl backdrop-blur-lg">
      <div>
        <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Scene</p>
        <h2 className="text-3xl font-black text-slate-900">{conversation.title}</h2>
        <p className="mt-2 text-slate-600">{currentStep.narration}</p>
        <p className="mt-2 text-sm font-semibold text-emerald-600">
          Sentence {currentStepIndex + 1} of {conversation.steps.length}
        </p>
      </div>

      <section className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-6 dark:border-slate-700 dark:bg-slate-900/70">
        <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Hebrew Conversation</p>
        <div
          className="flex flex-row-reverse flex-wrap justify-end gap-3 text-2xl font-bold text-slate-900"
          dir="rtl"
        >
          {currentStep.prompt.map((word) => (
            <span
              key={word.id}
              className="rounded-lg bg-transparent px-4 py-2 text-right"
              title={word.translation}
            >
              {word.text}
            </span>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Build your reply</p>
        <div className="flex flex-wrap gap-4">
          {slots.map((wordId, index) => {
            const word = wordId ? wordLookup.get(wordId) : null;
            const state = feedback[index];

            return (
              <div
                key={`slot-${index}`}
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => handleDropOnSlot(index, event)}
                className={`relative flex min-h-[64px] min-w-[140px] items-center justify-center rounded-2xl border-2 border-dashed border-emerald-200 bg-white/70 px-4 py-3 text-xl font-semibold text-slate-900 transition hover:border-emerald-400 ${
                  state === true
                    ? 'border-solid border-emerald-400 bg-emerald-50'
                    : state === false
                      ? 'border-solid border-rose-400 bg-rose-50'
                      : ''
                }`}
              >
                {word ? (
                  <div
                    className="flex items-center gap-2"
                    draggable
                    onDragStart={handleDragStartFromSlot(word.id, index)}
                    title={word.translation}
                  >
                    <span>{word.text}</span>
                    {state !== null && (
                      <span className="text-lg">{state ? '✅' : '❌'}</span>
                    )}
                  </div>
                ) : (
                  <span className="text-base font-medium text-slate-400">Drop word here</span>
                )}
              </div>
            );
          })}
        </div>
        {error ? <p className="text-sm font-semibold text-rose-600">{error}</p> : null}
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Word bank</p>
          <p className="text-xs text-slate-400">Drag a placed word back here to remove it.</p>
        </div>
        <div
          className="flex min-h-[84px] flex-wrap gap-3 rounded-2xl border border-dashed border-slate-300 bg-slate-100/70 p-4"
          onDragOver={(event) => event.preventDefault()}
          onDrop={handleDropToBank}
        >
          {availableWords.length === 0 ? (
            <p className="text-base font-medium text-slate-400">All words are placed above.</p>
          ) : (
            availableWords.map((word) => (
              <WordToken
                key={word.id}
                word={word}
                onDragStart={handleDragStartFromBank(word.id)}
                showTranslationBelow={profile.level === 'beginner'}
              />
            ))
          )}
        </div>
      </section>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={handleSubmit}
          className="inline-flex items-center justify-center rounded-xl bg-emerald-500 px-6 py-3 text-lg font-semibold text-white shadow-lg transition hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-slate-400"
          disabled={stepSolved}
        >
          Submit response
        </button>
        {stepSolved ? (
          <button
            type="button"
            onClick={handleNextStep}
            className="inline-flex items-center justify-center rounded-xl border border-emerald-400 px-6 py-3 text-lg font-semibold text-emerald-700 transition hover:bg-emerald-50"
          >
            {currentStepIndex === conversation.steps.length - 1
              ? 'View conversation summary'
              : 'Next sentence'}
          </button>
        ) : null}
      </div>
    </div>
  );

  const renderSummaryPhase = () => (
    <div className="mx-auto w-full max-w-3xl rounded-3xl bg-white/90 p-10 text-center shadow-xl backdrop-blur-lg">
      <h2 className="text-4xl font-black text-slate-900">Conversation complete</h2>
      <p className="mt-4 text-lg text-slate-700">{conversation.outro}</p>

      <div className="mt-8 grid grid-cols-1 gap-6 text-left sm:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Sentences cleared</p>
          <p className="mt-2 text-3xl font-black text-slate-900">{stats.stepsCompleted}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Words placed correctly</p>
          <p className="mt-2 text-3xl font-black text-slate-900">{stats.wordsCorrect}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Unique words learned</p>
          <p className="mt-2 text-3xl font-black text-slate-900">{uniqueWordCount}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Submission attempts</p>
          <p className="mt-2 text-3xl font-black text-slate-900">{stats.attempts}</p>
        </div>
      </div>

      <button
        type="button"
        onClick={() => {
          setPhase('profile');
          setCurrentStepIndex(0);
          setStats({ attempts: 0, stepsCompleted: 0, wordsCorrect: 0 });
          uniqueWordsRef.current = new Set();
          setUniqueWordCount(0);
        }}
        className="mt-10 inline-flex items-center justify-center rounded-xl bg-emerald-500 px-6 py-3 text-lg font-semibold text-white shadow-lg transition hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2"
      >
        Start a new run
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 text-slate-900 sm:p-12">
      <main className="mx-auto flex min-h-[80vh] max-w-6xl items-center justify-center">
        {phase === 'profile' && renderProfilePhase()}
        {phase === 'intro' && renderIntroPhase()}
        {phase === 'play' && currentStep && renderPlayPhase()}
        {phase === 'summary' && renderSummaryPhase()}
      </main>
    </div>
  );
}
