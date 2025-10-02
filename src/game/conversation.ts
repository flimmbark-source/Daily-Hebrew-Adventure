export type PromptWord = {
  id: string;
  text: string;
  translation: string;
};

export type ResponseWord = {
  id: string;
  text: string;
  translation: string;
};

export type ConversationStep = {
  id: string;
  prompt: PromptWord[];
  responseWordIds: string[];
  wordBank: ResponseWord[];
  narration: string;
};

export type Conversation = {
  id: string;
  title: string;
  location: string;
  intro: string;
  outro: string;
  steps: ConversationStep[];
};

export const beginnerCafeConversation: Conversation = {
  id: 'beginner-cafe',
  title: 'Morning at the Cafe',
  location: 'Neighborhood Cafe',
  intro:
    'You step into the small neighborhood cafe. The smell of fresh pastry and roasted coffee greets you as the barista smiles and begins a friendly chat.',
  outro:
    'Conversation complete! You leave the cafe with a smile, feeling more confident about responding in Hebrew during small talk.',
  steps: [
    {
      id: 'greeting',
      narration: 'The barista greets you warmly as you reach the counter.',
      prompt: [
        { id: 'p1', text: 'שלום!', translation: 'Hello!' },
        { id: 'p2', text: 'איך', translation: 'how' },
        { id: 'p3', text: 'אתה', translation: 'you (masc.)' },
        { id: 'p4', text: 'מרגיש', translation: 'feel (masc.)' },
        { id: 'p5', text: 'היום?', translation: 'today?' },
      ],
      responseWordIds: ['ani', 'margish', 'metsuyan', 'toda'],
      wordBank: [
        { id: 'ani', text: 'אני', translation: 'I' },
        { id: 'margish', text: 'מרגיש', translation: 'feel (masc.)' },
        { id: 'metsuyan', text: 'מצוין', translation: 'excellent' },
        { id: 'toda', text: 'תודה', translation: 'thank you' },
        { id: 'shavua', text: 'שבוע', translation: 'week' },
        { id: 'shalomAgain', text: 'שלום', translation: 'peace/hello' },
      ],
    },
    {
      id: 'order',
      narration: 'After chatting, the barista nods toward the menu board and asks what you would like.',
      prompt: [
        { id: 'p6', text: 'מה', translation: 'what' },
        { id: 'p7', text: 'תרצה', translation: 'would you like (masc.)' },
        { id: 'p8', text: 'לשתות?', translation: 'to drink?' },
      ],
      responseWordIds: ['ani', 'rotse', 'kafe', 'im', 'halav'],
      wordBank: [
        { id: 'ani', text: 'אני', translation: 'I' },
        { id: 'rotse', text: 'רוצה', translation: 'want (masc.)' },
        { id: 'rotza', text: 'רוצה', translation: 'want (fem.)' },
        { id: 'kafe', text: 'קפה', translation: 'coffee' },
        { id: 'im', text: 'עם', translation: 'with' },
        { id: 'halav', text: 'חלב', translation: 'milk' },
        { id: 'mayim', text: 'מים', translation: 'water' },
        { id: 'lechem', text: 'לחם', translation: 'bread' },
      ],
    },
    {
      id: 'closing',
      narration: 'The barista prepares your drink and hands it over with a friendly grin.',
      prompt: [
        { id: 'p9', text: 'הנה', translation: 'here is' },
        { id: 'p10', text: 'הקפה', translation: 'the coffee' },
        { id: 'p11', text: 'שלך!', translation: 'yours!' },
      ],
      responseWordIds: ['todaraba', 'yafe', 'meod'],
      wordBank: [
        { id: 'todaraba', text: 'תודה רבה', translation: 'thank you very much' },
        { id: 'yafe', text: 'יפה', translation: 'lovely' },
        { id: 'meod', text: 'מאוד', translation: 'very' },
        { id: 'lehitraot', text: 'להתראות', translation: 'see you' },
        { id: 'boker', text: 'בוקר', translation: 'morning' },
      ],
    },
  ],
};
