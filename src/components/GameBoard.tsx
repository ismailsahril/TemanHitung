import React, { useState, useEffect, useRef, useCallback } from 'react';
import { m, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Award } from 'lucide-react';
import { SessionState, SessionAction } from '../types';
import { useTranslation } from '../hooks/useTranslation';
import { formatNumber, verifyAnswer } from '../utils/mathEngine';
import { playCorrectSound, playWrongSound } from '../utils/soundEngine';
import { triggerHaptic } from '../utils/hapticEngine';
import { ImpactStyle } from '@capacitor/haptics';
import ProgressBar from './ProgressBar';
import QuickTip from './QuickTip';
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

  // Focus ref for screen reader accessibility
  const firstNumpadRef = useRef<HTMLDivElement>(null);

  // Reset input and elapsed timer for a new question
  useEffect(() => {
    if (!isShowingFeedback) {
      setTypedAnswer('');
      setElapsed(0);
      
      // Accessibility focus management: set focus to container
      if (firstNumpadRef.current) {
        firstNumpadRef.current.focus();
      }
    }
  }, [currentIndex, isShowingFeedback]);

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
          className="min-h-[44px] min-w-[44px] p-2.5 flex items-center justify-center rounded-full bg-white dark:bg-[#1a1a24] hover:bg-neutral-100 dark:hover:bg-[#20202d] text-[#1d1d1f] dark:text-white transition border border-neutral-200 dark:border-[#d4af37]/20 shadow-sm"
          aria-label={t('settings.backButton')}
        >
          <ChevronLeft className="w-6 h-6" />
        </m.button>
        
        {/* Progress Dots/Segments */}
        <ProgressBar current={currentIndex} total={totalQuestions} history={history} />

        {/* Score Badge styled as a Golden Emblem */}
        <div className="bg-amber-500/10 dark:bg-[#d4af37]/15 border border-[#d4af37]/40 rounded-full px-3 py-1 flex items-center gap-1 shrink-0 font-fantasy text-amber-600 dark:text-[#d4af37] font-bold text-xs shadow-sm">
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
            className="text-center bg-white dark:bg-[#1a1a24] border border-neutral-300/50 dark:border-[#d4af37]/25 rounded-[20px] px-8 py-4 shadow-sm min-w-[200px]"
          >
            <span className="text-[34px] sm:text-[40px] font-bold text-[#1d1d1f] dark:text-white tracking-wide font-fantasy">
              {getExpr()}
            </span>
          </m.div>
        </AnimatePresence>
      </div>

      {/* 4. Typed Answer Calculator Display */}
      <div className="rpg-panel border border-neutral-200 dark:border-[#d4af37]/20 p-4 mb-4 text-center min-h-[64px] flex items-center justify-center bg-white dark:bg-[#1a1a24] shadow-inner">
        <span className={`text-[28px] font-bold tracking-tight tabular-nums font-fantasy ${typedAnswer ? 'text-amber-600 dark:text-amber-400' : 'text-neutral-400 dark:text-neutral-600'}`}>
          {formatTypedAnswer(typedAnswer, settings.numberFormat)}
        </span>
      </div>

      {/* 5. Strategy Helper Drawer */}
      <div className="mb-4">
        {currentQuestion && (
          <QuickTip 
            quickTip={currentQuestion.quickTip} 
            autoShowTip={settings.autoShowTip} 
          />
        )}
      </div>

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
        className={`w-full py-3 rounded-[14px] text-[17px] font-semibold text-white flex items-center justify-center min-h-[44px] transition-all ${
          typedAnswer && !isShowingFeedback
            ? 'bg-amber-500 hover:bg-amber-600 shadow-[0_4px_15px_rgba(245,158,11,0.35)]'
            : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-400 dark:text-neutral-600 border border-neutral-300 dark:border-neutral-700/50 cursor-not-allowed'
        }`}
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
