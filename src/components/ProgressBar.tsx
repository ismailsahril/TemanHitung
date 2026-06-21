import React from 'react';
import { AnsweredQuestion } from '../types';
import { useTranslation } from '../hooks/useTranslation';

interface ProgressBarProps {
  current: number; // 0-indexed
  total: number;
  history: AnsweredQuestion[];
}

/**
 * ProgressBar component displaying a horizontal indicator of segments.
 * Segments turn Green for correct answers, Red for incorrect, and Blue for active.
 */
export const ProgressBar: React.FC<ProgressBarProps> = React.memo(({ current, total, history }) => {
  const { t } = useTranslation();

  return (
    <div 
      className="w-full flex flex-col items-center space-y-1.5 px-1"
      role="progressbar"
      aria-label={t('game.questionOf', { current: current + 1, total })}
      aria-valuenow={current + 1}
      aria-valuemin={1}
      aria-valuemax={total}
    >
      {/* Progress Label */}
      <span className="text-[11px] font-semibold text-ink-muted uppercase tracking-wider select-none">
        {t('game.questionOf', { current: current + 1, total })}
      </span>

      {/* Segments container */}
      <div className="w-full flex items-center justify-between gap-1 h-1">
        {Array.from({ length: total }).map((_, idx) => {
          const isCompleted = idx < history.length;
          const isCurrent = idx === current;
          const answered = history[idx];

          let segmentClass = 'bg-[#e0e0e0] dark:bg-[#333333]';

          if (isCompleted && answered) {
            segmentClass = answered.isCorrect
              ? 'bg-[#16a34a]'
              : 'bg-[#dc2626]';
          } else if (isCurrent) {
            segmentClass = 'bg-[#0066cc] dark:bg-[#2997ff]';
          }

          return (
            <div
              key={idx}
              className={`flex-1 h-full rounded-full transition-all duration-300 ${segmentClass}`}
            />
          );
        })}
      </div>
    </div>
  );
});

ProgressBar.displayName = 'ProgressBar';
export default ProgressBar;
