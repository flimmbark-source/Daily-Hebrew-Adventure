import { create } from 'zustand';

import type {
  GenderPresentation,
  PlayerLevel,
  Scene,
  SceneNode,
} from '../scenes/types';
import cafeScene from '../scenes/cafe.json';

const cafe = cafeScene as Scene;

const scenes: Record<string, Scene> = {
  [cafe.id]: cafe,
};

type PlayerProfile = {
  genderPresentation: GenderPresentation;
  level: PlayerLevel;
};

type GameState = {
  sceneId: string | null;
  nodeId: string | null;
  points: number;
  wordsLearned: string[];
  scenes: Record<string, Scene>;
  profile: PlayerProfile;
  startScene: (sceneId: string) => void;
  goToNode: (nextNodeId: string, reward?: number, wordsLearned?: string[]) => void;
  reset: () => void;
  updateProfile: (updates: Partial<PlayerProfile>) => void;
};

export const useGameState = create<GameState>((set) => ({
  sceneId: null,
  nodeId: null,
  points: 0,
  wordsLearned: [],
  scenes,
  profile: {
    genderPresentation: 'feminine',
    level: 'beginner',
  },
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
  goToNode: (nextNodeId, reward = 0, newWords = []) =>
    set((state) => {
      if (!state.sceneId) {
        return state;
      }

      const scene = state.scenes[state.sceneId];
      if (!scene?.nodes[nextNodeId]) {
        console.warn(`Node with id "${nextNodeId}" not found in scene "${state.sceneId}".`);
        return state;
      }

      const uniqueWords = new Set(state.wordsLearned);
      for (const word of newWords) {
        uniqueWords.add(word);
      }

      return {
        ...state,
        nodeId: nextNodeId,
        points: state.points + reward,
        wordsLearned: Array.from(uniqueWords),
      };
    }),
  reset: () =>
    set({
      sceneId: null,
      nodeId: null,
      points: 0,
      wordsLearned: [],
    }),
  updateProfile: (updates) =>
    set((state) => ({
      profile: { ...state.profile, ...updates },
    })),
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
