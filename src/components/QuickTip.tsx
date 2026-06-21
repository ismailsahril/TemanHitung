import React, { useState, useEffect } from 'react';
import { m, AnimatePresence } from 'framer-motion';
import { Lightbulb, ChevronDown, ChevronUp } from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation';

interface QuickTipProps {
  quickTip: string;
  autoShowTip: boolean;
}

/**
 * QuickTip component displaying a collapsible card containing step-by-step
 * mental math tricks or tips tailored for the current question.
 */
export const QuickTip: React.FC<QuickTipProps> = React.memo(({ quickTip, autoShowTip }) => {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(autoShowTip);

  // Sync expanded state whenever the tip content changes (new question shown)
  useEffect(() => {
    setIsExpanded(autoShowTip);
  }, [quickTip, autoShowTip]);

  return (
    <div className="w-full max-w-[340px] mx-auto border border-[#e0e0e0] dark:border-[#2a2a2c] rounded-[18px] overflow-hidden bg-[#f5f5f7] dark:bg-[#272729]">
      {/* Toggle Button Header */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-3 text-xs font-semibold text-[#1d1d1f] dark:text-white hover:bg-[#e8e8ed] dark:hover:bg-[#323236] transition min-h-[44px]"
        aria-expanded={isExpanded}
        aria-label={t('game.tipToggle')}
      >
        <span className="flex items-center gap-1.5 select-none">
          <Lightbulb className="w-4.5 h-4.5 text-[#0066cc] dark:text-[#2997ff]" />
          {t('game.tipToggle')}
        </span>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-ink-muted" />
        ) : (
          <ChevronDown className="w-4 h-4 text-ink-muted" />
        )}
      </button>

      {/* Collapsible Content */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <m.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
          >
            <div className="px-3.5 pb-3.5 pt-1 text-[13px] text-ink-muted leading-relaxed font-normal">
              {quickTip}
            </div>
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
});

QuickTip.displayName = 'QuickTip';
export default QuickTip;
