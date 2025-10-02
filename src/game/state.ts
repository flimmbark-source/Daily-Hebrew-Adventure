import { create } from 'zustand';

import type { Scene, SceneNode } from '../scenes/types';
import cafeScene from '../scenes/cafe.json';

const cafe = cafeScene as Scene;

const scenes: Record<string, Scene> = {
  [cafe.id]: cafe,
};

type GameState = {
  sceneId: string | null;
  nodeId: string | null;
  points: number;
  wordsLearned: string[];
  scenes: Record<string, Scene>;
  startScene: (sceneId: string) => void;
  reset: () => void;
};

export const useGameState = create<GameState>((set) => ({
  sceneId: null,
  nodeId: null,
  points: 0,
  wordsLearned: [],
  scenes,
  startScene: (sceneId) => {
    const scene = scenes[sceneId];
    if (!scene) {
      console.warn(`Scene with id "${sceneId}" not found.`);
      return;
    }

    set({
      sceneId,
      nodeId: scene.startingNode,
      points: 0,
      wordsLearned: [],
    });
  },
  reset: () =>
    set({
      sceneId: null,
      nodeId: null,
      points: 0,
      wordsLearned: [],
    }),
}));

export const selectCurrentScene = (state: GameState): Scene | null => {
  if (!state.sceneId) {
    return null;
  }

  return state.scenes[state.sceneId] ?? null;
};

export const selectCurrentNode = (state: GameState): SceneNode | null => {
  const scene = selectCurrentScene(state);
  if (!scene || !state.nodeId) {
    return null;
  }

  return scene.nodes[state.nodeId] ?? null;
};
