import React, { useState, useEffect } from 'react';
import { m } from 'framer-motion';
import { RotateCcw, Home, HelpCircle, Check, X, Flame } from 'lucide-react';
import { SessionState, SessionAction } from '../types';
import { useTranslation } from '../hooks/useTranslation';
import { formatNumber } from '../utils/mathEngine';
import MathPet from './MathPet';
import { triggerHaptic } from '../utils/hapticEngine';
import { playCorrectSound } from '../utils/soundEngine';
import { ImpactStyle } from '@capacitor/haptics';

interface ScoreSummaryProps {
  state: SessionState;
  dispatch: React.Dispatch<SessionAction>;
  saveSessionResult: (
    operation: string,
    difficulty: string,
    score: number,
    outOf: number
  ) => Promise<{ isNewRecord: boolean; previousBest: number }>;
  feedPet: (expGained: number) => Promise<{ leveledUp: boolean; nextLevel: number }>;
}

/**
 * ScoreSummary component displaying results at the end of a training session.
 * Displays correct/wrong answers list, feeds the companion pet, and tracks records.
 */
export const ScoreSummary: React.FC<ScoreSummaryProps> = ({
  state,
  dispatch,
  saveSessionResult,
  feedPet,
}) => {
  const { t } = useTranslation();
  const { score, questions, history, settings, pet } = state;
  const total = questions.length;

  const [animatedScore, setAnimatedScore] = useState(0);
  const [isNewRecord, setIsNewRecord] = useState(false);
  const [previousBest, setPreviousBest] = useState<number | null>(null);
  const [isSaved, setIsSaved] = useState(false);

  // Companion pet states - users get a single feed opportunity (1 treat) per successful session
  const [treatsCount, setTreatsCount] = useState(score > 0 ? 1 : 0);
  const [petAnimationState, setPetAnimationState] = useState<'idle' | 'eating' | 'levelUp'>('idle');
  const [petSpeech, setPetSpeech] = useState<string>('');

  // Trigger score saving on session end
  useEffect(() => {
    async function save() {
      if (!state.config || isSaved) return;
      try {
        const result = await saveSessionResult(
          state.config.operation,
          state.config.difficulty,
          score,
          total
        );
        setIsNewRecord(result.isNewRecord);
        setPreviousBest(result.previousBest);
        setIsSaved(true);
      } catch (err) {
        const isDev = import.meta.env.DEV;
        if (isDev) {
          console.error('Failed to save score on summary screen mount:', err);
        }
      }
    }
    save();
  }, [state.config, score, total, saveSessionResult, isSaved]);

  // Set initial speech bubble
  useEffect(() => {
    setPetSpeech(getFeedbackMessage());
  }, []);

  const handleFeed = async (): Promise<void> => {
    if (treatsCount <= 0 || !pet.hasAdopted) return;

    triggerHaptic(ImpactStyle.Light, settings.hapticEnabled);
    playCorrectSound(settings.soundEnabled);

    setPetAnimationState('eating');
    setTreatsCount(prev => prev - 1);

    const isLastTreat = treatsCount === 1;
    const isPerfect = score === total;
    const expGained = 10;

    const { leveledUp, nextLevel } = await feedPet(expGained);
    dispatch({ type: 'FEED_PET', payload: { expGained } });

    if (leveledUp) {
      setTimeout(() => {
        setPetAnimationState('levelUp');
        triggerHaptic(ImpactStyle.Medium, settings.hapticEnabled);
        setPetSpeech(t('pet.levelUp', { name: pet.name, level: nextLevel }));
        setTimeout(() => {
          setPetAnimationState('idle');
        }, 1200);
      }, 800);
    } else {
      setTimeout(() => {
        setPetAnimationState('idle');
        if (isLastTreat && isPerfect) {
          setPetSpeech(t(`pet.${pet.type}Perfect`, { name: settings.userName || t('pet.defaultGreetingName') }));
        } else {
          setPetSpeech(t(`pet.${pet.type}Feed`, { name: settings.userName || t('pet.defaultGreetingName') }));
        }
      }, 800);
    }
  };

  // Score count-up animation
  useEffect(() => {
    if (score === 0) return;
    const duration = 600; // ms
    const stepTime = Math.abs(Math.floor(duration / score));
    let current = 0;

    const timer = setInterval(() => {
      current += 1;
      if (current >= score) {
        setAnimatedScore(score);
        clearInterval(timer);
      } else {
        setAnimatedScore(current);
      }
    }, Math.max(stepTime, 30));

    return () => clearInterval(timer);
  }, [score]);

  // Get localized performance feedback
  const getFeedbackMessage = (): string => {
    const ratio = total > 0 ? score / total : 0;
    if (ratio === 1) return t('summary.perfect');
    if (ratio >= 0.8) return t('summary.great');
    if (ratio >= 0.6) return t('summary.good');
    if (ratio >= 0.4) return t('summary.ok');
    return t('summary.keep');
  };

  const handleRetry = (): void => {
    if (state.config) {
      dispatch({ type: 'START_SESSION', payload: state.config });
    }
  };

  const handleGoMenu = (): void => {
    dispatch({ type: 'RESTART' });
  };

  const wrongAnswers = history.filter((q) => !q.isCorrect);

  // Parent motion container configs
  const containerVariants = {
    hidden: {},
    show: {
      transition: {
        staggerChildren: 0.08,
      },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100 } },
  };

  return (
    <div 
      className="flex-1 flex flex-col bg-white dark:bg-[#1d1d1f] overflow-y-auto"
      style={{ fontSize: 'calc(1rem * var(--font-scale, 1))' }}
    >
      {/* 1. Header (Math Pet Feeding Arena & Scores) */}
      <div className="flex-shrink-0 bg-[#f5f5f7] dark:bg-[#272729] border-b border-[#e0e0e0] dark:border-[#2a2a2c] p-5 text-center flex flex-col items-center sticky top-0 z-10">
        {/* Adopted Pet Animating Widget */}
        {pet.hasAdopted && (
          <div className="flex flex-col items-center mt-6 mb-4 w-full">
            <div className="relative">
              <MathPet type={pet.type} level={pet.level} animationState={petAnimationState} />
              {/* Localized Dialogue Speech Bubble */}
              {petSpeech && (
                <div className="absolute left-1/2 transform -translate-x-1/2 -top-12 bg-white dark:bg-[#1d1d1f] text-[#1d1d1f] dark:text-white border border-[#e0e0e0] dark:border-[#2a2a2c] px-3 py-1.5 rounded-[11px] text-[11px] font-normal w-max max-w-[200px] leading-snug animate-fade-in select-none">
                  {petSpeech}
                  {/* Speech bubble pointer arrow */}
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-white dark:border-t-[#1d1d1f]" />
                </div>
              )}
            </div>

            {/* EXP growth indicator */}
            <div className="w-full max-w-[220px] mt-3 flex items-center gap-2">
              <div className="flex-1 bg-[#e0e0e0] dark:bg-[#333333] h-1 rounded-full overflow-hidden">
                <div 
                  className="bg-[#0066cc] h-full transition-all duration-300"
                  style={{ width: `${(pet.exp / (pet.level * 100)) * 100}%` }}
                />
              </div>
              <span className="text-[10px] font-semibold text-ink-muted tabular-nums shrink-0">
                {pet.exp}/{pet.level * 100} EXP
              </span>
            </div>
          </div>
        )}

        {/* Animated Score Title */}
        <h1 className="text-[28px] font-semibold text-[#1d1d1f] dark:text-white tracking-tight mb-2 select-none">
          {t('summary.title', { score: animatedScore, total })}
        </h1>

        {/* High Score / New Record Badge */}
        {isSaved && (
          <div className="flex items-center gap-1.5 mb-4">
            {isNewRecord ? (
              <span className="inline-flex items-center gap-1 bg-[#f5f5f7] dark:bg-[#272729] text-[#0066cc] dark:text-[#2997ff] border border-[#e0e0e0] dark:border-[#2a2a2c] font-semibold px-3 py-1 rounded-full text-xs">
                <Flame className="w-3.5 h-3.5 fill-[#0066cc] text-[#0066cc] dark:fill-[#2997ff] dark:text-[#2997ff]" />
                {t('summary.newRecord')}
              </span>
            ) : (
              <span className="inline-flex items-center bg-[#fafafc] dark:bg-[#272729] text-ink-muted border border-[#e0e0e0] dark:border-[#2a2a2c] px-3 py-1 rounded-full text-xs font-normal">
                {t('summary.highScore', { score: Math.max(previousBest || 0, score), total })}
              </span>
            )}
          </div>
        )}

        {/* Interactive Feeding Button */}
        {pet.hasAdopted && (
          <div className="mb-4 w-full flex justify-center">
            <m.button
              type="button"
              disabled={treatsCount <= 0}
              onClick={handleFeed}
              whileTap={treatsCount <= 0 ? undefined : { scale: 0.95 }}
              className={`px-5 py-2.5 rounded-full font-normal text-xs flex items-center gap-2 transition min-h-[40px] ${
                treatsCount > 0
                  ? 'bg-[#0066cc] hover:bg-[#0066cc]/95 text-white'
                  : 'bg-[#fafafc] dark:bg-[#272729] text-ink-muted border border-[#e0e0e0] dark:border-[#2a2a2c] cursor-not-allowed shadow-none'
              }`}
            >
              <span>🍖</span>
              <span>{t('pet.feedButton', { name: pet.name })} ({treatsCount})</span>
            </m.button>
          </div>
        )}

        {/* CTA Buttons */}
        <div className="w-full flex gap-3 max-w-[340px]">
          <m.button
            type="button"
            onClick={handleRetry}
            whileTap={{ scale: 0.95 }}
            className="flex-1 py-2.5 bg-[#0066cc] hover:bg-[#0066cc]/95 text-white font-normal rounded-full min-h-[44px] flex items-center justify-center gap-2 transition"
          >
            <RotateCcw className="w-4 h-4" />
            {t('summary.retryButton')}
          </m.button>
          
          <m.button
            type="button"
            onClick={handleGoMenu}
            whileTap={{ scale: 0.95 }}
            className="flex-1 py-2.5 bg-transparent border border-[#0066cc] text-[#0066cc] dark:text-[#2997ff] font-normal rounded-full min-h-[44px] flex items-center justify-center gap-2 transition"
          >
            <Home className="w-4 h-4" />
            {t('summary.menuButton')}
          </m.button>
        </div>
      </div>

      {/* 2. Wrong Answers / Celebration Section */}
      <div className="p-5 flex-1 max-w-[400px] mx-auto w-full">
        {wrongAnswers.length === 0 ? (
          /* Perfect Score Celebration UI */
          <m.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-center py-8 flex flex-col items-center bg-[#fafafc] dark:bg-[#272729] border border-[#e0e0e0] dark:border-[#2a2a2c] rounded-[18px] p-6"
          >
            <div className="w-14 h-14 bg-[#fafafc] dark:bg-[#1d1d1f] border border-[#e0e0e0] dark:border-[#2a2a2c] rounded-full flex items-center justify-center text-[#16a34a] mb-4">
              <Check className="w-7 h-7 stroke-[3]" />
            </div>
            <h3 className="text-[17px] font-semibold text-[#1d1d1f] dark:text-white mb-1">
              {t('summary.allCorrect')}
            </h3>
            <p className="text-[13px] text-ink-muted font-normal">
              {t('summary.allCorrectDesc')}
            </p>
          </m.div>
        ) : (
          /* Staggered Wrong Answer List Review */
          <div className="space-y-4">
            <h2 className="text-[17px] font-semibold text-[#1d1d1f] dark:text-white tracking-tight pl-1 mb-2 select-none">
              {t('summary.wrongSection')}
            </h2>

            <m.div
              variants={containerVariants}
              initial="hidden"
              animate="show"
              className="space-y-3"
            >
              {wrongAnswers.map((q, idx) => {
                const formattedUserAns = q.userAnswer !== null
                  ? formatNumber(q.userAnswer, settings.numberFormat)
                  : t('game.placeholder');
                const formattedCorrectAns = formatNumber(q.correctAnswer, settings.numberFormat);

                // Re-evaluate display expression on the fly based on settings.numberFormat
                const formattedA = formatNumber(q.operandA, settings.numberFormat);
                const formattedB = formatNumber(q.operandB, settings.numberFormat);
                let opSign = '+';
                if (q.operation === 'subtraction') opSign = '−';
                else if (q.operation === 'multiplication') opSign = '×';
                else if (q.operation === 'division') opSign = '÷';
                const currentExpr = `${formattedA} ${opSign} ${formattedB} = ?`;

                return (
                  <m.div
                    key={idx}
                    variants={cardVariants}
                    className="bg-[#fafafc] dark:bg-[#272729] border border-[#e0e0e0] dark:border-[#2a2a2c] rounded-[18px] p-4"
                  >
                    {/* Expr */}
                    <div className="text-[14px] font-normal text-ink-muted mb-2">
                      Soal: <span className="text-[#1d1d1f] dark:text-white font-semibold text-[17px]">{currentExpr}</span>
                    </div>

                    {/* Answers Comparison */}
                    <div className="grid grid-cols-2 gap-2 text-xs font-normal mb-3.5">
                      <div className="p-2 bg-transparent border border-[#dc2626]/20 text-[#dc2626] rounded-full flex items-center justify-center gap-1">
                        <X className="w-3.5 h-3.5 flex-shrink-0" />
                        <span className="truncate">
                          {q.userAnswer === null 
                            ? t('game.timeUp') 
                            : t('summary.yourAnswer', { answer: formattedUserAns })}
                        </span>
                      </div>
                      <div className="p-2 bg-transparent border border-[#16a34a]/20 text-[#16a34a] rounded-full flex items-center justify-center gap-1">
                        <Check className="w-3.5 h-3.5 flex-shrink-0" />
                        <span className="truncate">
                          {t('summary.correctAnswerLabel', { answer: formattedCorrectAns })}
                        </span>
                      </div>
                    </div>

                    {/* Step-by-Step strategy tip (Always expanded here) */}
                    <div className="p-3 bg-[#f5f5f7] dark:bg-[#1d1d1f] border border-[#e0e0e0] dark:border-[#2a2a2c] rounded-[11px] text-[13px] text-ink-muted leading-relaxed font-normal">
                      <div className="font-semibold flex items-center gap-1 mb-1 text-[#0066cc] dark:text-[#2997ff]">
                        <HelpCircle className="w-4 h-4" />
                        Tip Hitung Cepat:
                      </div>
                      {q.quickTip}
                    </div>
                  </m.div>
                );
              })}
            </m.div>
          </div>
        )}
      </div>
    </div>
  );
};
export default ScoreSummary;
