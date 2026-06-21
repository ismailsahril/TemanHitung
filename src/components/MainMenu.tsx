import React, { useState } from 'react';
import { m } from 'framer-motion';
import { Settings } from 'lucide-react';
import { SessionAction, AppSettings, Operation, Difficulty, NumberMode, SessionConfig, PetState } from '../types';
import { useTranslation } from '../hooks/useTranslation';
import MathPet from './MathPet';

interface MainMenuProps {
  settings: AppSettings;
  dispatch: React.Dispatch<SessionAction>;
  pet: PetState;
  updateSetting: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => Promise<void>;
}

/**
 * MainMenu component displaying practice options (operations, difficulties, modes).
 * Also displays the companion pet greeting box and the banner to enter Kasir Warung mode.
 */
export const MainMenu: React.FC<MainMenuProps> = ({ settings, dispatch, pet, updateSetting }) => {
  const { t } = useTranslation();

  // Internal selection state
  const [selectedOperation, setSelectedOperation] = useState<Operation | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>('easy');
  const [selectedMode, setSelectedMode] = useState<NumberMode>('integer');
  
  // Show error helper text if CTA clicked without operation
  const [showError, setShowError] = useState(false);

  // Local state for the username prompt if not set
  const [tempName, setTempName] = useState('');

  const handleStartSession = (): void => {
    if (!selectedOperation) {
      setShowError(true);
      return;
    }
    setShowError(false);

    const config: SessionConfig = {
      operation: selectedOperation,
      difficulty: selectedDifficulty,
      mode: selectedMode,
      questionCount: settings.questionCount,
    };

    dispatch({ type: 'START_SESSION', payload: config });
  };

  const handleSaveName = async (): Promise<void> => {
    const trimmed = tempName.trim();
    if (trimmed) {
      await updateSetting('userName', trimmed);
      dispatch({ type: 'UPDATE_SETTINGS', payload: { userName: trimmed } });
    }
  };

  const handleSelectOperation = (op: Operation): void => {
    setSelectedOperation(op);
    setShowError(false);
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
          className="min-h-[44px] min-w-[44px] p-2.5 flex items-center justify-center rounded-full bg-[#f5f5f7] dark:bg-[#272729] hover:bg-[#e8e8ed] dark:hover:bg-[#323236] text-[#1d1d1f] dark:text-white transition border border-neutral-200 dark:border-neutral-700/30"
          aria-label={t('menu.settingsButton')}
        >
          <Settings className="w-5.5 h-5.5" />
        </m.button>
      </header>

      {/* Main Content */}
      <main className="px-5 py-5 flex-1 flex flex-col justify-between space-y-5">
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
          <div className="rpg-panel rpg-gold-trim p-3.5 flex items-center gap-3.5 relative overflow-hidden bg-gradient-to-r from-amber-500/5 to-yellow-500/5 dark:from-[#d4af37]/5 dark:to-[#1a1a24]">
            {/* Pet rendering */}
            <div className="flex-shrink-0">
              <MathPet type={pet.type} level={pet.level} animationState="idle" className="w-16 h-16 sm:w-18 sm:h-18" />
            </div>

            {/* Pet Info & Speech Bubble */}
            <div className="flex-1 flex flex-col justify-center min-w-0">
              <div className="flex items-baseline justify-between mb-0.5 gap-2">
                <span className="text-xs font-semibold text-[#1d1d1f] dark:text-white truncate">
                  {pet.name}
                </span>
                
                {/* Level Crest Shield Emblem */}
                <div className="flex items-center gap-1 bg-amber-500/10 dark:bg-[#d4af37]/15 border border-[#d4af37]/40 px-2 py-0.5 rounded-[6px] text-amber-600 dark:text-[#d4af37] shrink-0 font-fantasy text-[10px] font-bold tracking-wider">
                  <svg className="w-3 h-3 text-amber-500" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2L4 6v6c0 5.25 3.42 10.16 8 11.5 4.58-1.34 8-6.25 8-11.5V6l-8-4z" />
                  </svg>
                  {t('pet.levelLabel', { level: pet.level })}
                </div>
              </div>

              {/* Localized Pet Speech bubble */}
              <div className="bg-[#fafafc] dark:bg-[#20202d] border border-neutral-200 dark:border-[#d4af37]/20 px-3 py-1.5 rounded-[12px] text-[11px] font-normal text-[#1d1d1f] dark:text-white/90 leading-normal relative mb-2 shadow-inner">
                {t(`pet.${pet.type}Greeting`, { name: settings.userName || t('pet.defaultGreetingName') })}
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
        )}

        {/* Title */}
        <div className="text-left">
          <h2 className="text-[17px] font-bold text-[#1d1d1f] dark:text-white tracking-wide font-fantasy">
            {t('menu.title')}
          </h2>
          {showError && (
            <p className="text-[13px] text-wrong font-semibold mt-1">
              ⚠️ {t('menu.selectOperationHint')}
            </p>
          )}
        </div>

        {/* Section 1: Operation Grid */}
        <div className="grid grid-cols-2 gap-2.5">
          {opsList.map((op) => {
            const isSelected = selectedOperation === op.type;
            return (
              <m.button
                key={op.type}
                type="button"
                onClick={() => handleSelectOperation(op.type)}
                whileTap={{ scale: 0.95 }}
                className={`min-h-[46px] flex items-center justify-center px-4 py-2 rounded-[14px] border text-center transition-all relative ${
                  isSelected
                    ? 'bg-amber-500/10 border-2 border-[#d4af37] text-amber-700 dark:text-amber-400 font-semibold shadow-[0_0_15px_rgba(212,175,55,0.25)]'
                    : 'bg-white dark:bg-[#1a1a24] border border-neutral-300/70 dark:border-[#d4af37]/25 text-[#1d1d1f] dark:text-white font-normal hover:border-[#d4af37]/50'
                }`}
                aria-label={t(`operations.${op.type}`)}
              >
                <span className="text-lg mr-2 select-none">{op.emoji}</span>
                <span className="text-xs sm:text-sm leading-tight">{t(`operations.${op.type}`)}</span>
              </m.button>
            );
          })}
        </div>

        {/* Section 2: Difficulty Selection */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-widest pl-1 font-fantasy">
            {t('menu.difficultyLabel')}
          </label>
          <div className="flex bg-[#f5f5f7] dark:bg-[#1a1a24] p-0.5 rounded-[12px] gap-0.5 border border-neutral-200/70 dark:border-[#d4af37]/20">
            {diffsList.map((diff) => {
              const isSelected = selectedDifficulty === diff;
              return (
                <button
                  key={diff}
                  type="button"
                  onClick={() => setSelectedDifficulty(diff)}
                  className={`flex-1 py-1.5 px-1 rounded-[9px] text-[13px] transition-all min-h-[34px] ${
                    isSelected
                      ? 'bg-white dark:bg-[#20202d] text-amber-600 dark:text-amber-400 border border-neutral-200 dark:border-[#d4af37]/30 shadow-sm font-semibold'
                      : 'text-ink-muted font-normal hover:text-[#1d1d1f] dark:hover:text-white'
                  }`}
                >
                  {t(`difficulty.${diff}`)}
                </button>
              );
            })}
          </div>
          {/* Difficulty Description text */}
          <div className="text-[11px] text-ink-muted font-normal text-center pl-1 leading-normal">
            {t(`difficulty.${selectedDifficulty}Desc`)}
          </div>
        </div>

        {/* Section 3: Mode Selection */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-widest pl-1 font-fantasy">
            {t('menu.numberModeLabel')}
          </label>
          <div className="flex bg-[#f5f5f7] dark:bg-[#1a1a24] p-0.5 rounded-[12px] gap-0.5 border border-neutral-200/70 dark:border-[#d4af37]/20">
            {(['integer', 'decimal'] as NumberMode[]).map((modeOpt) => {
              const isSelected = selectedMode === modeOpt;
              return (
                <button
                  key={modeOpt}
                  type="button"
                  onClick={() => setSelectedMode(modeOpt)}
                  className={`flex-1 py-1.5 px-1 rounded-[9px] text-[13px] transition-all min-h-[34px] ${
                    isSelected
                      ? 'bg-white dark:bg-[#20202d] text-amber-600 dark:text-amber-400 border border-neutral-200 dark:border-[#d4af37]/30 shadow-sm font-semibold'
                      : 'text-ink-muted font-normal hover:text-[#1d1d1f] dark:hover:text-white'
                  }`}
                >
                  {t(`mode.${modeOpt}`)}
                </button>
              );
            })}
          </div>
        </div>

        {/* Action Button & Badge */}
        <div className="pt-2 flex flex-col items-center space-y-2">
          <m.button
            type="button"
            onClick={handleStartSession}
            whileTap={selectedOperation ? { scale: 0.95 } : undefined}
            className={`w-full py-3 rounded-[14px] text-[17px] font-semibold text-white transition-all flex items-center justify-center min-h-[44px] ${
              selectedOperation
                ? 'bg-amber-500 hover:bg-amber-600 shadow-[0_4px_15px_rgba(245,158,11,0.35)]'
                : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-400 dark:text-neutral-600 border border-neutral-300 dark:border-neutral-700/50 cursor-not-allowed'
            }`}
          >
            {t('menu.startButton')}
          </m.button>
          
          <span className="text-[11px] text-ink-muted font-normal uppercase tracking-wider">
            {t('menu.sessionPreview', { questionCount: settings.questionCount })}
          </span>
        </div>

        {/* Divider */}
        <div className="border-t border-neutral-200 dark:border-[#d4af37]/25 pt-2" />

        {/* Section 4: Mode Warung Card */}
        <m.button
          type="button"
          onClick={() => dispatch({ type: 'START_WARUNG', payload: { difficulty: selectedDifficulty } })}
          whileTap={{ scale: 0.95 }}
          className="w-full text-left bg-gradient-to-r from-amber-500/5 to-yellow-500/5 dark:from-[#d4af37]/5 dark:to-[#1a1a24] border border-[#d4af37]/30 dark:border-[#d4af37]/45 rounded-[18px] p-4 flex items-center gap-4 transition shadow-[0_4px_12px_rgba(212,175,55,0.05)] hover:border-[#d4af37]/80"
        >
          <div className="w-12 h-12 bg-white dark:bg-[#20202d] border border-[#d4af37]/30 rounded-full flex items-center justify-center text-xl shrink-0 shadow-sm">
            <span>🏪</span>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-[15px] font-bold text-[#1d1d1f] dark:text-white mb-0.5 font-fantasy">
              {t('warung.bannerTitle')}
            </h3>
            <p className="text-[12px] text-ink-muted leading-snug font-normal">
              {t('warung.bannerDesc')}
            </p>
          </div>
        </m.button>
      </main>
    </div>
  );
};
export default MainMenu;
