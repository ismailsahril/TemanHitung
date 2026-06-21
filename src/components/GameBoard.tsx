import React, { useState, useEffect, useRef, useCallback } from 'react';
import { m, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Award, Lightbulb, X } from 'lucide-react';
import { SessionState, SessionAction } from '../types';
import { useTranslation } from '../hooks/useTranslation';
import { formatNumber, verifyAnswer } from '../utils/mathEngine';
import { playCorrectSound, playWrongSound } from '../utils/soundEngine';
import { triggerHaptic } from '../utils/hapticEngine';
import { ImpactStyle } from '@capacitor/haptics';
import ProgressBar from './ProgressBar';
import NumPad from './NumPad';
import FeedbackOverlay from './FeedbackOverlay';

interface GameBoardProps {
  state: SessionState;
  dispatch: React.Dispatch<SessionAction>;
}

/**
 * GameBoard component representing the standard mental math practice screen.
 * Displays questions, tracks time, gathers inputs via NumPad, and shows feedback overlay.
 */
export const GameBoard: React.FC<GameBoardProps> = ({ state, dispatch }) => {
  const { t } = useTranslation();
  const { questions, currentIndex, history, score, settings } = state;

  const currentQuestion = questions[currentIndex];
  const totalQuestions = questions.length;
  const isShowingFeedback = history.length === currentIndex + 1;
  const lastAnswered = isShowingFeedback ? history[currentIndex] : null;

  // Local state for typed input
  const [typedAnswer, setTypedAnswer] = useState<string>('');
  
  // Keep track of time left locally
  const [elapsed, setElapsed] = useState(0);

  // Automatically show quick tip if no action for 7 seconds
  const [showTipDueToInactivity, setShowTipDueToInactivity] = useState(false);
  const [showTipModal, setShowTipModal] = useState(false);

  // Focus ref for screen reader accessibility
  const firstNumpadRef = useRef<HTMLDivElement>(null);

  // Reset input, elapsed timer, inactivity tip state, and modal state for a new question
  useEffect(() => {
    if (!isShowingFeedback) {
      setTypedAnswer('');
      setElapsed(0);
      setShowTipDueToInactivity(false);
      setShowTipModal(false);
      
      // Accessibility focus management: set focus to container
      if (firstNumpadRef.current) {
        firstNumpadRef.current.focus();
      }
    }
  }, [currentIndex, isShowingFeedback]);

  // Idle timer to show quick tips after 7 seconds of no action
  useEffect(() => {
    if (isShowingFeedback || state.phase !== 'playing' || settings.autoShowTip) {
      return;
    }

    // Reset showing tip flag if user starts acting again
    setShowTipDueToInactivity(false);

    const idleTimeout = setTimeout(() => {
      setShowTipDueToInactivity(true);
    }, 7000); // 7 seconds of inactivity

    return () => clearTimeout(idleTimeout);
  }, [typedAnswer, currentIndex, isShowingFeedback, state.phase, settings.autoShowTip]);

  // Sync elapsed timer
  useEffect(() => {
    if (settings.timerPerQuestion === 0 || isShowingFeedback || state.phase !== 'playing') {
      return;
    }

    const interval = setInterval(() => {
      setElapsed((prev) => {
        const next = prev + 1;
        // TICK_TIMER dispatched to force React render cycle & synchronize layout
        dispatch({ type: 'TICK_TIMER' });
        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [settings.timerPerQuestion, isShowingFeedback, state.phase, dispatch]);

  const timeLeft = settings.timerPerQuestion > 0
    ? Math.max(0, settings.timerPerQuestion - elapsed)
    : 0;

  // Input Sanitizer
  const sanitizeInput = (raw: string): number | null => {
    const cleaned = raw.replace(/[^0-9.\-]/g, '');
    const parsed = parseFloat(cleaned);
    if (isNaN(parsed) || !isFinite(parsed)) return null;
    if (Math.abs(parsed) > 99999) return null; // Max answer threshold guard
    return parsed;
  };

  // Submit Answer Trigger
  const handleSubmitAnswer = useCallback((answerStr: string | null): void => {
    if (isShowingFeedback) return;

    const numericAnswer = answerStr !== null ? sanitizeInput(answerStr) : null;
    
    // Determine correctness prior to reducer updates for prompt sound/haptics execution
    const isCorrect = numericAnswer !== null && verifyAnswer(currentQuestion, numericAnswer);

    // Audio & Haptic Feedback Actions
    if (isCorrect) {
      playCorrectSound(settings.soundEnabled);
      triggerHaptic(ImpactStyle.Medium, settings.hapticEnabled);
    } else {
      playWrongSound(settings.soundEnabled);
      triggerHaptic(ImpactStyle.Heavy, settings.hapticEnabled);
    }

    dispatch({ 
      type: 'SUBMIT_ANSWER', 
      payload: { answer: numericAnswer } 
    });

    // Pause for 1200ms to allow viewing Feedback overlay, then auto-advance
    setTimeout(() => {
      if (currentIndex === totalQuestions - 1) {
        dispatch({ type: 'END_SESSION' });
      } else {
        dispatch({ type: 'NEXT_QUESTION' });
      }
    }, 1200);

  }, [currentIndex, totalQuestions, currentQuestion, isShowingFeedback, settings.soundEnabled, settings.hapticEnabled, dispatch]);

  // Handle Timeout
  useEffect(() => {
    if (settings.timerPerQuestion > 0 && timeLeft === 0 && !isShowingFeedback && state.phase === 'playing') {
      handleSubmitAnswer(null);
    }
  }, [timeLeft, settings.timerPerQuestion, isShowingFeedback, state.phase, handleSubmitAnswer]);

  // Real-time localized format styling for typed input
  const formatTypedAnswer = (raw: string, format: 'id' | 'en'): string => {
    if (!raw) return t('game.placeholder');
    const isNegative = raw.startsWith('-');
    const clean = raw.replace('-', '');
    const parts = clean.split('.');
    const integerPart = parts[0];
    const decimalPart = parts[1];

    let formattedInt = '';
    const parsedInt = parseInt(integerPart, 10);
    if (!isNaN(parsedInt)) {
      formattedInt = format === 'id'
        ? parsedInt.toLocaleString('id-ID')
        : parsedInt.toLocaleString('en-US');
    } else {
      formattedInt = integerPart;
    }

    const separator = format === 'id' ? ',' : '.';
    const hasDecimalPoint = raw.includes('.');

    return `${isNegative ? '-' : ''}${formattedInt}${hasDecimalPoint ? separator : ''}${decimalPart !== undefined ? decimalPart : ''}`;
  };

  // Keyboard handlers passed to NumPad
  const handleInput = useCallback((digit: string): void => {
    setTypedAnswer((prev) => {
      if (digit === '.' && prev.includes('.')) return prev;
      const digitsOnly = prev.replace(/[^0-9]/g, '');
      if (digitsOnly.length >= 6 && digit !== '.') return prev;
      if (prev === '0' && digit !== '.') return digit;
      return prev + digit;
    });
  }, []);

  const handleDelete = useCallback(() => {
    setTypedAnswer((prev) => {
      if (prev.length <= 1) return '';
      return prev.slice(0, -1);
    });
  }, []);

  const handleToggleSign = useCallback(() => {
    setTypedAnswer((prev) => {
      if (prev.startsWith('-')) {
        return prev.substring(1);
      } else {
        return '-' + prev;
      }
    });
  }, []);

  // Format expression based on settings locale
  const getExpr = (): string => {
    if (!currentQuestion) return '';
    const formattedA = formatNumber(currentQuestion.operandA, settings.numberFormat);
    const formattedB = formatNumber(currentQuestion.operandB, settings.numberFormat);
    let opSign = '+';
    if (currentQuestion.operation === 'subtraction') opSign = '−';
    else if (currentQuestion.operation === 'multiplication') opSign = '×';
    else if (currentQuestion.operation === 'division') opSign = '÷';

    return `${formattedA} ${opSign} ${formattedB} =`;
  };

  // Shake and flash animation conditions
  const shouldShake = isShowingFeedback && lastAnswered !== null && !lastAnswered.isCorrect;
  const shouldFlashCorrect = isShowingFeedback && lastAnswered !== null && lastAnswered.isCorrect;
  const shouldFlashWrong = isShowingFeedback && lastAnswered !== null && !lastAnswered.isCorrect;

  return (
    <m.div 
      ref={firstNumpadRef}
      tabIndex={0}
      animate={shouldShake ? { x: [-10, 10, -8, 8, -5, 5, 0] } : { x: 0 }}
      transition={{ duration: 0.4 }}
      className="flex-1 flex flex-col justify-between bg-[#fafafc] dark:bg-[#121218] p-5 relative overflow-hidden focus:outline-none font-gacha"
      style={{ fontSize: 'calc(1rem * var(--font-scale, 1))' }}
    >
      {/* Flash Overlays */}
      <AnimatePresence>
        {shouldFlashCorrect && (
          <m.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.4, 0] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="absolute inset-0 bg-emerald-500 pointer-events-none z-50"
          />
        )}
        {shouldFlashWrong && (
          <m.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.5, 0] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="absolute inset-0 bg-red-600 pointer-events-none z-50"
          />
        )}
      </AnimatePresence>

      {/* 1. Header */}
      <header className="flex-shrink-0 flex items-center justify-between gap-4 mb-4">
        <m.button
          type="button"
          onClick={() => dispatch({ type: 'BACK_TO_MENU' })}
          whileTap={{ scale: 0.95 }}
          className="btn-icon"
          aria-label={t('settings.backButton')}
        >
          <ChevronLeft className="w-6 h-6" />
        </m.button>
        
        {/* Progress Dots/Segments */}
        <ProgressBar current={currentIndex} total={totalQuestions} history={history} />

        {/* Score Badge styled as a Golden Emblem */}
        <div className="coins-badge">
          <Award className="w-4 h-4 text-amber-500" />
          <span className="tabular-nums">
            {score}
          </span>
        </div>
      </header>

      {/* 2. Timer Bar */}
      {settings.timerPerQuestion > 0 && (
        <div className="w-full bg-neutral-200 dark:bg-neutral-800 h-2 rounded-full overflow-hidden border border-neutral-300/40 dark:border-neutral-700/50 mb-4 shadow-inner">
          <div 
            className={`h-full transition-all duration-1000 bg-gradient-to-r ${
              timeLeft <= 3 
                ? 'from-red-500 to-rose-600 shadow-[0_0_8px_rgba(239,68,68,0.5)] animate-pulse' 
                : timeLeft <= settings.timerPerQuestion * 0.5 
                  ? 'from-amber-400 to-yellow-500' 
                  : 'from-emerald-400 to-teal-500'
            }`}
            style={{ width: `${(timeLeft / settings.timerPerQuestion) * 100}%` }}
          />
        </div>
      )}

      {/* 3. Question Card with exit-left / enter-right motion */}
      <div className="flex-1 flex items-center justify-center my-2 min-h-[90px]">
        <AnimatePresence mode="wait">
          <m.div
            key={currentIndex}
            initial={{ opacity: 0, x: settings.reduceAnimations ? 0 : 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: settings.reduceAnimations ? 0 : -50 }}
            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
            className="relative text-center bg-white dark:bg-[#1a1a24] border border-neutral-300/50 dark:border-[#d4af37]/25 rounded-[20px] px-10 py-6 shadow-sm min-w-[200px]"
          >
            <span className="text-[34px] sm:text-[40px] font-bold text-[#1d1d1f] dark:text-white tracking-wide font-fantasy">
              {getExpr()}
            </span>

            {/* Floating Bulb Trigger inside Question Card */}
            <AnimatePresence>
              {currentQuestion && (settings.autoShowTip || showTipDueToInactivity) && (
                <m.button
                  key="tips-btn"
                  type="button"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowTipModal(true)}
                  className="absolute top-2.5 right-2.5 w-8 h-8 bg-amber-500/10 hover:bg-amber-500/20 dark:bg-amber-500/15 dark:hover:bg-amber-500/25 border border-amber-500/20 rounded-full flex items-center justify-center text-amber-500 transition-all cursor-pointer"
                  aria-label={t('game.tipToggle')}
                >
                  <Lightbulb className="w-4 h-4 animate-pulse" />
                </m.button>
              )}
            </AnimatePresence>
          </m.div>
        </AnimatePresence>
      </div>

      {/* 4. Typed Answer Display */}
      <div className="w-full max-w-[340px] mx-auto mb-4 select-none">
        <div className="input-display w-full">
          <span className={`text-[28px] font-bold tracking-tight tabular-nums font-fantasy ${typedAnswer ? 'text-amber-600 dark:text-amber-400' : 'text-neutral-400 dark:text-neutral-600'}`}>
            {formatTypedAnswer(typedAnswer, settings.numberFormat)}
          </span>
        </div>
      </div>

      {/* 5. Strategy Helper Bottom Sheet Modal */}
      <AnimatePresence>
        {showTipModal && currentQuestion && (
          <>
            {/* Backdrop */}
            <m.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowTipModal(false)}
              className="absolute inset-0 bg-black z-40"
            />
            {/* Modal Sheet */}
            <m.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="absolute bottom-0 inset-x-0 bg-white dark:bg-[#1a1a24] border-t border-neutral-200 dark:border-[#d4af37]/25 rounded-t-[20px] p-5 pb-6 z-50 flex flex-col space-y-4 max-h-[80%] overflow-y-auto select-none"
            >
              {/* Drag Handle Indicator */}
              <div className="w-10 h-1.5 bg-gray-200 dark:bg-neutral-700 rounded-full mx-auto" />
              
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-amber-500">
                  <Lightbulb className="w-5 h-5" />
                  <h3 className="text-base font-bold text-[#1d1d1f] dark:text-white font-fantasy">
                    {t('game.tipToggle')}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowTipModal(false)}
                  className="p-1.5 rounded-full bg-[#f5f5f7] dark:bg-[#2c2c2e] text-[#1d1d1f] dark:text-white transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Tip Content Box */}
              <div className="bg-amber-500/5 dark:bg-amber-500/5 border border-amber-500/20 dark:border-amber-500/20 rounded-[14px] p-4 text-[13px] text-ink-muted leading-relaxed whitespace-pre-line font-medium text-left">
                {currentQuestion.quickTip}
              </div>

              {/* Close Button */}
              <button
                type="button"
                onClick={() => setShowTipModal(false)}
                className="w-full py-3 rounded-[14px] text-sm font-bold text-white bg-amber-500 hover:bg-amber-600 shadow-[0_4px_15px_rgba(245,158,11,0.2)] text-center font-fantasy"
              >
                {t('warung.tipClose')}
              </button>
            </m.div>
          </>
        )}
      </AnimatePresence>

      {/* 6. Keyboard Grid */}
      <div className="mb-4">
        <NumPad
          onInput={handleInput}
          onDelete={handleDelete}
          onToggleSign={handleToggleSign}
          disableSign={currentQuestion?.operation !== 'subtraction'} // Only allow signs for subtraction
          isDecimalMode={settings.numberFormat === 'id' || settings.numberFormat === 'en' ? state.config?.mode === 'decimal' : false}
          hapticEnabled={settings.hapticEnabled}
        />
      </div>

      {/* 7. Action Submit Button */}
      <m.button
        type="button"
        onClick={() => handleSubmitAnswer(typedAnswer)}
        disabled={!typedAnswer || isShowingFeedback}
        whileTap={typedAnswer && !isShowingFeedback ? { scale: 0.95 } : undefined}
        className="btn-primary"
      >
        {t('game.submitButton')}
      </m.button>

      {/* 8. Full-screen correctness overlay */}
      <FeedbackOverlay
         visible={isShowingFeedback}
         isCorrect={lastAnswered ? lastAnswered.isCorrect : false}
         correctAnswer={currentQuestion ? currentQuestion.correctAnswer : 0}
         userAnswer={lastAnswered ? lastAnswered.userAnswer : null}
         numberFormat={settings.numberFormat}
      />
    </m.div>
  );
};
export default GameBoard;
