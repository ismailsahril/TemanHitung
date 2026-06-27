import React, { useState } from 'react';
import { m, AnimatePresence } from 'framer-motion';
import { Settings } from 'lucide-react';
import { SessionAction, AppSettings, Operation, Difficulty, NumberMode, SessionConfig, PetState, SessionHistoryEntry } from '../types';
import { useTranslation } from '../hooks/useTranslation';
import MathPet from './MathPet';
import { triggerHaptic } from '../utils/hapticEngine';
import { ImpactStyle } from '@capacitor/haptics';

interface MainMenuProps {
  settings: AppSettings;
  dispatch: React.Dispatch<SessionAction>;
  pet: PetState;
  updateSetting: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => Promise<void>;
  interactWithPet: (cost: number, expGained: number) => Promise<{ leveledUp: boolean; nextLevel: number }>;
  recentSessions: SessionHistoryEntry[];
}

/**
 * MainMenu component displaying practice options (operations, difficulties, modes).
 * Also displays the companion pet greeting box and the banner to enter Kasir Warung mode.
 */
export const MainMenu: React.FC<MainMenuProps> = ({
  settings,
  dispatch,
  pet,
  updateSetting,
  interactWithPet,
  recentSessions,
}) => {
  const { t } = useTranslation();

  // Internal selection state
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>('easy');
  const [selectedMode, setSelectedMode] = useState<NumberMode>('integer');
  const [warungDifficulty, setWarungDifficulty] = useState<Difficulty>('easy');

  // Pet Actions local animation and speech reaction
  const [petAnimationState, setPetAnimationState] = useState<'idle' | 'eating' | 'levelUp'>('idle');
  const [customSpeech, setCustomSpeech] = useState<string | null>(null);

  // Local state for the username prompt if not set
  const [tempName, setTempName] = useState('');

  // Modals visibility state
  const [showPracticeIntro, setShowPracticeIntro] = useState(false);
  const [showWarungIntro, setShowWarungIntro] = useState(false);

  const handleSaveName = async (): Promise<void> => {
    const trimmed = tempName.trim();
    if (trimmed) {
      await updateSetting('userName', trimmed);
      dispatch({ type: 'UPDATE_SETTINGS', payload: { userName: trimmed } });
    }
  };

  const opsList: { type: Operation; emoji: string }[] = [
    { type: 'addition', emoji: '➕' },
    { type: 'subtraction', emoji: '➖' },
    { type: 'multiplication', emoji: '✖️' },
    { type: 'division', emoji: '➗' },
  ];

  const diffsList: Difficulty[] = ['easy', 'medium', 'hard'];

  const greeting = settings.userName
    ? t('menu.greeting', { name: settings.userName })
    : t('menu.greetingNoName');

  return (
    <div className="flex-1 flex flex-col bg-[#fafafc] dark:bg-[#121218] overflow-y-auto font-gacha" style={{ fontSize: 'calc(1rem * var(--font-scale, 1))' }}>
      {/* Header */}
      <header className="flex-shrink-0 flex items-center justify-between px-5 py-3.5 border-b border-neutral-200 dark:border-[#d4af37]/20 bg-white dark:bg-[#1a1a24]">
        <div className="flex flex-col">
          <span className="text-[10px] text-amber-600 dark:text-amber-400 uppercase tracking-widest font-fantasy font-bold">
            {t('appName')}
          </span>
          <h1 className="text-[17px] font-semibold text-[#1d1d1f] dark:text-white mt-0.5 tracking-tight">
            {greeting}
          </h1>
        </div>
        <m.button
          type="button"
          onClick={() => dispatch({ type: 'GO_TO_SETTINGS' })}
          whileTap={{ scale: 0.95 }}
          className="btn-icon"
          aria-label={t('menu.settingsButton')}
        >
          <Settings className="w-5.5 h-5.5" />
        </m.button>
      </header>

      {/* Main Content */}
      <main className="px-5 py-5 flex-1 flex flex-col justify-between space-y-5">
        <div className="flex-1 flex flex-col justify-between space-y-5">
          <div className="space-y-5">
            {/* Username Prompt Card (shown on main menu if adopted a pet but userName is not set) */}
            {pet.hasAdopted && !settings.userName && (
              <div className="rpg-panel rpg-gold-trim p-4 flex flex-col space-y-3 relative overflow-hidden bg-gradient-to-br from-amber-500/5 to-yellow-500/5 dark:from-[#d4af37]/5 dark:to-[#1a1a24]">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 bg-white dark:bg-[#20202d] border border-[#d4af37]/30 rounded-full flex items-center justify-center text-base shrink-0 shadow-sm">
                    👋
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-[13px] font-semibold text-[#1d1d1f] dark:text-white font-fantasy">
                      {t('menu.userNamePromptTitle')}
                    </h3>
                    <p className="text-[11px] text-ink-muted leading-normal font-normal">
                      {t('menu.userNamePromptDesc')}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={tempName}
                    onChange={(e) => setTempName(e.target.value)}
                    maxLength={15}
                    placeholder={t('menu.userNamePromptPlaceholder')}
                    className="flex-1 px-4 py-2 text-[13px] bg-white dark:bg-[#1a1a24] border border-neutral-300 dark:border-[#d4af37]/20 rounded-full focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 font-normal text-[#1d1d1f] dark:text-white shadow-inner"
                  />
                  <m.button
                    type="button"
                    onClick={handleSaveName}
                    disabled={!tempName.trim()}
                    whileTap={tempName.trim() ? { scale: 0.95 } : undefined}
                    className={`px-4 py-2 rounded-full text-xs font-semibold text-white transition-all min-h-[34px] flex items-center justify-center ${
                      tempName.trim()
                        ? 'bg-amber-500 hover:bg-amber-600 shadow-[0_2px_8px_rgba(245,158,11,0.3)]'
                        : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-400 dark:text-neutral-600 border border-neutral-200 dark:border-neutral-700/50 cursor-not-allowed shadow-none'
                    }`}
                  >
                    {t('menu.userNamePromptSubmit')}
                  </m.button>
                </div>
              </div>
            )}

            {/* Math Pet Status Card */}
            {pet.hasAdopted && (
              <div className="rpg-panel rpg-gold-trim p-3.5 flex flex-col gap-3 relative overflow-hidden bg-gradient-to-r from-amber-500/5 to-yellow-500/5 dark:from-[#d4af37]/5 dark:to-[#1a1a24]">
                <div className="flex items-center gap-3.5">
                  {/* Pet rendering */}
                  <div className="flex-shrink-0">
                    <MathPet type={pet.type} level={pet.level} animationState={petAnimationState} className="w-16 h-16 sm:w-18 sm:h-18" />
                  </div>

                  {/* Pet Info & Speech Bubble */}
                  <div className="flex-1 flex flex-col justify-center min-w-0">
                    <div className="flex items-baseline justify-between mb-0.5 gap-2">
                      <span className="text-xs font-semibold text-[#1d1d1f] dark:text-white truncate">
                        {pet.name}
                      </span>
                      
                      <div className="flex items-center gap-1.5 shrink-0">
                        {/* Coin balance indicator */}
                        <div className="flex items-center gap-1 bg-amber-500/10 dark:bg-amber-950/20 border border-[#d4af37]/35 px-1.5 py-0.5 rounded-[5px] text-amber-600 dark:text-amber-400 font-fantasy text-[9px] font-bold">
                          <span>🪙</span> {pet.coins || 0}
                        </div>

                        {/* Level Crest Shield Emblem */}
                        <div className="flex items-center gap-1 bg-amber-500/10 dark:bg-[#d4af37]/15 border border-[#d4af37]/40 px-1.5 py-0.5 rounded-[5px] text-amber-600 dark:text-[#d4af37] font-fantasy text-[9px] font-bold tracking-wider">
                          <svg className="w-2.5 h-2.5 text-amber-500" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2L4 6v6c0 5.25 3.42 10.16 8 11.5 4.58-1.34 8-6.25 8-11.5V6l-8-4z" />
                          </svg>
                          {t('pet.levelLabel', { level: pet.level })}
                        </div>
                      </div>
                    </div>

                    {/* Localized Pet Speech bubble */}
                    <div className="bg-[#fafafc] dark:bg-[#20202d] border border-neutral-200 dark:border-[#d4af37]/20 px-3 py-1.5 rounded-[12px] text-[11px] font-normal text-[#1d1d1f] dark:text-white/90 leading-normal relative mb-2 shadow-inner min-h-[36px] flex items-center">
                      {customSpeech || t(`pet.${pet.type}Greeting`, { name: settings.userName || t('pet.defaultGreetingName') })}
                    </div>

                    {/* EXP Progress bar */}
                    <div className="w-full flex items-center gap-1.5">
                      <div className="flex-1 bg-neutral-200 dark:bg-neutral-800 h-2 rounded-full overflow-hidden border border-neutral-300/40 dark:border-neutral-700/50">
                        <div 
                          className="bg-gradient-to-r from-purple-500 to-indigo-600 h-full transition-all duration-500" 
                          style={{ width: `${(pet.exp / (pet.level * 100)) * 100}%` }}
                        />
                      </div>
                      <span className="text-[9px] font-semibold text-ink-muted tabular-nums shrink-0 font-fantasy">
                        {t('pet.expLabel', { current: pet.exp, next: pet.level * 100 })}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Pet Quick Actions - Spend Coins */}
                <div className="grid grid-cols-2 gap-2 pt-1.5 border-t border-neutral-200/50 dark:border-[#d4af37]/15">
                  <m.button
                    type="button"
                    disabled={(pet.coins || 0) < 10}
                    onClick={async () => {
                      if ((pet.coins || 0) < 10) return;
                      triggerHaptic(ImpactStyle.Light, settings.hapticEnabled);
                      setPetAnimationState('eating');
                      setCustomSpeech('Nyam nyam! Enak sekali! 🍖');
                      const { leveledUp, nextLevel } = await interactWithPet(10, 5);
                      dispatch({ type: 'ADD_COINS', payload: { amount: -10 } });
                      dispatch({ type: 'FEED_PET', payload: { expGained: 5 } });
                      
                      if (leveledUp) {
                        setPetAnimationState('levelUp');
                        setCustomSpeech(`Hore! ${pet.name} naik ke Level ${nextLevel}! 🎉`);
                      }
                      setTimeout(() => {
                        setPetAnimationState('idle');
                        setCustomSpeech(null);
                      }, 2500);
                    }}
                    whileTap={(pet.coins || 0) >= 10 ? { scale: 0.95 } : undefined}
                    className={`flex items-center justify-center gap-1.5 py-1.5 rounded-full text-[11px] font-bold font-fantasy border transition-all ${
                      (pet.coins || 0) >= 10
                        ? 'bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-400 hover:bg-amber-500/20'
                        : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-400 dark:text-neutral-600 border-neutral-200 dark:border-neutral-700/50 cursor-not-allowed'
                    }`}
                  >
                    <span>🍖</span> Beri Makan (10🪙)
                  </m.button>

                  <m.button
                    type="button"
                    disabled={(pet.coins || 0) < 5}
                    onClick={async () => {
                      if ((pet.coins || 0) < 5) return;
                      triggerHaptic(ImpactStyle.Light, settings.hapticEnabled);
                      setPetAnimationState('eating');
                      setCustomSpeech('Wuuuz! Segar sekali! 🧼✨');
                      const { leveledUp, nextLevel } = await interactWithPet(5, 2);
                      dispatch({ type: 'ADD_COINS', payload: { amount: -5 } });
                      dispatch({ type: 'FEED_PET', payload: { expGained: 2 } });
                      
                      if (leveledUp) {
                        setPetAnimationState('levelUp');
                        setCustomSpeech(`Hore! ${pet.name} naik ke Level ${nextLevel}! 🎉`);
                      }
                      setTimeout(() => {
                        setPetAnimationState('idle');
                        setCustomSpeech(null);
                      }, 2500);
                    }}
                    whileTap={(pet.coins || 0) >= 5 ? { scale: 0.95 } : undefined}
                    className={`flex items-center justify-center gap-1.5 py-1.5 rounded-full text-[11px] font-bold font-fantasy border transition-all ${
                      (pet.coins || 0) >= 5
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/20'
                        : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-400 dark:text-neutral-600 border-neutral-200 dark:border-neutral-700/50 cursor-not-allowed'
                    }`}
                  >
                    <span>🧼</span> Mandikan (5🪙)
                  </m.button>
                </div>
              </div>
            )}

            {/* Daily Missions & Statistics Widget */}
            {(() => {
              const startOfToday = new Date().setHours(0, 0, 0, 0);
              const todaySessions = (recentSessions || []).filter(s => s.achievedAt >= startOfToday);
              const totalSolved = (recentSessions || []).reduce((sum, s) => sum + s.outOf, 0);
              const totalCorrectAll = (recentSessions || []).reduce((sum, s) => sum + s.score, 0);
              const accuracy = totalSolved > 0 ? Math.round((totalCorrectAll / totalSolved) * 100) : 100;

              // Mission progress
              const m1Val = todaySessions.length;
              const m1Done = m1Val >= 1;
              const m2Val = todaySessions.reduce((sum, s) => sum + s.score, 0);
              const m2Done = m2Val >= 10;

              return (
                <div className="bg-white dark:bg-[#1a1a24] p-3.5 rounded-[18px] border border-neutral-200/70 dark:border-[#d4af37]/20 shadow-sm space-y-3.5">
                  <div className="flex items-center justify-between">
                    <h3 className="text-[12px] font-bold text-[#1d1d1f] dark:text-white font-fantasy uppercase tracking-wider flex items-center gap-1.5">
                      <span>🎯</span> Misi & Stats Hari Ini
                    </h3>
                    <span className="text-[9px] bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold px-2 py-0.5 rounded-full font-fantasy">
                      +EXP & KOIN
                    </span>
                  </div>

                  {/* Daily Missions list */}
                  <div className="space-y-2.5">
                    {/* Mission 1: Latihan Harian */}
                    <div className="flex items-center justify-between text-[11.5px]">
                      <div className="flex flex-col min-w-0">
                        <span className={`font-semibold text-neutral-800 dark:text-neutral-200 ${m1Done ? 'line-through opacity-50' : ''}`}>
                          Latihan Harian {m1Done && '✅'}
                        </span>
                        <span className="text-[9.5px] text-ink-muted leading-tight">
                          Selesaikan 1 sesi latihan
                        </span>
                      </div>
                      <span className="font-fantasy font-bold text-amber-600 dark:text-amber-400 tabular-nums">
                        {Math.min(1, m1Val)}/1
                      </span>
                    </div>

                    {/* Mission 2: Ahli Berhitung */}
                    <div className="flex items-center justify-between text-[11.5px]">
                      <div className="flex flex-col min-w-0">
                        <span className={`font-semibold text-neutral-800 dark:text-neutral-200 ${m2Done ? 'line-through opacity-50' : ''}`}>
                          Ahli Berhitung {m2Done && '✅'}
                        </span>
                        <span className="text-[9.5px] text-ink-muted leading-tight">
                          Jawab 10 soal benar hari ini
                        </span>
                      </div>
                      <span className="font-fantasy font-bold text-amber-600 dark:text-amber-400 tabular-nums">
                        {Math.min(10, m2Val)}/10
                      </span>
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="border-t border-neutral-100 dark:border-[#d4af37]/10" />

                  {/* Stats Mini Grid */}
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div className="bg-[#f5f5f7] dark:bg-[#20202d] rounded-[10px] p-2 flex flex-col justify-center">
                      <span className="text-[9px] text-ink-muted font-normal uppercase tracking-wider">Total Soal</span>
                      <span className="text-[14px] font-bold text-[#1d1d1f] dark:text-white font-fantasy tabular-nums mt-0.5">{totalSolved}</span>
                    </div>
                    <div className="bg-[#f5f5f7] dark:bg-[#20202d] rounded-[10px] p-2 flex flex-col justify-center">
                      <span className="text-[9px] text-ink-muted font-normal uppercase tracking-wider">Akurasi</span>
                      <span className="text-[14px] font-bold text-[#1d1d1f] dark:text-white font-fantasy tabular-nums mt-0.5">{accuracy}%</span>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* THREE LARGE HOME SCREEN BUTTONS/CARDS */}
          <div className="flex-1 flex flex-col justify-center space-y-4 pt-4">
            {/* Button 1: Practice Mode */}
            <m.button
              type="button"
              onClick={() => setShowPracticeIntro(true)}
              whileTap={{ scale: 0.97 }}
              className="w-full text-left bg-white dark:bg-[#1a1a24] border border-neutral-200 dark:border-[#d4af37]/35 rounded-[20px] p-5 flex items-center gap-4 transition shadow-[0_4px_12px_rgba(0,0,0,0.02)] hover:border-[#d4af37]/60"
            >
              <div className="w-12 h-12 bg-amber-500/10 dark:bg-amber-950/20 border border-[#d4af37]/30 rounded-full flex items-center justify-center text-xl shrink-0 shadow-sm animate-pulse">
                <span>📝</span>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-[16px] font-bold text-[#1d1d1f] dark:text-white mb-0.5 font-fantasy">
                  {t('menu.practiceButton')}
                </h3>
                <p className="text-[12px] text-ink-muted leading-snug font-normal">
                  {t('menu.practiceDesc')}
                </p>
              </div>
              <span className="text-amber-500 text-[11px] font-bold uppercase tracking-wider shrink-0 font-fantasy">Pilih ▶</span>
            </m.button>

            {/* Button 2: Shop / Warung Mode */}
            <m.button
              type="button"
              onClick={() => setShowWarungIntro(true)}
              whileTap={{ scale: 0.97 }}
              className="w-full text-left bg-gradient-to-r from-amber-500/5 to-yellow-500/5 dark:from-[#d4af37]/5 dark:to-[#1a1a24] border border-[#d4af37]/35 dark:border-[#d4af37]/50 rounded-[20px] p-5 flex items-center gap-4 transition shadow-[0_4px_12px_rgba(212,175,55,0.05)] hover:border-[#d4af37]/80"
            >
              <div className="w-12 h-12 bg-white dark:bg-[#20202d] border border-[#d4af37]/30 rounded-full flex items-center justify-center text-xl shrink-0 shadow-sm">
                <span>🏪</span>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-[16px] font-bold text-[#1d1d1f] dark:text-white mb-0.5 font-fantasy">
                  {t('menu.shopButton')}
                </h3>
                <p className="text-[12px] text-ink-muted leading-snug font-normal">
                  {t('menu.shopDesc')}
                </p>
              </div>
              <span className="text-amber-500 text-[11px] font-bold uppercase tracking-wider shrink-0 font-fantasy">Mulai ▶</span>
            </m.button>

            {/* Button 3: Quiz Mode */}
            <m.button
              type="button"
              onClick={() => {
                triggerHaptic(ImpactStyle.Light, settings.hapticEnabled);
                dispatch({ type: 'START_QUIZ' });
              }}
              whileTap={{ scale: 0.97 }}
              className="w-full text-left bg-white dark:bg-[#1a1a24] border border-neutral-200 dark:border-[#d4af37]/35 rounded-[20px] p-5 flex items-center gap-4 transition shadow-[0_4px_12px_rgba(0,0,0,0.02)] hover:border-[#d4af37]/60"
            >
              <div className="w-12 h-12 bg-purple-500/10 dark:bg-purple-950/20 border border-purple-500/30 rounded-full flex items-center justify-center text-xl shrink-0 shadow-sm">
                <span>🏆</span>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-[16px] font-bold text-[#1d1d1f] dark:text-white mb-0.5 font-fantasy">
                  {t('quiz.title')}
                </h3>
                <p className="text-[12px] text-ink-muted leading-snug font-normal">
                  {t('quiz.description')}
                </p>
              </div>
              <span className="text-amber-500 text-[11px] font-bold uppercase tracking-wider shrink-0 font-fantasy">Mulai ▶</span>
            </m.button>
          </div>
        </div>
      </main>

      {/* ── Practice Setup Bottom Sheet Modal ── */}
      <AnimatePresence>
        {showPracticeIntro && (
          <>
            {/* Backdrop */}
            <m.div
              key="practice-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowPracticeIntro(false)}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm z-40"
            />

            {/* Sheet Panel */}
            <m.div
              key="practice-sheet"
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 28, stiffness: 260 }}
              className="absolute bottom-0 left-0 right-0 z-50 bg-[#fafafc] dark:bg-[#1a1a24] rounded-t-[24px] border-t border-neutral-200 dark:border-[#d4af37]/30 overflow-hidden font-gacha"
            >
              {/* Gold accent line */}
              <div className="h-1 w-full bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-400" />

              {/* Drag handle */}
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 rounded-full bg-neutral-300 dark:bg-neutral-700" />
              </div>

              <div className="px-5 pb-6 pt-3 flex flex-col gap-4">
                {/* Header */}
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-amber-500/10 dark:bg-amber-950/30 border border-[#d4af37]/40 rounded-[14px] flex items-center justify-center text-2xl shrink-0">
                    📝
                  </div>
                  <div>
                    <p className="text-[10px] text-amber-600 dark:text-amber-400 font-bold uppercase tracking-widest font-fantasy">{t('menu.title')}</p>
                    <h2 className="text-[19px] font-bold text-[#1d1d1f] dark:text-white font-fantasy leading-tight">
                      {t('menu.practiceButton')}
                    </h2>
                  </div>
                </div>

                {/* Selectors section */}
                <div className="space-y-3 bg-white dark:bg-[#20202d] border border-neutral-200 dark:border-[#d4af37]/20 rounded-[16px] p-3.5 shadow-sm">
                  {/* Difficulty Selection */}
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-widest pl-1 font-fantasy">
                      {t('menu.difficultyLabel')}
                    </label>
                    <div className="flex bg-[#f5f5f7] dark:bg-[#1a1a24] p-0.5 rounded-[10px] gap-0.5 border border-neutral-200/40 dark:border-[#d4af37]/15">
                      {diffsList.map((diff) => {
                        const isSelected = selectedDifficulty === diff;
                        return (
                          <button
                            key={diff}
                            type="button"
                            onClick={() => setSelectedDifficulty(diff)}
                            className={`flex-1 py-1 px-1 rounded-[7px] text-[12px] transition-all min-h-[30px] ${
                              isSelected
                                ? 'bg-white dark:bg-[#20202d] text-amber-600 dark:text-amber-400 border border-neutral-200/50 dark:border-[#d4af37]/20 shadow-sm font-semibold'
                                : 'text-ink-muted font-normal hover:text-[#1d1d1f] dark:hover:text-white'
                            }`}
                          >
                            {t(`difficulty.${diff}`)}
                          </button>
                        );
                      })}
                    </div>
                    {/* Difficulty Description text */}
                    <div className="text-[10.5px] text-ink-muted font-normal pl-1 leading-snug">
                      {t(`difficulty.${selectedDifficulty}Desc`)}
                    </div>
                  </div>

                  {/* Mode Selection */}
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-widest pl-1 font-fantasy">
                      {t('menu.numberModeLabel')}
                    </label>
                    <div className="flex bg-[#f5f5f7] dark:bg-[#1a1a24] p-0.5 rounded-[10px] gap-0.5 border border-neutral-200/40 dark:border-[#d4af37]/15">
                      {(['integer', 'decimal'] as NumberMode[]).map((modeOpt) => {
                        const isSelected = selectedMode === modeOpt;
                        return (
                          <button
                            key={modeOpt}
                            type="button"
                            onClick={() => setSelectedMode(modeOpt)}
                            className={`flex-1 py-1 px-1 rounded-[7px] text-[12px] transition-all min-h-[30px] ${
                              isSelected
                                ? 'bg-white dark:bg-[#20202d] text-amber-600 dark:text-amber-400 border border-neutral-200/50 dark:border-[#d4af37]/20 shadow-sm font-semibold'
                                : 'text-ink-muted font-normal hover:text-[#1d1d1f] dark:hover:text-white'
                            }`}
                          >
                            {t(`mode.${modeOpt}`)}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  
                  {/* Session Length Preview */}
                  <div className="text-center pt-0.5 border-t border-neutral-100 dark:border-[#d4af37]/10 mt-2">
                    <span className="text-[9.5px] text-ink-muted font-normal uppercase tracking-wider">
                      {t('menu.sessionPreview', { questionCount: settings.questionCount })}
                    </span>
                  </div>
                </div>

                {/* Operations 2x2 Grid Selection */}
                <div className="grid grid-cols-2 gap-2.5">
                  {opsList.map((op) => (
                    <m.button
                      key={op.type}
                      type="button"
                      onClick={() => {
                        setShowPracticeIntro(false);
                        const config: SessionConfig = {
                          operation: op.type,
                          difficulty: selectedDifficulty,
                          mode: selectedMode,
                          questionCount: settings.questionCount,
                        };
                        dispatch({ type: 'START_SESSION', payload: config });
                      }}
                      whileTap={{ scale: 0.95 }}
                      className="min-h-[50px] flex items-center justify-between px-3 py-2.5 rounded-[16px] bg-white dark:bg-[#20202d] border border-neutral-200/70 dark:border-[#d4af37]/25 hover:border-[#d4af37]/50 shadow-sm transition-all duration-200 text-left"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-xl select-none shrink-0">{op.emoji}</span>
                        <div className="flex flex-col min-w-0">
                          <span className="text-[12.5px] font-bold text-[#1d1d1f] dark:text-white leading-tight font-fantasy truncate">
                            {t(`operations.${op.type}`)}
                          </span>
                        </div>
                      </div>
                      <span className="text-[10px] text-amber-500 font-bold font-fantasy shrink-0 ml-1">▶</span>
                    </m.button>
                  ))}
                </div>

                {/* Dismiss Button */}
                <div className="pt-1">
                  <m.button
                    type="button"
                    onClick={() => setShowPracticeIntro(false)}
                    whileTap={{ scale: 0.95 }}
                    className="w-full btn-secondary"
                  >
                    {t('warung.tipClose')}
                  </m.button>
                </div>
              </div>
            </m.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Warung Intro Briefing Modal ── */}
      <AnimatePresence>
        {showWarungIntro && (
          <>
            {/* Backdrop */}
            <m.div
              key="warung-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowWarungIntro(false)}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm z-40"
            />

            {/* Sheet Panel */}
            <m.div
              key="warung-sheet"
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 28, stiffness: 260 }}
              className="absolute bottom-0 left-0 right-0 z-50 bg-[#fafafc] dark:bg-[#1a1a24] rounded-t-[24px] border-t border-neutral-200 dark:border-[#d4af37]/30 overflow-hidden font-gacha"
            >
              {/* Gold accent line */}
              <div className="h-1 w-full bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-400" />

              {/* Drag handle */}
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 rounded-full bg-neutral-300 dark:bg-neutral-700" />
              </div>

              <div className="px-5 pb-6 pt-3 flex flex-col gap-4">
                {/* Header */}
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-amber-500/10 dark:bg-amber-950/30 border border-[#d4af37]/40 rounded-[14px] flex items-center justify-center text-2xl shrink-0">
                    🏪
                  </div>
                  <div>
                    <p className="text-[10px] text-amber-600 dark:text-amber-400 font-bold uppercase tracking-widest font-fantasy">{t('warung.gameMode')}</p>
                    <h2 className="text-[19px] font-bold text-[#1d1d1f] dark:text-white font-fantasy leading-tight">
                      {t('warung.bannerTitle')}
                    </h2>
                  </div>
                </div>

                {/* Description */}
                <p className="text-[13px] text-neutral-600 dark:text-neutral-300 leading-relaxed">
                  {t('warung.bannerDesc')}
                </p>

                {/* Rules list */}
                <div className="bg-white dark:bg-[#20202d] border border-neutral-200 dark:border-[#d4af37]/20 rounded-[14px] p-3.5 flex flex-col gap-2.5">
                  {[
                    { icon: '🛒', text: t('warung.introRule1') },
                    { icon: '💵', text: t('warung.introRule2') },
                    { icon: '👥', text: t('warung.introRule3') },
                    { icon: '💡', text: t('warung.introRule4') },
                  ].map(({ icon, text }) => (
                    <div key={text} className="flex items-start gap-2.5">
                      <span className="text-base shrink-0 mt-0.5">{icon}</span>
                      <span className="text-[12px] text-[#1d1d1f] dark:text-white/90 leading-snug">{text}</span>
                    </div>
                  ))}
                </div>

                {/* Interactive Difficulty Selector inside Popup */}
                <div className="space-y-2 bg-[#f5f5f7] dark:bg-[#20202d] border border-neutral-200/50 dark:border-[#d4af37]/15 rounded-[16px] p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400 font-fantasy uppercase tracking-wider pl-1">{t('warung.difficultyLabel')}</span>
                  </div>
                  
                  <div className="flex bg-[#e5e5ea] dark:bg-[#1a1a24] p-0.5 rounded-[10px] gap-0.5">
                    {diffsList.map((diff) => {
                      const isSelected = warungDifficulty === diff;
                      return (
                        <button
                          key={diff}
                          type="button"
                          onClick={() => setWarungDifficulty(diff)}
                          className={`flex-1 py-1 px-1 rounded-[7px] text-[12px] transition-all min-h-[30px] ${
                            isSelected
                              ? 'bg-white dark:bg-[#20202d] text-amber-600 dark:text-amber-400 border border-neutral-200/50 dark:border-[#d4af37]/20 shadow-sm font-semibold'
                              : 'text-ink-muted font-normal hover:text-[#1d1d1f] dark:hover:text-white'
                          }`}
                        >
                          {t(`difficulty.${diff}`)}
                        </button>
                      );
                    })}
                  </div>

                  {/* Dynamic Items and Voucher description based on difficulty */}
                  <div className="text-[11px] text-ink-muted font-normal pl-1 flex items-center justify-between">
                    <span>{t(`difficulty.${warungDifficulty}Desc`)}</span>
                    <span className={`px-2 py-0.5 rounded-full font-bold font-fantasy ${
                      warungDifficulty === 'hard'
                        ? 'bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400'
                        : warungDifficulty === 'medium'
                          ? 'bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400'
                          : 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400'
                    }`}>
                      {warungDifficulty === 'easy' && t('warung.introItemsEasy')}
                      {warungDifficulty === 'medium' && t('warung.introItemsMedium')}
                      {warungDifficulty === 'hard' && t('warung.introItemsHard')}
                    </span>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex gap-2.5 pt-1">
                  <m.button
                    type="button"
                    onClick={() => setShowWarungIntro(false)}
                    whileTap={{ scale: 0.95 }}
                    className="flex-1 btn-secondary"
                  >
                    {t('warung.btnBack')}
                  </m.button>
                  <m.button
                    type="button"
                    onClick={() => {
                      setShowWarungIntro(false);
                      dispatch({ type: 'START_WARUNG', payload: { difficulty: warungDifficulty } });
                    }}
                    whileTap={{ scale: 0.95 }}
                    className="flex-[2] btn-primary"
                  >
                    {t('warung.btnStart')}
                  </m.button>
                </div>
              </div>
            </m.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
export default MainMenu;
