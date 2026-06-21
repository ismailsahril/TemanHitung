import React, { useEffect, useRef } from 'react';
import { m, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation';
import { formatNumber } from '../utils/mathEngine';

interface FeedbackOverlayProps {
  visible: boolean;
  isCorrect: boolean;
  correctAnswer: number;
  userAnswer: number | null;
  numberFormat: 'id' | 'en';
}

/**
 * FeedbackOverlay component displaying correct/incorrect and timeout banners.
 * Uses backdrop blurs, scale spring animations, and theme-colored screens.
 */
export const FeedbackOverlay: React.FC<FeedbackOverlayProps> = ({
  visible,
  isCorrect,
  correctAnswer,
  userAnswer,
  numberFormat,
}) => {
  const { t } = useTranslation();
  const overlayRef = useRef<HTMLDivElement>(null);

  // Trap focus inside the overlay when it's open for screen reader support
  useEffect(() => {
    if (visible && overlayRef.current) {
      const focusableElements = overlayRef.current.querySelectorAll('button, [tabindex="0"]');
      if (focusableElements.length > 0) {
        (focusableElements[0] as HTMLElement).focus();
      }
    }
  }, [visible]);

  const formattedCorrectAnswer = formatNumber(correctAnswer, numberFormat);

  // Determine feedback message type
  const isTimeout = userAnswer === null;

  return (
    <AnimatePresence>
      {visible && (
        <m.div
          ref={overlayRef}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className={`absolute inset-0 z-40 flex flex-col items-center justify-center p-6 text-center backdrop-blur-sm transition-colors duration-200 ${
            isCorrect
              ? 'bg-[#16a34a]/95'
              : isTimeout
              ? 'bg-amber-500/95'
              : 'bg-[#dc2626]/95'
          }`}
          role="alert"
          aria-live="assertive"
          tabIndex={-1}
        >
          <m.div
            initial={{ scale: 0.8, y: 10 }}
            animate={{ 
              scale: 1, 
              y: 0,
              transition: { type: 'spring', damping: 18, stiffness: 200 } 
            }}
            exit={{ scale: 0.8, y: 10 }}
            className="flex flex-col items-center text-white"
          >
            {/* Status Icons */}
            {isCorrect ? (
              <CheckCircle2 className="w-20 h-20 mb-4" />
            ) : isTimeout ? (
              <AlertCircle className="w-20 h-20 mb-4" />
            ) : (
              <XCircle className="w-20 h-20 mb-4" />
            )}

            {/* Status Text Messages */}
            <h2 className="text-3xl font-semibold mb-2 tracking-tight select-none">
              {isCorrect
                ? t('feedback.correct')
                : isTimeout
                ? t('game.timeUp')
                : t('feedback.wrong')}
            </h2>

            {/* Subtext: Correct Answer Reveal */}
            {!isCorrect && (
              <p className="text-[14px] font-normal bg-white/10 px-4 py-2 rounded-full border border-white/20 mt-1 select-none">
                {t('feedback.correctAnswer', { answer: formattedCorrectAnswer })}
              </p>
            )}
          </m.div>
        </m.div>
      )}
    </AnimatePresence>
  );
};
export default FeedbackOverlay;
