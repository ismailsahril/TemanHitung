import React, { useState, useEffect, useCallback } from 'react';
import { m, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, BarChart2, ShieldAlert, Award } from 'lucide-react';
import { AppSettings, SessionAction, HighScoreMap, SessionHistoryEntry, TimerOption, AppLanguage, FontSizeScale, AppTheme, PetState } from '../types';
import { useTranslation } from '../hooks/useTranslation';
import SettingSection from './settings/SettingSection';
import SettingRow from './settings/SettingRow';
import NumberStepper from './settings/NumberStepper';

interface SettingsScreenProps {
  settings: AppSettings;
  highScores: HighScoreMap;
  recentSessions: SessionHistoryEntry[];
  pet: PetState;
  dispatch: React.Dispatch<SessionAction>;
  updateSetting: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => Promise<void>;
  clearHighScoreData: () => Promise<void>;
  resetPetOnly: () => Promise<void>;
}

/**
 * SettingsScreen component managing application configuration tabs (Gameplay, Profile, Language, Stats).
 * Includes statistics dashboard, SVG charting, profile name management, and resetting progress.
 */
export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  settings,
  highScores,
  recentSessions,
  pet,
  dispatch,
  updateSetting,
  clearHighScoreData,
  resetPetOnly,
}) => {
  const { t } = useTranslation();
  const [activeSubView, setActiveSubView] = useState<'main' | 'stats'>('main');
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showResetPetConfirm, setShowResetPetConfirm] = useState(false);
  const [localName, setLocalName] = useState(settings.userName);
  const [showLanguageReloadWarning, setShowLanguageReloadWarning] = useState(false);

  // Sync local name with settings userName
  useEffect(() => {
    setLocalName(settings.userName);
  }, [settings.userName]);

  const handleNameBlur = (): void => {
    const trimmed = localName.trim();
    if (trimmed !== settings.userName) {
      updateSetting('userName', trimmed);
      dispatch({ type: 'UPDATE_SETTINGS', payload: { userName: trimmed } });
    }
  };

  const handleNameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Enter') {
      (e.target as HTMLInputElement).blur();
    }
  };

  const handleLanguageChange = (lang: AppLanguage): void => {
    if (lang === settings.language) return;
    updateSetting('language', lang);
    dispatch({ type: 'UPDATE_SETTINGS', payload: { language: lang } });
    setShowLanguageReloadWarning(true);
    
    // Auto-reload after saving setting
    setTimeout(() => {
      window.location.reload();
    }, 400);
  };

  const handleNumberFormatChange = (format: 'id' | 'en'): void => {
    updateSetting('numberFormat', format);
    dispatch({ type: 'UPDATE_SETTINGS', payload: { numberFormat: format } });
  };

  const handleAutoAdvanceChange = (checked: boolean): void => {
    updateSetting('autoAdvance', checked);
    dispatch({ type: 'UPDATE_SETTINGS', payload: { autoAdvance: checked } });
  };

  const handleTimerChange = (opt: TimerOption): void => {
    updateSetting('timerPerQuestion', opt);
    dispatch({ type: 'UPDATE_SETTINGS', payload: { timerPerQuestion: opt } });
  };

  const handleQuestionCountChange = useCallback((val: number): void => {
    updateSetting('questionCount', val);
    dispatch({ type: 'UPDATE_SETTINGS', payload: { questionCount: val } });
  }, [updateSetting, dispatch]);

  const handleThemeChange = (theme: AppTheme): void => {
    updateSetting('theme', theme);
    dispatch({ type: 'UPDATE_SETTINGS', payload: { theme } });
  };

  const handleFontSizeChange = (scale: FontSizeScale): void => {
    updateSetting('fontSizeScale', scale);
    dispatch({ type: 'UPDATE_SETTINGS', payload: { fontSizeScale: scale } });
  };

  const handleToggle = (key: 'reduceAnimations' | 'soundEnabled' | 'hapticEnabled' | 'highContrast' | 'autoShowTip', value: boolean): void => {
    updateSetting(key, value);
    dispatch({ type: 'UPDATE_SETTINGS', payload: { [key]: value } });
  };

  const handleResetProgress = async (): Promise<void> => {
    await clearHighScoreData();
    updateSetting('userName', '');
    dispatch({ type: 'SET_HIGH_SCORES', payload: {} });
    dispatch({ type: 'SET_RECENT_SESSIONS', payload: [] });
    dispatch({ type: 'UPDATE_SETTINGS', payload: { userName: '' } });
    setLocalName('');
    setShowResetConfirm(false);
  };

  const handleResetPet = async (): Promise<void> => {
    await resetPetOnly();
    setShowResetPetConfirm(false);
  };

  // Back button
  const handleBack = (): void => {
    if (activeSubView === 'stats') {
      setActiveSubView('main');
    } else {
      dispatch({ type: 'BACK_TO_MENU' });
    }
  };

  // SVG Chart implementation
  const renderSVGChart = (): React.ReactNode => {
    if (recentSessions.length === 0) return null;

    // Chronological order: oldest to newest for plotting left-to-right
    const data = [...recentSessions].reverse();
    
    const chartW = 320;
    const chartH = 140;
    const paddingLeft = 30;
    const paddingRight = 10;
    const paddingTop = 15;
    const paddingBottom = 20;

    const graphW = chartW - paddingLeft - paddingRight;
    const graphH = chartH - paddingTop - paddingBottom;

    // Map each data point to x, y coordinates
    const points = data.map((d, index) => {
      const pct = d.outOf > 0 ? d.score / d.outOf : 0;
      const x = paddingLeft + (index * graphW) / (data.length - 1 || 1);
      const y = paddingTop + graphH - (pct * graphH);
      return { x, y, ...d };
    });

    // Create polyline points string
    const polylinePoints = points.map(p => `${p.x},${p.y}`).join(' ');

    return (
      <div className="bg-white dark:bg-[#1a1a24] border border-neutral-200 dark:border-[#d4af37]/20 rounded-[18px] p-4 my-4 shadow-sm">
        <h3 className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-widest mb-2 pl-1 font-fantasy">
          {t('stats.progressChart')} ({t('stats.historyCount', { count: data.length })})
        </h3>
        <div className="relative w-full flex justify-center">
          <svg viewBox={`0 0 ${chartW} ${chartH}`} className="w-full max-w-[320px] overflow-visible">
            {/* Grid Lines */}
            <line x1={paddingLeft} y1={paddingTop} x2={chartW - paddingRight} y2={paddingTop} className="stroke-neutral-100 dark:stroke-neutral-800" strokeWidth="1" strokeDasharray="3" />
            <line x1={paddingLeft} y1={paddingTop + graphH / 2} x2={chartW - paddingRight} y2={paddingTop + graphH / 2} className="stroke-neutral-100 dark:stroke-neutral-800" strokeWidth="1" strokeDasharray="3" />
            <line x1={paddingLeft} y1={paddingTop + graphH} x2={chartW - paddingRight} y2={paddingTop + graphH} className="stroke-neutral-200 dark:stroke-neutral-800" strokeWidth="1" />

            {/* Y Axis Labels */}
            <text x={paddingLeft - 8} y={paddingTop + 4} className="text-[10px] font-bold fill-ink-muted text-right font-fantasy" textAnchor="end">100%</text>
            <text x={paddingLeft - 8} y={paddingTop + graphH / 2 + 4} className="text-[10px] font-bold fill-ink-muted text-right font-fantasy" textAnchor="end">50%</text>
            <text x={paddingLeft - 8} y={paddingTop + graphH + 4} className="text-[10px] font-bold fill-ink-muted text-right font-fantasy" textAnchor="end">0%</text>

            {/* Main Path Line (No filled gradients) */}
            {points.length > 1 ? (
              <polyline points={polylinePoints} fill="none" className="stroke-amber-500 dark:stroke-amber-400" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            ) : null}

            {/* Data Dots */}
            {points.map((p) => (
              <g key={p.id}>
                <circle cx={p.x} cy={p.y} r="3.5" className="fill-amber-500 dark:fill-amber-400 stroke-white dark:stroke-[#1a1a24]" strokeWidth="1.5" />
                {/* Score label */}
                <text x={p.x} y={p.y - 7} className="text-[9px] font-bold fill-[#1d1d1f] dark:fill-white font-fantasy" textAnchor="middle">
                  {p.score}
                </text>
              </g>
            ))}

            {/* X Axis Labels */}
            {points.length > 0 && (
              <>
                <text x={points[0].x} y={chartH - 2} className="text-[8px] font-bold fill-ink-muted font-fantasy" textAnchor="start">
                  Oldest
                </text>
                <text x={points[points.length - 1].x} y={chartH - 2} className="text-[8px] font-bold fill-ink-muted font-fantasy" textAnchor="end">
                  Newest
                </text>
              </>
            )}
          </svg>
        </div>
      </div>
    );
  };

  const renderStatsSubView = (): React.ReactNode => {
    const ops: ('addition' | 'subtraction' | 'multiplication' | 'division')[] = ['addition', 'subtraction', 'multiplication', 'division'];
    const diffs: ('easy' | 'medium' | 'hard')[] = ['easy', 'medium', 'hard'];

    // Check if there is any high score data or adopted pet
    const hasData = Object.keys(highScores).length > 0 || pet.hasAdopted;

    return (
      <div className="flex-1 flex flex-col overflow-y-auto bg-[#fafafc] dark:bg-[#121218]">
        <div className="p-4 flex-1">
          {!hasData ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Award className="w-12 h-12 text-ink-muted mb-3" />
              <p className="text-ink-muted text-sm font-normal">{t('stats.noData')}</p>
            </div>
          ) : (
            <>
              {/* Pet & Warung Shop Stats */}
              {pet.hasAdopted && (
                <div className="bg-white dark:bg-[#1a1a24] border border-neutral-200 dark:border-[#d4af37]/20 rounded-[18px] p-4 shadow-sm mb-4 select-none">
                  <h3 className="text-sm font-bold text-[#1d1d1f] dark:text-white mb-3 font-fantasy flex items-center gap-1.5 uppercase tracking-wide">
                    <span>🏪</span> {t('warung.shopTitle')} & Pet
                  </h3>
                  
                  <div className="grid grid-cols-2 gap-3 text-left">
                    {/* Pet Status */}
                    <div className="bg-neutral-50 dark:bg-neutral-900/30 border border-neutral-100 dark:border-neutral-800/35 rounded-[12px] p-3 flex flex-col justify-center">
                      <span className="text-[10px] font-bold text-ink-muted uppercase tracking-wider font-fantasy">
                        {pet.name}
                      </span>
                      <span className="text-sm font-bold text-[#1d1d1f] dark:text-white mt-0.5 font-fantasy">
                        {t('pet.levelLabel', { level: pet.level })}
                      </span>
                      {/* Mini EXP progress bar */}
                      <div className="w-full bg-neutral-200 dark:bg-neutral-800 h-1.5 rounded-full overflow-hidden mt-1.5 border border-neutral-300/20 dark:border-neutral-700/20">
                        <div 
                          className="h-full bg-gradient-to-r from-amber-400 to-yellow-500 transition-all duration-300"
                          style={{ width: `${Math.min(100, (pet.exp / (pet.level * 100)) * 100)}%` }}
                        />
                      </div>
                      <span className="text-[9px] text-ink-muted mt-1 font-fantasy">
                        EXP {pet.exp} / {pet.level * 100}
                      </span>
                    </div>

                    {/* Coins & Active Counter */}
                    <div className="flex flex-col gap-2">
                      {/* Coins */}
                      <div className="bg-neutral-50 dark:bg-neutral-900/30 border border-neutral-100 dark:border-neutral-800/35 rounded-[12px] px-3 py-2 flex items-center justify-between">
                        <div className="flex flex-col">
                          <span className="text-[9px] font-bold text-ink-muted uppercase tracking-wider font-fantasy">
                            {t('warung.totalTipsReceipt')}
                          </span>
                          <span className="text-xs font-bold text-amber-600 dark:text-[#d4af37] font-fantasy mt-0.5">
                            🪙 {pet.coins}
                          </span>
                        </div>
                        <span className="text-lg">🪙</span>
                      </div>

                      {/* Active Upgrade Table */}
                      <div className="bg-neutral-50 dark:bg-neutral-900/30 border border-neutral-100 dark:border-neutral-800/35 rounded-[12px] px-3 py-2 flex items-center justify-between">
                        <div className="flex flex-col">
                          <span className="text-[9px] font-bold text-ink-muted uppercase tracking-wider font-fantasy">
                            {t('settings.theme')} Meja
                          </span>
                          <span className="text-[10px] font-bold text-[#1d1d1f] dark:text-white truncate font-fantasy mt-0.5 max-w-[110px]">
                            {t(
                              pet.activeUpgrade === 'table_wood'
                                ? 'warung.upgradeTablePremium'
                                : pet.activeUpgrade === 'table_neon'
                                  ? 'warung.upgradeTableNeon'
                                  : pet.activeUpgrade === 'mascot_cat'
                                    ? 'warung.upgradeMascotCat'
                                    : 'warung.upgradeTableDefault'
                            )}
                          </span>
                        </div>
                        <span className="text-sm">🪟</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Progress Line Chart */}
              {recentSessions.length > 0 && renderSVGChart()}

              {/* Accuracy Grid Table */}
              {Object.keys(highScores).length > 0 && (
                <div className="bg-white dark:bg-[#1a1a24] border border-neutral-200 dark:border-[#d4af37]/20 rounded-[18px] overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-[#f5f5f7] dark:bg-[#20202d] border-b border-neutral-200 dark:border-[#d4af37]/20">
                          <th className="p-3 text-left text-[10px] font-bold text-ink-muted uppercase tracking-widest font-fantasy w-[40%]">
                            {t('stats.operation')}
                          </th>
                          {diffs.map(d => (
                            <th key={d} className="p-3 text-center text-[10px] font-bold text-ink-muted uppercase tracking-widest font-fantasy">
                              {t(`difficulty.${d}`)}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-100 dark:divide-[#d4af37]/10">
                        {ops.map(op => (
                          <tr key={op} className="hover:bg-neutral-50/50 dark:hover:bg-[#20202d]/35 transition-colors">
                            <td className="p-3 text-left font-bold text-[#1d1d1f] dark:text-white text-sm font-fantasy">
                              {t(`operations.${op}`)}
                            </td>
                            {diffs.map(d => {
                              const entry = highScores[`${op}-${d}`];
                              return (
                                <td key={d} className="p-3 text-center text-sm">
                                  {entry ? (
                                    <div className="flex flex-col items-center">
                                      <span className="text-amber-600 dark:text-amber-400 font-bold font-fantasy">
                                        {entry.score}/{entry.outOf}
                                      </span>
                                      <span className="text-[10px] text-ink-muted font-normal font-fantasy">
                                        {Math.round((entry.score / entry.outOf) * 100)}%
                                      </span>
                                    </div>
                                  ) : (
                                    <span className="text-neutral-300 dark:text-neutral-700">-</span>
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    );
  };

  const renderMainSettings = (): React.ReactNode => {
    return (
      <div className="flex-1 flex flex-col overflow-y-auto pb-8 bg-[#fafafc] dark:bg-[#121218]">
        {/* Language Reload Warning */}
        {showLanguageReloadWarning && (
          <div className="mx-4 mt-2 p-3 bg-amber-500/10 dark:bg-amber-950/20 border border-[#d4af37]/35 rounded-xl flex items-start gap-2.5">
            <ShieldAlert className="w-5 h-5 text-amber-600 dark:text-amber-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs font-semibold text-amber-800 dark:text-amber-300 leading-normal font-fantasy">
              {t('settings.languageChangeWarning')}
            </p>
          </div>
        )}

        {/* Section 1: Gameplay */}
        <SettingSection title={t('settings.sectionSession')}>
          {/* Question Count Stepper */}
          <SettingRow
            label={t('settings.questionCount')}
            description={t('settings.questionCountDesc')}
          >
            <NumberStepper
              value={settings.questionCount}
              min={5}
              max={50}
              step={5}
              onChange={handleQuestionCountChange}
              formatDisplay={(n) => t('settings.questionsCountLabel', { count: n })}
            />
          </SettingRow>
          <div className="px-4 pb-4 pt-1 text-center bg-white dark:bg-[#1a1a24] border-t border-neutral-150 dark:border-neutral-800/40">
            <span className="text-xs text-ink-muted font-normal">
              {t('settings.stepperEstimation')}
            </span>
          </div>

          {/* Timer Per Question Selector */}
          <SettingRow
            label={t('settings.timerPerQuestion')}
            description={settings.timerPerQuestion > 0 ? t('settings.timerWarning') : undefined}
          >
            <div className="flex bg-[#f5f5f7] dark:bg-[#1a1a24] border border-neutral-200 dark:border-[#d4af37]/20 p-0.5 rounded-[12px] text-xs gap-0.5">
              {([0, 15, 30, 60] as TimerOption[]).map(val => (
                <button
                  key={val}
                  type="button"
                  onClick={() => handleTimerChange(val)}
                  className={`px-2.5 py-1.5 rounded-[9px] transition-all min-h-[32px] ${settings.timerPerQuestion === val
                    ? 'bg-white dark:bg-[#20202d] text-amber-600 dark:text-amber-400 border border-neutral-200 dark:border-[#d4af37]/30 shadow-sm font-semibold'
                    : 'text-ink-muted font-normal hover:text-[#1d1d1f] dark:hover:text-white'
                  }`}
                >
                  {val === 0 ? t('settings.timerOff') : `${val}s`}
                </button>
              ))}
            </div>
          </SettingRow>

          {/* Auto Advance Toggle */}
          <SettingRow
            label={t('settings.autoAdvance')}
            description={t('settings.autoAdvanceDesc')}
          >
            <button
              type="button"
              onClick={() => handleAutoAdvanceChange(!settings.autoAdvance)}
              className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors min-h-[24px] ${settings.autoAdvance ? 'bg-amber-500' : 'bg-neutral-200 dark:bg-neutral-800'}`}
              aria-label="Toggle Auto Advance"
            >
              <div className={`bg-white w-4 h-4 rounded-full transform transition-transform ${settings.autoAdvance ? 'translate-x-6' : 'translate-x-0'}`} />
            </button>
          </SettingRow>
        </SettingSection>

        {/* Section 2: Language & Format */}
        <SettingSection title={t('settings.sectionLanguage')}>
          {/* Language Cards */}
          <SettingRow label={t('settings.language')}>
            <div className="flex gap-2 text-xs font-semibold">
              {(['id', 'en'] as AppLanguage[]).map(langOpt => (
                <button
                  key={langOpt}
                  type="button"
                  onClick={() => handleLanguageChange(langOpt)}
                  className={`px-3 py-1.5 rounded-full transition min-h-[34px] min-w-[65px] border ${settings.language === langOpt
                    ? 'bg-amber-500/10 border-2 border-[#d4af37] text-amber-700 dark:text-amber-400 font-bold'
                    : 'bg-white dark:bg-[#1a1a24] border border-neutral-300 dark:border-[#d4af37]/20 text-ink-muted font-normal'
                  }`}
                >
                  {langOpt === 'id' ? t('settings.languageId') : t('settings.languageEn')}
                </button>
              ))}
            </div>
          </SettingRow>

          {/* Number format selection */}
          <SettingRow label={t('settings.numberFormat')}>
            <div className="flex gap-2 text-xs font-semibold">
              {(['id', 'en'] as const).map(fmtOpt => (
                <button
                  key={fmtOpt}
                  type="button"
                  onClick={() => handleNumberFormatChange(fmtOpt)}
                  className={`px-3 py-1.5 rounded-full transition min-h-[34px] border ${settings.numberFormat === fmtOpt
                    ? 'bg-amber-500/10 border-2 border-[#d4af37] text-amber-700 dark:text-amber-400 font-bold'
                    : 'bg-white dark:bg-[#1a1a24] border border-neutral-300 dark:border-[#d4af37]/20 text-ink-muted font-normal'
                  }`}
                >
                  {fmtOpt === 'id' ? t('settings.numberFormatId') : t('settings.numberFormatEn')}
                </button>
              ))}
            </div>
          </SettingRow>
        </SettingSection>

        {/* Section 3: Display & Accessibility theme */}
        <SettingSection title={t('settings.sectionDisplay')}>
          {/* Theme Control */}
          <SettingRow label={t('settings.theme')}>
            <div className="flex bg-[#f5f5f7] dark:bg-[#1a1a24] border border-neutral-200 dark:border-[#d4af37]/20 p-0.5 rounded-[12px] text-xs gap-0.5">
              {(['light', 'dark', 'system'] as AppTheme[]).map(themeOpt => (
                <button
                  key={themeOpt}
                  type="button"
                  onClick={() => handleThemeChange(themeOpt)}
                  className={`px-2.5 py-1.5 rounded-[9px] transition min-h-[32px] ${settings.theme === themeOpt
                    ? 'bg-white dark:bg-[#20202d] text-amber-600 dark:text-amber-400 border border-neutral-200 dark:border-[#d4af37]/30 shadow-sm font-semibold'
                    : 'text-ink-muted font-normal hover:text-[#1d1d1f] dark:hover:text-white'
                  }`}
                >
                  {themeOpt === 'light' ? t('settings.themeLight') : themeOpt === 'dark' ? t('settings.themeDark') : t('settings.themeSystem')}
                </button>
              ))}
            </div>
          </SettingRow>

          {/* Text scale */}
          <SettingRow label={t('settings.fontSize')}>
            <div className="flex bg-[#f5f5f7] dark:bg-[#1a1a24] border border-neutral-200 dark:border-[#d4af37]/20 p-0.5 rounded-[12px] text-xs gap-0.5">
              {(['normal', 'large', 'extra-large'] as FontSizeScale[]).map(scaleOpt => (
                <button
                  key={scaleOpt}
                  type="button"
                  onClick={() => handleFontSizeChange(scaleOpt)}
                  className={`px-2.5 py-1.5 rounded-[9px] transition min-h-[32px] ${settings.fontSizeScale === scaleOpt
                    ? 'bg-white dark:bg-[#20202d] text-amber-600 dark:text-amber-400 border border-neutral-200 dark:border-[#d4af37]/30 shadow-sm font-semibold'
                    : 'text-ink-muted font-normal hover:text-[#1d1d1f] dark:hover:text-white'
                  }`}
                >
                  {scaleOpt === 'normal' ? t('settings.fontNormal') : scaleOpt === 'large' ? t('settings.fontLarge') : t('settings.fontExtraLarge')}
                </button>
              ))}
            </div>
          </SettingRow>

          {/* Reduce animations */}
          <SettingRow
            label={t('settings.reduceAnimations')}
            description={t('settings.reduceAnimationsDesc')}
          >
            <button
              type="button"
              onClick={() => handleToggle('reduceAnimations', !settings.reduceAnimations)}
              className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors min-h-[24px] ${settings.reduceAnimations ? 'bg-amber-500' : 'bg-neutral-200 dark:bg-neutral-800'}`}
              aria-label="Toggle Reduce Animations"
            >
              <div className={`bg-white w-4 h-4 rounded-full transform transition-transform ${settings.reduceAnimations ? 'translate-x-6' : 'translate-x-0'}`} />
            </button>
          </SettingRow>
        </SettingSection>

        {/* Section 4: Audio & Feedback */}
        <SettingSection title={t('settings.sectionAudio')}>
          {/* Sound enable */}
          <SettingRow
            label={t('settings.soundEnabled')}
            description={t('settings.soundEnabledDesc')}
          >
            <button
              type="button"
              onClick={() => handleToggle('soundEnabled', !settings.soundEnabled)}
              className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors min-h-[24px] ${settings.soundEnabled ? 'bg-amber-500' : 'bg-neutral-200 dark:bg-neutral-800'}`}
              aria-label="Toggle Sound Effects"
            >
              <div className={`bg-white w-4 h-4 rounded-full transform transition-transform ${settings.soundEnabled ? 'translate-x-6' : 'translate-x-0'}`} />
            </button>
          </SettingRow>

          {/* Haptic enable */}
          <SettingRow
            label={t('settings.hapticEnabled')}
            description={t('settings.hapticEnabledDesc')}
          >
            <button
              type="button"
              onClick={() => handleToggle('hapticEnabled', !settings.hapticEnabled)}
              className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors min-h-[24px] ${settings.hapticEnabled ? 'bg-amber-500' : 'bg-neutral-200 dark:bg-neutral-800'}`}
              aria-label="Toggle Haptic Feedback"
            >
              <div className={`bg-white w-4 h-4 rounded-full transform transition-transform ${settings.hapticEnabled ? 'translate-x-6' : 'translate-x-0'}`} />
            </button>
          </SettingRow>
        </SettingSection>

        {/* Section 5: Profile */}
        <SettingSection title={t('settings.sectionProfile')}>
          {/* Name input */}
          <SettingRow
            label={t('settings.userName')}
            description={t('settings.userNameDesc')}
          >
            <div className="relative max-w-[160px] flex items-center">
              <input
                type="text"
                value={localName}
                onChange={(e) => setLocalName(e.target.value)}
                onBlur={handleNameBlur}
                onKeyDown={handleNameKeyDown}
                maxLength={30}
                placeholder={t('settings.userNamePlaceholder')}
                className="w-full px-3 py-1.5 text-sm bg-white dark:bg-[#1a1a24] border border-neutral-300 dark:border-[#d4af37]/20 rounded-full pr-10 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none font-semibold text-[#1d1d1f] dark:text-white"
              />
              <span className="absolute right-3 text-[10px] text-ink-muted font-semibold select-none">
                {localName.length}/30
              </span>
            </div>
          </SettingRow>

          {/* View Stats Row */}
          <button
            type="button"
            onClick={() => setActiveSubView('stats')}
            className="w-full flex items-center justify-between p-4 hover:bg-neutral-50 dark:hover:bg-[#1d1d1f]/35 transition text-left min-h-[58px]"
          >
            <div className="flex flex-col">
              <span className="text-[15px] font-bold text-[#1d1d1f] dark:text-white flex items-center gap-1.5 font-fantasy">
                <BarChart2 className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                {t('settings.viewStats')}
              </span>
              <span className="text-xs text-ink-muted mt-0.5">
                {t('settings.viewStatsDesc')}
              </span>
            </div>
            <ChevronRight className="w-5 h-5 text-ink-muted" />
          </button>

          {/* Reset Pet Action */}
          <SettingRow
            label={t('settings.resetPet')}
            description={t('settings.resetPetDesc')}
            danger
          >
            <button
              type="button"
              onClick={() => setShowResetPetConfirm(true)}
              className="px-4 py-1.5 text-xs font-bold text-white bg-red-600 hover:bg-red-700 transition rounded-[8px] min-h-[34px] flex items-center justify-center shadow-sm"
            >
              Reset
            </button>
          </SettingRow>

          {/* Reset Progress Action */}
          <SettingRow
            label={t('settings.resetProgress')}
            description={t('settings.resetProgressDesc')}
            danger
          >
            <button
              type="button"
              onClick={() => setShowResetConfirm(true)}
              className="px-4 py-1.5 text-xs font-bold text-white bg-red-600 hover:bg-red-700 transition rounded-[8px] min-h-[34px] flex items-center justify-center shadow-sm"
            >
              Reset
            </button>
          </SettingRow>
        </SettingSection>

        {/* Section 6: Accessibility */}
        <SettingSection title={t('settings.sectionAccessibility')}>
          {/* High Contrast */}
          <SettingRow
            label={t('settings.highContrast')}
            description={t('settings.highContrastDesc')}
          >
            <button
              type="button"
              onClick={() => handleToggle('highContrast', !settings.highContrast)}
              className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors min-h-[24px] ${settings.highContrast ? 'bg-amber-500' : 'bg-neutral-200 dark:bg-neutral-800'}`}
              aria-label="Toggle High Contrast Mode"
            >
              <div className={`bg-white w-4 h-4 rounded-full transform transition-transform ${settings.highContrast ? 'translate-x-6' : 'translate-x-0'}`} />
            </button>
          </SettingRow>

          {/* Auto Show Tip */}
          <SettingRow
            label={t('settings.autoShowTip')}
            description={t('settings.autoShowTipDesc')}
          >
            <button
              type="button"
              onClick={() => handleToggle('autoShowTip', !settings.autoShowTip)}
              className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors min-h-[24px] ${settings.autoShowTip ? 'bg-amber-500' : 'bg-neutral-200 dark:bg-neutral-800'}`}
              aria-label="Toggle Auto Show Tip"
            >
              <div className={`bg-white w-4 h-4 rounded-full transform transition-transform ${settings.autoShowTip ? 'translate-x-6' : 'translate-x-0'}`} />
            </button>
          </SettingRow>
        </SettingSection>
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col bg-[#fafafc] dark:bg-[#121218] overflow-hidden font-gacha" style={{ fontSize: 'calc(1rem * var(--font-scale, 1))' }}>
      {/* Header */}
      <header className="flex-shrink-0 flex items-center justify-between border-b border-neutral-200 dark:border-[#d4af37]/20 p-4 bg-white dark:bg-[#1a1a24]">
        <m.button
          type="button"
          onClick={handleBack}
          whileTap={{ scale: 0.95 }}
          className="btn-icon"
          aria-label={t('settings.backButton')}
        >
          <ChevronLeft className="w-6 h-6" />
        </m.button>
        <h1 className="text-[17px] font-bold text-[#1d1d1f] dark:text-white tracking-wide font-fantasy">
          {activeSubView === 'stats' ? t('stats.title') : t('settings.title')}
        </h1>
        <div className="w-12" /> {/* Layout balancer */}
      </header>

      {/* Main Container */}
      {activeSubView === 'stats' ? renderStatsSubView() : renderMainSettings()}

      {/* Reset Confirmation Overlay */}
      <AnimatePresence>
        {showResetConfirm && (
          <m.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-neutral-950/60 backdrop-blur-md flex items-center justify-center p-4 z-50"
            role="alertdialog"
            aria-modal="true"
          >
            <m.div
              initial={{ scale: 0.9, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 30 }}
              transition={{ type: 'spring', damping: 20, stiffness: 300 }}
              className="bg-white dark:bg-[#1c1c27] w-full max-w-sm rounded-[24px] p-6 border-2 border-red-500/30 dark:border-red-500/20 text-center shadow-[0_20px_50px_rgba(239,68,68,0.15)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden relative"
            >
              {/* Decorative top strip */}
              <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-red-500 via-rose-500 to-amber-500" />
              
              {/* Alert icon with breathing glow */}
              <m.div 
                animate={{ scale: [1, 1.05, 1], boxShadow: ['0 0 0 0 rgba(239,68,68,0.2)', '0 0 0 12px rgba(239,68,68,0)', '0 0 0 0 rgba(239,68,68,0)'] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="w-14 h-14 bg-red-500/10 dark:bg-red-500/5 rounded-full flex items-center justify-center text-red-500 mx-auto mb-4 border border-red-500/20"
              >
                <ShieldAlert className="w-7 h-7" />
              </m.div>
              
              <h3 className="text-lg font-bold text-[#1d1d1f] dark:text-white mb-2 font-fantasy tracking-wide">
                {t('settings.resetProgress')}
              </h3>
              
              <p className="text-[13px] text-ink-muted mb-6 leading-relaxed px-2">
                {t('settings.resetConfirm')}
              </p>
              
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={handleResetProgress}
                  className="btn-danger"
                >
                  {t('settings.resetConfirmYes')}
                </button>
                <button
                  type="button"
                  onClick={() => setShowResetConfirm(false)}
                  className="btn-secondary"
                >
                  {t('settings.resetConfirmNo')}
                </button>
              </div>
            </m.div>
          </m.div>
        )}

        {showResetPetConfirm && (
          <m.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-neutral-950/60 backdrop-blur-md flex items-center justify-center p-4 z-50"
            role="alertdialog"
            aria-modal="true"
          >
            <m.div
              initial={{ scale: 0.9, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 30 }}
              transition={{ type: 'spring', damping: 20, stiffness: 300 }}
              className="bg-white dark:bg-[#1c1c27] w-full max-w-sm rounded-[24px] p-6 border-2 border-red-500/30 dark:border-red-500/20 text-center shadow-[0_20px_50px_rgba(239,68,68,0.15)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden relative"
            >
              {/* Decorative top strip */}
              <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-red-500 via-rose-500 to-amber-500" />
              
              {/* Alert icon with breathing glow */}
              <m.div 
                animate={{ scale: [1, 1.05, 1], boxShadow: ['0 0 0 0 rgba(239,68,68,0.2)', '0 0 0 12px rgba(239,68,68,0)', '0 0 0 0 rgba(239,68,68,0)'] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="w-14 h-14 bg-red-500/10 dark:bg-red-500/5 rounded-full flex items-center justify-center text-red-500 mx-auto mb-4 border border-red-500/20"
              >
                <ShieldAlert className="w-7 h-7" />
              </m.div>
              
              <h3 className="text-lg font-bold text-[#1d1d1f] dark:text-white mb-2 font-fantasy tracking-wide">
                {t('settings.resetPet')}
              </h3>
              
              <p className="text-[13px] text-ink-muted mb-6 leading-relaxed px-2">
                {t('settings.resetPetConfirm')}
              </p>
              
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={handleResetPet}
                  className="btn-danger"
                >
                  {t('settings.resetConfirmYes')}
                </button>
                <button
                  type="button"
                  onClick={() => setShowResetPetConfirm(false)}
                  className="btn-secondary"
                >
                  {t('settings.resetConfirmNo')}
                </button>
              </div>
            </m.div>
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
};
export default SettingsScreen;
