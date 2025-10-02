export type DialogueLine = {
  speaker: string;
  text: string;
};

export type PlayerChoice = {
  id: string;
  text: string;
  nextNodeId: string;
  eval: 'good' | 'ok' | 'wrong';
  feedback: string;
  reward?: number;
  wordsLearned?: string[];
};

export type SceneNode = {
  id: string;
  npc: DialogueLine;
  playerChoices: PlayerChoice[];
};

export type Scene = {
  id: string;
  name: string;
  description?: string;
  startingNode: string;
  nodes: Record<string, SceneNode>;
};
