import { selectCurrentNode, useGameState } from './game/state';

const CAFE_SCENE_ID = 'cafe';

function App() {
  const sceneId = useGameState((state) => state.sceneId);
  const startScene = useGameState((state) => state.startScene);
  const currentNode = useGameState(selectCurrentNode);

  const hasStarted = Boolean(sceneId);

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
            <h2 className="text-xl font-semibold text-emerald-700">
              {currentNode.npc.speaker}
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-slate-700">
              {currentNode.npc.text}
            </p>
          </section>
        )}
      </main>
    </div>
  );
}

export default App;
