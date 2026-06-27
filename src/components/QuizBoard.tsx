import React, { useState, useEffect } from 'react';
import { m, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Check, X, HelpCircle, Trophy } from 'lucide-react';
import { SessionState, SessionAction } from '../types';
import { useTranslation } from '../hooks/useTranslation';
import MathPet from './MathPet';
import { triggerHaptic } from '../utils/hapticEngine';
import { playCorrectSound, playWrongSound } from '../utils/soundEngine';
import { ImpactStyle } from '@capacitor/haptics';

interface QuizBoardProps {
  state: SessionState;
  dispatch: React.Dispatch<SessionAction>;
  feedPet: (expGained: number) => Promise<{ leveledUp: boolean; nextLevel: number }>;
  addCoins: (amount: number) => Promise<void>;
  onBack: () => void;
  registerBackButton: (handler: (() => void) | null) => void;
}

interface QuizQuestionDef {
  id: string;
  questionKey: 'q1'  | 'q2'  | 'q3'  | 'q4'  | 'q5'  | 'q6'  | 'q7'  | 'q8'  | 'q9'  | 'q10'
    | 'q11' | 'q12' | 'q13' | 'q14' | 'q15' | 'q16' | 'q17' | 'q18' | 'q19' | 'q20'
    | 'q21' | 'q22' | 'q23' | 'q24' | 'q25' | 'q26' | 'q27' | 'q28' | 'q29' | 'q30'
    | 'q31' | 'q32' | 'q33' | 'q34' | 'q35' | 'q36' | 'q37' | 'q38' | 'q39' | 'q40'
    | 'q41' | 'q42' | 'q43' | 'q44' | 'q45' | 'q46' | 'q47' | 'q48' | 'q49' | 'q50'
    | 'q51' | 'q52' | 'q53' | 'q54' | 'q55' | 'q56' | 'q57' | 'q58' | 'q59' | 'q60'
    | 'q61' | 'q62' | 'q63' | 'q64' | 'q65' | 'q66' | 'q67' | 'q68' | 'q69' | 'q70'
    | 'q71' | 'q72' | 'q73' | 'q74' | 'q75' | 'q76' | 'q77' | 'q78' | 'q79' | 'q80'
    | 'q81' | 'q82' | 'q83' | 'q84' | 'q85' | 'q86' | 'q87' | 'q88' | 'q89' | 'q90'
    | 'q91' | 'q92' | 'q93' | 'q94' | 'q95' | 'q96' | 'q97' | 'q98' | 'q99' | 'q100';
  correctIndex: number;
}

/** Runtime question with its options already shuffled for this session. */
interface ActiveQuizQuestion extends QuizQuestionDef {
  /** Mapping: display slot → original option index in i18n array. */
  shuffledOptionIndices: number[];
  /** Display slot where the correct answer appears after shuffling. */
  shuffledCorrectIndex: number;
}

/** Full pool of 100 word problems with their correct answer index (0-based) in the i18n options array. */
const ALL_QUIZ_QUESTIONS: QuizQuestionDef[] = [
  // ── q1-q20 (original questions) ───────────────────────────────────────────
  { id: 'q1',   questionKey: 'q1',   correctIndex: 1 }, // 8 carrots
  { id: 'q2',   questionKey: 'q2',   correctIndex: 2 }, // 40 minutes
  { id: 'q3',   questionKey: 'q3',   correctIndex: 1 }, // 40 berries
  { id: 'q4',   questionKey: 'q4',   correctIndex: 1 }, // 6 bananas
  { id: 'q5',   questionKey: 'q5',   correctIndex: 2 }, // 85 meters
  { id: 'q6',   questionKey: 'q6',   correctIndex: 2 }, // 13 toys
  { id: 'q7',   questionKey: 'q7',   correctIndex: 2 }, // 36 seeds
  { id: 'q8',   questionKey: 'q8',   correctIndex: 1 }, // 6 seeds/bag
  { id: 'q9',   questionKey: 'q9',   correctIndex: 2 }, // 72 coins
  { id: 'q10',  questionKey: 'q10',  correctIndex: 1 }, // 32 coconuts
  { id: 'q11',  questionKey: 'q11',  correctIndex: 2 }, // 32 twigs
  { id: 'q12',  questionKey: 'q12',  correctIndex: 2 }, // 28 hours
  { id: 'q13',  questionKey: 'q13',  correctIndex: 1 }, // 5 hops/s
  { id: 'q14',  questionKey: 'q14',  correctIndex: 2 }, // 400 coins
  { id: 'q15',  questionKey: 'q15',  correctIndex: 1 }, // 40 berries
  { id: 'q16',  questionKey: 'q16',  correctIndex: 2 }, // 36 monkeys
  { id: 'q17',  questionKey: 'q17',  correctIndex: 2 }, // 8 cherries
  { id: 'q18',  questionKey: 'q18',  correctIndex: 2 }, // 61 toys
  { id: 'q19',  questionKey: 'q19',  correctIndex: 1 }, // 45 cm
  { id: 'q20',  questionKey: 'q20',  correctIndex: 2 }, // 36 points
  // ── q21-q40 (addition & subtraction) ─────────────────────────────────────
  { id: 'q21',  questionKey: 'q21',  correctIndex: 3 }, // 23 apples
  { id: 'q22',  questionKey: 'q22',  correctIndex: 2 }, // 83 meters
  { id: 'q23',  questionKey: 'q23',  correctIndex: 2 }, // 9 mice
  { id: 'q24',  questionKey: 'q24',  correctIndex: 2 }, // 24 seeds
  { id: 'q25',  questionKey: 'q25',  correctIndex: 1 }, // 37 berries
  { id: 'q26',  questionKey: 'q26',  correctIndex: 3 }, // 72 coconuts
  { id: 'q27',  questionKey: 'q27',  correctIndex: 2 }, // 11 km
  { id: 'q28',  questionKey: 'q28',  correctIndex: 2 }, // 40 acorns
  { id: 'q29',  questionKey: 'q29',  correctIndex: 2 }, // 62 berries
  { id: 'q30',  questionKey: 'q30',  correctIndex: 2 }, // 55 feathers
  { id: 'q31',  questionKey: 'q31',  correctIndex: 1 }, // 63 seeds
  { id: 'q32',  questionKey: 'q32',  correctIndex: 2 }, // 125 toys
  { id: 'q33',  questionKey: 'q33',  correctIndex: 2 }, // 45 toys
  { id: 'q34',  questionKey: 'q34',  correctIndex: 2 }, // 72 km
  { id: 'q35',  questionKey: 'q35',  correctIndex: 2 }, // 300 coins
  { id: 'q36',  questionKey: 'q36',  correctIndex: 2 }, // 77 bananas
  { id: 'q37',  questionKey: 'q37',  correctIndex: 2 }, // 63 bananas
  { id: 'q38',  questionKey: 'q38',  correctIndex: 2 }, // 65 coins
  { id: 'q39',  questionKey: 'q39',  correctIndex: 1 }, // 64 meters
  { id: 'q40',  questionKey: 'q40',  correctIndex: 2 }, // 27 seeds
  // ── q41-q60 (multiplication & division) ──────────────────────────────────
  { id: 'q41',  questionKey: 'q41',  correctIndex: 2 }, // 21 meters
  { id: 'q42',  questionKey: 'q42',  correctIndex: 2 }, // 8 hours
  { id: 'q43',  questionKey: 'q43',  correctIndex: 2 }, // 90 cm
  { id: 'q44',  questionKey: 'q44',  correctIndex: 2 }, // 60 songs
  { id: 'q45',  questionKey: 'q45',  correctIndex: 2 }, // 75 coins
  { id: 'q46',  questionKey: 'q46',  correctIndex: 2 }, // 72 bananas
  { id: 'q47',  questionKey: 'q47',  correctIndex: 2 }, // 77 steps
  { id: 'q48',  questionKey: 'q48',  correctIndex: 2 }, // 48 seeds
  { id: 'q49',  questionKey: 'q49',  correctIndex: 1 }, // 72 hops
  { id: 'q50',  questionKey: 'q50',  correctIndex: 2 }, // 70 coins
  { id: 'q51',  questionKey: 'q51',  correctIndex: 2 }, // 7 cherries
  { id: 'q52',  questionKey: 'q52',  correctIndex: 2 }, // 5 fish
  { id: 'q53',  questionKey: 'q53',  correctIndex: 2 }, // 7 seeds
  { id: 'q54',  questionKey: 'q54',  correctIndex: 2 }, // 7 coconuts
  { id: 'q55',  questionKey: 'q55',  correctIndex: 2 }, // 16 boxes
  { id: 'q56',  questionKey: 'q56',  correctIndex: 2 }, // 9 feathers
  { id: 'q57',  questionKey: 'q57',  correctIndex: 2 }, // 9 mice
  { id: 'q58',  questionKey: 'q58',  correctIndex: 2 }, // 12 seeds
  { id: 'q59',  questionKey: 'q59',  correctIndex: 3 }, // 15 hops/min
  { id: 'q60',  questionKey: 'q60',  correctIndex: 2 }, // 12 berries/row
  // ── q61-q80 (harder mixed) ────────────────────────────────────────────────
  { id: 'q61',  questionKey: 'q61',  correctIndex: 1 }, // 363 steps
  { id: 'q62',  questionKey: 'q62',  correctIndex: 1 }, // 267 seeds
  { id: 'q63',  questionKey: 'q63',  correctIndex: 2 }, // 91 meters
  { id: 'q64',  questionKey: 'q64',  correctIndex: 2 }, // 108 bananas
  { id: 'q65',  questionKey: 'q65',  correctIndex: 2 }, // 24 eggs
  { id: 'q66',  questionKey: 'q66',  correctIndex: 2 }, // 32 toys
  { id: 'q67',  questionKey: 'q67',  correctIndex: 1 }, // 183 berries
  { id: 'q68',  questionKey: 'q68',  correctIndex: 2 }, // 172 seeds
  { id: 'q69',  questionKey: 'q69',  correctIndex: 2 }, // 120 hops
  { id: 'q70',  questionKey: 'q70',  correctIndex: 2 }, // 121 bananas
  { id: 'q71',  questionKey: 'q71',  correctIndex: 2 }, // 225 coins
  { id: 'q72',  questionKey: 'q72',  correctIndex: 2 }, // 105 songs
  { id: 'q73',  questionKey: 'q73',  correctIndex: 2 }, // 24 treats/week
  { id: 'q74',  questionKey: 'q74',  correctIndex: 2 }, // 108 seeds
  { id: 'q75',  questionKey: 'q75',  correctIndex: 2 }, // 20 tricks/session
  { id: 'q76',  questionKey: 'q76',  correctIndex: 2 }, // 165 feathers
  { id: 'q77',  questionKey: 'q77',  correctIndex: 2 }, // 145 toys
  { id: 'q78',  questionKey: 'q78',  correctIndex: 2 }, // 126 seeds
  { id: 'q79',  questionKey: 'q79',  correctIndex: 2 }, // 20 bags
  { id: 'q80',  questionKey: 'q80',  correctIndex: 2 }, // 169 hops
  // ── q81-q100 (challenge level) ────────────────────────────────────────────
  { id: 'q81',  questionKey: 'q81',  correctIndex: 2 }, // 181 berries
  { id: 'q82',  questionKey: 'q82',  correctIndex: 1 }, // 366 seeds
  { id: 'q83',  questionKey: 'q83',  correctIndex: 2 }, // 136 meters
  { id: 'q84',  questionKey: 'q84',  correctIndex: 2 }, // 25 songs
  { id: 'q85',  questionKey: 'q85',  correctIndex: 2 }, // 168 catches
  { id: 'q86',  questionKey: 'q86',  correctIndex: 2 }, // 24 berries/jar
  { id: 'q87',  questionKey: 'q87',  correctIndex: 2 }, // 141 seeds
  { id: 'q88',  questionKey: 'q88',  correctIndex: 2 }, // 464 coconuts
  { id: 'q89',  questionKey: 'q89',  correctIndex: 2 }, // 133 meters
  { id: 'q90',  questionKey: 'q90',  correctIndex: 2 }, // 13 fish
  { id: 'q91',  questionKey: 'q91',  correctIndex: 2 }, // 625 coins
  { id: 'q92',  questionKey: 'q92',  correctIndex: 1 }, // 563 seeds
  { id: 'q93',  questionKey: 'q93',  correctIndex: 2 }, // 192 bananas
  { id: 'q94',  questionKey: 'q94',  correctIndex: 2 }, // 18 eggs/row
  { id: 'q95',  questionKey: 'q95',  correctIndex: 2 }, // 200 toys
  { id: 'q96',  questionKey: 'q96',  correctIndex: 2 }, // 25 berries/jar
  { id: 'q97',  questionKey: 'q97',  correctIndex: 2 }, // 378 seeds
  { id: 'q98',  questionKey: 'q98',  correctIndex: 2 }, // 475 bananas
  { id: 'q99',  questionKey: 'q99',  correctIndex: 2 }, // 198 chirps
  { id: 'q100', questionKey: 'q100', correctIndex: 2 }, // 24 fish packs
];

/** How many questions to show per quiz session — driven by settings.questionCount. */
const MAX_QUIZ_POOL = ALL_QUIZ_QUESTIONS.length; // 100

/** Fisher-Yates shuffle returning a new array. */
function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Pick `count` random questions from the pool and, for each,
 * shuffle the 4 option slots so the correct answer appears at a random position.
 */
function buildActiveQuestions(count: number): ActiveQuizQuestion[] {
  const safeCount = Math.min(Math.max(count, 1), MAX_QUIZ_POOL);
  return shuffleArray(ALL_QUIZ_QUESTIONS)
    .slice(0, safeCount)
    .map(q => {
      const shuffledOptionIndices = shuffleArray([0, 1, 2, 3]);
      const shuffledCorrectIndex = shuffledOptionIndices.indexOf(q.correctIndex);
      return { ...q, shuffledOptionIndices, shuffledCorrectIndex };
    });
}

export const QuizBoard: React.FC<QuizBoardProps> = ({
  state,
  dispatch,
  feedPet,
  addCoins,
  onBack,
  registerBackButton,
}) => {
  const { t } = useTranslation();
  const { settings, pet } = state;

  const [activeQuestions, setActiveQuestions] = useState<ActiveQuizQuestion[]>(
    () => buildActiveQuestions(settings.questionCount)
  );

  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);
  const [showWarningUnanswered, setShowWarningUnanswered] = useState(false);
  const [quizScore, setQuizScore] = useState(0);

  // Companion pet state after rewards
  const [petAnimationState, setPetAnimationState] = useState<'idle' | 'eating' | 'levelUp'>('idle');
  const [petSpeech, setPetSpeech] = useState<string>('');

  // Register Android back button
  useEffect(() => {
    registerBackButton(onBack);
    return () => registerBackButton(null);
  }, [registerBackButton, onBack]);

  const handleSelectOption = (questionId: string, optionIndex: number) => {
    if (isSubmitted) return;
    triggerHaptic(ImpactStyle.Light, settings.hapticEnabled);
    setSelectedAnswers(prev => ({
      ...prev,
      [questionId]: optionIndex
    }));
  };

  const handleVerifySubmit = () => {
    triggerHaptic(ImpactStyle.Light, settings.hapticEnabled);
    const answeredCount = Object.keys(selectedAnswers).length;
    if (answeredCount < activeQuestions.length) {
      setShowWarningUnanswered(true);
      setTimeout(() => setShowWarningUnanswered(false), 3000);
      return;
    }
    setShowConfirmSubmit(true);
  };

  const handleConfirmSubmit = async () => {
    setShowConfirmSubmit(false);
    setIsSubmitted(true);

    // Calculate score
    let score = 0;
    activeQuestions.forEach(q => {
      if (selectedAnswers[q.id] === q.shuffledCorrectIndex) {
        score += 1;
      }
    });
    setQuizScore(score);

    const isPerfect = score === activeQuestions.length;
    
    // Play sounds & haptic
    if (isPerfect) {
      playCorrectSound(settings.soundEnabled);
      triggerHaptic(ImpactStyle.Medium, settings.hapticEnabled);
    } else {
      playWrongSound(settings.soundEnabled);
      triggerHaptic(ImpactStyle.Heavy, settings.hapticEnabled);
    }

    // Set speech bubble feedback
    if (isPerfect) {
      setPetSpeech(t('quiz.dialoguePerfect', { name: settings.userName || t('pet.defaultGreetingName') }));
    } else {
      setPetSpeech(t('quiz.dialogueOk', { name: settings.userName || t('pet.defaultGreetingName') }));
    }

    // Disburse rewards
    const coinsEarned = score + (isPerfect ? 5 : 0);
    const expEarned = score * 5 + (isPerfect ? 10 : 0);

    try {
      if (coinsEarned > 0) {
        await addCoins(coinsEarned);
        dispatch({ type: 'ADD_COINS', payload: { amount: coinsEarned } });
      }
      
      setPetAnimationState('eating');
      await feedPet(expEarned);
      dispatch({ type: 'FEED_PET', payload: { expGained: expEarned } });

      setTimeout(() => {
        setPetAnimationState(isPerfect ? 'levelUp' : 'idle');
      }, 1500);

    } catch (err) {
      console.error('Failed to disburse quiz rewards:', err);
    }
  };

  const handleRetry = () => {
    triggerHaptic(ImpactStyle.Light, settings.hapticEnabled);
    // Reshuffle pool AND randomize option positions for fresh experience
    setActiveQuestions(buildActiveQuestions(settings.questionCount));
    setSelectedAnswers({});
    setIsSubmitted(false);
    setPetSpeech('');
    setPetAnimationState('idle');
  };

  // Calculate answered count
  const answeredCount = Object.keys(selectedAnswers).length;

  return (
    <div className="flex-1 flex flex-col bg-[#fafafc] dark:bg-[#121218] overflow-hidden font-gacha" style={{ fontSize: 'calc(1rem * var(--font-scale, 1))' }}>
      
      {/* Header */}
      <header className="flex-shrink-0 flex items-center justify-between px-5 py-3.5 border-b border-neutral-200 dark:border-[#d4af37]/20 bg-white dark:bg-[#1a1a24] z-10">
        <m.button
          type="button"
          onClick={onBack}
          whileTap={{ scale: 0.95 }}
          className="btn-icon"
          aria-label={t('settings.backButton')}
        >
          <ArrowLeft className="w-5 h-5" />
        </m.button>
        
        <h1 className="text-[16px] font-bold text-[#1d1d1f] dark:text-white font-fantasy tracking-tight">
          {t('quiz.title')}
        </h1>
        
        {/* Progress or Score */}
        <div className="text-[12px] font-bold text-amber-600 dark:text-amber-400 font-fantasy">
          {isSubmitted ? `${quizScore}/${activeQuestions.length}` : `${answeredCount}/${activeQuestions.length}`}
        </div>
      </header>

      {/* Warning Overlay */}
      <AnimatePresence>
        {showWarningUnanswered && (
          <m.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-16 inset-x-5 bg-rose-500 text-white text-[12px] font-semibold py-2 px-4 rounded-full text-center shadow-lg z-30"
          >
            ⚠️ {t('quiz.unansweredWarning')}
          </m.div>
        )}
      </AnimatePresence>

      {/* Main Scrollable Content */}
      <main className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        
        {/* Active Pet Speech Bubble (Results screen only) */}
        {isSubmitted && pet.hasAdopted && (
          <m.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rpg-panel rpg-gold-trim p-4 flex gap-4 bg-gradient-to-r from-amber-500/5 to-yellow-500/5 dark:from-[#d4af37]/5 dark:to-[#1a1a24]"
          >
            <MathPet type={pet.type} level={pet.level} animationState={petAnimationState} className="w-14 h-14 shrink-0" />
            <div className="flex-1 flex flex-col justify-center">
              <div className="bg-white dark:bg-[#20202d] border border-neutral-200 dark:border-[#d4af37]/20 px-3 py-2 rounded-[12px] text-[11px] font-normal text-[#1d1d1f] dark:text-white/90 leading-relaxed shadow-inner">
                {petSpeech}
              </div>
            </div>
          </m.div>
        )}

        {/* Results Rewards Banner */}
        {isSubmitted && (
          <m.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="rpg-panel rpg-gold-trim p-5 text-center flex flex-col items-center justify-center bg-white dark:bg-[#1a1a24] shadow-md gap-2"
          >
            {quizScore === activeQuestions.length ? (
              <>
                <div className="w-14 h-14 bg-amber-500/10 dark:bg-amber-500/5 rounded-full flex items-center justify-center text-amber-500 border border-amber-500/20 mb-1">
                  <Trophy className="w-8 h-8 animate-bounce" />
                </div>
                <h2 className="text-[18px] font-bold text-[#1d1d1f] dark:text-white font-fantasy">
                  {t('summary.perfect')}
                </h2>
                <p className="text-[12px] text-emerald-600 dark:text-emerald-400 font-semibold">
                  {t('quiz.perfectReward', { coins: quizScore + 5, exp: quizScore * 5 + 10 })}
                </p>
              </>
            ) : (
              <>
                <h2 className="text-[17px] font-bold text-[#1d1d1f] dark:text-white font-fantasy">
                  {t('quiz.scoreTitle')}
                </h2>
                <p className="text-[12px] text-amber-600 dark:text-amber-400 font-semibold">
                  {t('quiz.earnReward', { coins: quizScore, exp: quizScore * 5 })}
                </p>
              </>
            )}
          </m.div>
        )}

        {/* Quiz Questions List */}
        <div className="space-y-4">
          {activeQuestions.map((q, idx) => {
            const selectedIdx = selectedAnswers[q.id];
            const hasSelected = selectedIdx !== undefined;
            const isCorrect = selectedIdx === q.shuffledCorrectIndex;
            
            const questionText = t(`quiz.${q.questionKey}.question` as any);
            // Build options in SHUFFLED display order
            const optionsArray = q.shuffledOptionIndices.map(origIdx =>
              t(`quiz.${q.questionKey}.options.${origIdx}` as any)
            );

            return (
              <div 
                key={q.id}
                className={`rpg-panel p-4 flex flex-col space-y-3.5 bg-white dark:bg-[#1a1a24] transition-all relative ${
                  isSubmitted 
                    ? isCorrect
                      ? 'border-emerald-500/50 dark:border-emerald-500/40 shadow-[0_2px_8px_rgba(16,185,129,0.05)]'
                      : 'border-rose-500/50 dark:border-rose-500/40 shadow-[0_2px_8px_rgba(239,68,68,0.05)]'
                    : hasSelected
                      ? 'border-[#0066cc]/50 dark:border-[#d4af37]/50 shadow-[0_2px_8px_rgba(0,102,204,0.05)]'
                      : 'border-neutral-200 dark:border-[#2a2a2c]'
                }`}
              >
                {/* Header Question Label */}
                <div className="flex items-start justify-between gap-3">
                  <span className="text-[10px] text-[#0066cc] dark:text-[#d4af37] font-bold uppercase tracking-wider font-fantasy">
                    Soal {idx + 1}
                  </span>
                  
                  {isSubmitted && (
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 flex items-center gap-1 ${
                      isCorrect 
                        ? 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/5 dark:text-emerald-400' 
                        : 'bg-rose-500/10 text-rose-600 dark:bg-rose-500/5 dark:text-rose-400'
                    }`}>
                      {isCorrect ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          {t('quiz.correctLabel')}
                        </>
                      ) : (
                        <>
                          <X className="w-3.5 h-3.5" />
                          {t('quiz.wrongLabel')}
                        </>
                      )}
                    </span>
                  )}
                </div>

                {/* Question Text */}
                <p className="text-[13.5px] leading-relaxed text-[#1d1d1f] dark:text-white font-normal">
                  {questionText}
                </p>

                {/* Multiple Choice Options */}
                <div className="grid grid-cols-1 gap-2">
                  {optionsArray.map((optText, oIdx) => {
                    const isOptionSelected = selectedIdx === oIdx;
                    // In the shuffled display, the correct slot is shuffledCorrectIndex
                    const isCorrectAnswer = oIdx === q.shuffledCorrectIndex;
                    
                    let btnStyle = 'border-neutral-200 dark:border-[#2a2a2c] text-neutral-800 dark:text-neutral-200';
                    
                    if (isSubmitted) {
                      if (isCorrectAnswer) {
                        btnStyle = 'bg-emerald-500/10 border-emerald-500 text-emerald-700 dark:text-emerald-400 font-semibold';
                      } else if (isOptionSelected && !isCorrect) {
                        btnStyle = 'bg-rose-500/10 border-rose-500 text-rose-700 dark:text-rose-400 font-semibold';
                      } else {
                        btnStyle = 'opacity-50 border-neutral-200 dark:border-neutral-800 text-ink-muted';
                      }
                    } else if (isOptionSelected) {
                      btnStyle = 'bg-[#0066cc]/10 dark:bg-[#d4af37]/10 border-[#0066cc] dark:border-[#d4af37] text-[#0066cc] dark:text-[#d4af37] font-semibold';
                    }

                    return (
                      <m.button
                        key={oIdx}
                        type="button"
                        onClick={() => handleSelectOption(q.id, oIdx)}
                        disabled={isSubmitted}
                        whileTap={!isSubmitted ? { scale: 0.98 } : undefined}
                        className={`w-full py-2.5 px-4 text-[12.5px] rounded-[12px] border text-left flex items-center justify-between transition-all min-h-[42px] ${btnStyle}`}
                      >
                        <span>{optText}</span>
                        {isOptionSelected && (
                          <div className="w-5 h-5 rounded-full bg-current opacity-15 flex items-center justify-center shrink-0">
                            {isCorrect || !isSubmitted ? <Check className="w-3.5 h-3.5 text-white" /> : <X className="w-3.5 h-3.5 text-white" />}
                          </div>
                        )}
                      </m.button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* Pinned Footer */}
      <footer className="flex-shrink-0 p-4 border-t border-neutral-200 dark:border-[#d4af37]/25 bg-white dark:bg-[#1a1a24] z-10">
        {!isSubmitted ? (
          <m.button
            type="button"
            onClick={handleVerifySubmit}
            whileTap={{ scale: 0.98 }}
            className="btn-primary w-full shadow-lg"
          >
            {t('quiz.submitButton')}
          </m.button>
        ) : (
          <div className="flex flex-col gap-2.5">
            <m.button
              type="button"
              onClick={handleRetry}
              whileTap={{ scale: 0.98 }}
              className="btn-secondary w-full"
            >
              🔄 {t('quiz.retryButton')}
            </m.button>
            <m.button
              type="button"
              onClick={onBack}
              whileTap={{ scale: 0.98 }}
              className="btn-primary w-full"
            >
              🏠 {t('quiz.menuButton')}
            </m.button>
          </div>
        )}
      </footer>

      {/* Submit Confirmation Modal */}
      <AnimatePresence>
        {showConfirmSubmit && (
          <m.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-neutral-950/60 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in"
          >
            <m.div
              initial={{ scale: 0.9, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 30 }}
              className="bg-white dark:bg-[#1c1c27] w-full max-w-xs rounded-[24px] p-6 border border-amber-500/30 dark:border-amber-500/20 text-center shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-400" />
              
              <div className="w-14 h-14 bg-amber-500/10 dark:bg-amber-500/5 rounded-full flex items-center justify-center text-amber-500 mx-auto mb-4 border border-amber-500/20">
                <HelpCircle className="w-7 h-7" />
              </div>
              
              <h3 className="text-lg font-bold text-[#1d1d1f] dark:text-white mb-2 font-fantasy">
                {t('quiz.confirmSubmitTitle')}
              </h3>
              
              <p className="text-[13px] text-ink-muted mb-6 leading-relaxed">
                {t('quiz.confirmSubmitDesc')}
              </p>
              
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={handleConfirmSubmit}
                  className="btn-primary"
                >
                  {t('quiz.confirmSubmitYes')}
                </button>
                <button
                  type="button"
                  onClick={() => setShowConfirmSubmit(false)}
                  className="btn-secondary"
                >
                  {t('quiz.confirmSubmitNo')}
                </button>
              </div>
            </m.div>
          </m.div>
        )}
      </AnimatePresence>
      
    </div>
  );
};
export default QuizBoard;
