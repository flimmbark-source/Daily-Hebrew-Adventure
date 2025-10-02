export type DialogueLine = {
  speaker: string;
  text: string;
};

export type GenderPresentation = 'masculine' | 'feminine' | 'neutral';

export type PlayerLevel = 'beginner' | 'advanced';

export type ChoiceVariant = {
  text?: string;
  transliteration?: string;
  eval?: 'good' | 'ok' | 'wrong';
  feedback?: string;
};

export type PlayerChoice = {
  id: string;
  text: string;
  transliteration?: string;
  conceptId?: string;
  nextNodeId: string;
  eval: 'good' | 'ok' | 'wrong';
  feedback: string;
  reward?: number;
  wordsLearned?: string[];
  variants?: Partial<Record<GenderPresentation, ChoiceVariant>> & {
    neutral?: ChoiceVariant;
  };
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
