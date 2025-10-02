import type { FC } from 'react';

type ReviewTrayItem = {
  itemId: string;
  label: string;
  ease: number;
  nextDue: number;
  isDue: boolean;
  averageQuality: number | null;
  rating?: number;
};

type ReviewTrayProps = {
  items: ReviewTrayItem[];
  onRate: (itemId: string, quality: number) => void;
};

const reviewOptions: { label: string; quality: number; description: string }[] = [
  { label: 'Forgot', quality: 2, description: "I couldn't recall it." },
  { label: 'Hesitant', quality: 3, description: 'Needed a moment to remember.' },
  { label: 'Good', quality: 4, description: 'Remembered with light effort.' },
  { label: 'Easy', quality: 5, description: 'Instant recall.' },
];

const formatRelativeTime = (target: number): string => {
  const now = Date.now();
  const diffMs = target - now;
  const absMs = Math.abs(diffMs);

  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (absMs < minute) {
    return 'now';
  }

  if (absMs < hour) {
    const minutes = Math.round(absMs / minute);
    return diffMs >= 0 ? `in ${minutes} minute${minutes === 1 ? '' : 's'}` : `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
  }

  if (absMs < day) {
    const hours = Math.round(absMs / hour);
    return diffMs >= 0 ? `in ${hours} hour${hours === 1 ? '' : 's'}` : `${hours} hour${hours === 1 ? '' : 's'} ago`;
  }

  const days = Math.round(absMs / day);
  return diffMs >= 0 ? `in ${days} day${days === 1 ? '' : 's'}` : `${days} day${days === 1 ? '' : 's'} ago`;
};

export const ReviewTray: FC<ReviewTrayProps> = ({ items, onRate }) => (
  <ul className="mt-3 space-y-3">
    {items.map((item) => {
      const hasRating = typeof item.rating === 'number';
      const statusLabel = item.isDue ? 'Due now' : formatRelativeTime(item.nextDue);
      const averageQuality = item.averageQuality ?? undefined;

      return (
        <li
          key={item.itemId}
          className="rounded-xl border border-emerald-100 bg-white/80 p-4 shadow-sm"
        >
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <span dir="rtl" lang="he" className="text-lg font-semibold text-emerald-800">
                {item.label}
              </span>
              <span className={`text-xs font-semibold ${item.isDue ? 'text-rose-600' : 'text-slate-500'}`}>
                {statusLabel}
              </span>
            </div>
            <div className="flex flex-wrap gap-3 text-xs text-slate-500">
              <span>Ease {item.ease.toFixed(2)}</span>
              {averageQuality !== undefined && (
                <span>
                  Avg quality {averageQuality.toFixed(1)}
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {reviewOptions.map((option) => (
                <button
                  key={option.quality}
                  type="button"
                  onClick={() => onRate(item.itemId, option.quality)}
                  className="flex-1 min-w-[120px] rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-800 shadow-sm transition hover:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                  title={option.description}
                  disabled={hasRating}
                >
                  {option.label}
                </button>
              ))}
            </div>
            {hasRating && (
              <p className="text-xs font-medium text-emerald-600">
                Next review {formatRelativeTime(item.nextDue)}
              </p>
            )}
          </div>
        </li>
      );
    })}
  </ul>
);
