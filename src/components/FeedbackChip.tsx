import type { PlayerChoice } from '../scenes/types';

type FeedbackChipProps = {
  evaluation: PlayerChoice['eval'];
  message: string;
};

const styles: Record<PlayerChoice['eval'], string> = {
  good: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
  ok: 'bg-amber-100 text-amber-900 border border-amber-200',
  wrong: 'bg-rose-100 text-rose-800 border border-rose-200',
};

const icons: Record<PlayerChoice['eval'], string> = {
  good: '✨',
  ok: '👍',
  wrong: '🤔',
};

function FeedbackChip({ evaluation, message }: FeedbackChipProps) {
  return (
    <span
      className={`inline-flex items-center gap-2 self-end rounded-full px-3 py-1 text-sm font-medium shadow-sm ${styles[evaluation]}`}
      dir="rtl"
      lang="he"
    >
      <span aria-hidden="true">{icons[evaluation]}</span>
      {message}
    </span>
  );
}

export default FeedbackChip;
