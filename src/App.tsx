import React, { Suspense, useEffect, useState, useRef, useCallback } from 'react';
import { App as CapApp } from '@capacitor/app';
import { m, AnimatePresence } from 'framer-motion';
import { HelpCircle } from 'lucide-react';
import { useSessionReducer } from './hooks/useSessionReducer';
import { useSettings } from './hooks/useSettings';
import { useHighScore } from './hooks/useHighScore';
import { LanguageContext } from './hooks/useTranslation';
import SplashScreen from './components/SplashScreen';

import { usePet } from './hooks/usePet';
import { PetType } from './types';
import { triggerHaptic } from './utils/hapticEngine';
import { ImpactStyle } from '@capacitor/haptics';
import { id } from './i18n/id';
import { en } from './i18n/en';

// Lazy-load components to optimize initial page loading and code splitting
const MainMenu = React.lazy(() => import('./components/MainMenu'));
const GameBoard = React.lazy(() => import('./components/GameBoard'));
const ScoreSummary = React.lazy(() => import('./components/ScoreSummary'));
const SettingsScreen = React.lazy(() => import('./components/SettingsScreen'));
const AdoptionScreen = React.lazy(() => import('./components/AdoptionScreen'));
const WarungBoard = React.lazy(() => import('./components/WarungBoard'));
const QuizBoard = React.lazy(() => import('./components/QuizBoard'));

export const App: React.FC = () => {
  const { state, dispatch } = useSessionReducer();
  const [showWebSplash, setShowWebSplash] = useState(true);
  const [showQuitConfirm, setShowQuitConfirm] = useState(false);
  const hardwareBackRef = useRef<(() => void) | null>(null);

  const registerBackButton = useCallback((handler: (() => void) | null) => {
    hardwareBackRef.current = handler;
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowWebSplash(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);
  
  const { 
    settings, 
    updateSetting, 
    isLoaded: isSettingsLoaded 
  } = useSettings();

  const { 
    highScores, 
    recentSessions, 
    isHighScoreLoaded, 
    saveSessionResult, 
    clearAllData 
  } = useHighScore();

  const {
    petState,
    adoptPet,
    feedPet,
    clearPetData,
    addCoins,
    buyUpgrade,
    equipUpgrade,
    interactWithPet,
    isPetLoaded
  } = usePet();

  // 1. Sync persistent settings to reducer when loaded
  useEffect(() => {
    if (isSettingsLoaded) {
      dispatch({ type: 'UPDATE_SETTINGS', payload: settings });
    }
  }, [isSettingsLoaded, settings, dispatch]);

  // 2. Sync persistent scores to reducer when loaded
  useEffect(() => {
    if (isHighScoreLoaded) {
      dispatch({ type: 'SET_HIGH_SCORES', payload: highScores });
      dispatch({ type: 'SET_RECENT_SESSIONS', payload: recentSessions });
    }
  }, [isHighScoreLoaded, highScores, recentSessions, dispatch]);

  // 3. Sync persistent pet companion state when loaded
  useEffect(() => {
    if (isPetLoaded) {
      dispatch({ type: 'SET_PET_STATE', payload: petState });
      if (!petState.hasAdopted) {
        dispatch({ type: 'RESET_PET_STATE' });
      }
    }
  }, [isPetLoaded, petState, dispatch]);

  // 4. Handle Android Hardware Back Button navigation
  useEffect(() => {
    const backButtonListener = CapApp.addListener('backButton', () => {
      if (hardwareBackRef.current) {
        hardwareBackRef.current();
      } else if (state.phase === 'summary') {
        dispatch({ type: 'RESTART' });
      } else if (state.phase === 'settings') {
        dispatch({ type: 'BACK_TO_MENU' });
      } else {
        // onboarding or menu -> exit app
        CapApp.exitApp();
      }
    });

    return () => {
      backButtonListener.then((listener) => listener.remove());
    };
  }, [state.phase, dispatch]);

  const handleAdoptPet = async (type: PetType, name: string, userName: string): Promise<void> => {
    await adoptPet(type, name);
    dispatch({ type: 'ADOPT_PET', payload: { type, name } });
    if (userName.trim()) {
      await updateSetting('userName', userName.trim());
      dispatch({ type: 'UPDATE_SETTINGS', payload: { userName: userName.trim() } });
    }
  };

  const handleClearAllProgress = async (): Promise<void> => {
    await clearAllData();
    await clearPetData();
    dispatch({ type: 'RESET_PET_STATE' });
  };

  const handleResetPetOnly = async (): Promise<void> => {
    await clearPetData();
    dispatch({ type: 'RESET_PET_STATE' });
  };

  const handleAddCoins = async (amount: number): Promise<void> => {
    await addCoins(amount);
    dispatch({ type: 'ADD_COINS', payload: { amount } });
  };

  const handleBuyUpgrade = async (id: string, cost: number): Promise<void> => {
    await buyUpgrade(id, cost);
    dispatch({ type: 'BUY_UPGRADE', payload: { id, cost } });
  };

  const handleEquipUpgrade = async (id: string): Promise<void> => {
    await equipUpgrade(id);
    dispatch({ type: 'EQUIP_UPGRADE', payload: { id } });
  };

  const triggerQuitConfirm = useCallback(() => {
    triggerHaptic(ImpactStyle.Medium, state.settings.hapticEnabled);
    setShowQuitConfirm(true);
  }, [state.settings.hapticEnabled]);

  const handleConfirmExit = useCallback(() => {
    triggerHaptic(ImpactStyle.Light, state.settings.hapticEnabled);
    setShowQuitConfirm(false);
    dispatch({ type: 'BACK_TO_MENU' });
  }, [state.settings.hapticEnabled, dispatch]);

  const handleCancelExit = useCallback(() => {
    triggerHaptic(ImpactStyle.Light, state.settings.hapticEnabled);
    setShowQuitConfirm(false);
  }, [state.settings.hapticEnabled]);

  // Active Screen Routing mapping
  const renderScreen = (): React.ReactNode => {
    if (!isSettingsLoaded || !isHighScoreLoaded || !isPetLoaded || showWebSplash) {
      return <SplashScreen />;
    }

    switch (state.phase) {
      case 'onboarding':
        return <AdoptionScreen onAdopt={handleAdoptPet} />;
      case 'menu':
        return (
          <MainMenu
            settings={state.settings}
            dispatch={dispatch}
            pet={state.pet}
            updateSetting={updateSetting}
            interactWithPet={interactWithPet}
            recentSessions={state.recentSessions}
          />
        );
      case 'playing':
        return (
          <GameBoard 
            state={state} 
            dispatch={dispatch} 
            onBack={triggerQuitConfirm}
            registerBackButton={registerBackButton}
          />
        );
      case 'warung':
        return (
          <WarungBoard 
            state={state} 
            dispatch={dispatch} 
            feedPet={feedPet} 
            addCoins={handleAddCoins}
            buyUpgrade={handleBuyUpgrade}
            equipUpgrade={handleEquipUpgrade}
            onBack={triggerQuitConfirm}
            registerBackButton={registerBackButton}
          />
        );
      case 'quiz':
        return (
          <QuizBoard
            state={state}
            dispatch={dispatch}
            feedPet={feedPet}
            addCoins={handleAddCoins}
            onBack={triggerQuitConfirm}
            registerBackButton={registerBackButton}
          />
        );
      case 'summary':
        return (
          <ScoreSummary 
            state={state} 
            dispatch={dispatch} 
            saveSessionResult={saveSessionResult} 
            feedPet={feedPet}
            addCoins={handleAddCoins}
          />
        );
      case 'settings':
        return (
          <SettingsScreen
            settings={state.settings}
            highScores={state.highScores}
            recentSessions={state.recentSessions}
            pet={state.pet}
            dispatch={dispatch}
            updateSetting={updateSetting}
            clearHighScoreData={handleClearAllProgress}
            resetPetOnly={handleResetPetOnly}
          />
        );
      default:
        return state.pet.hasAdopted 
          ? (
            <MainMenu
              settings={state.settings}
              dispatch={dispatch}
              pet={state.pet}
              updateSetting={updateSetting}
              interactWithPet={interactWithPet}
              recentSessions={state.recentSessions}
            />
          )
          : <AdoptionScreen onAdopt={handleAdoptPet} />;
    }
  };

  return (
    <LanguageContext.Provider value={state.settings.language}>
      {/* Outer Viewport Wrapper */}
      <div className="min-h-screen bg-[#f5f5f7] dark:bg-black flex items-center justify-center p-0 sm:p-4 transition-colors duration-250">
        {/* Card Widget Frame (Full screen on mobile, phone-sized on desktop) */}
        <div className="w-full max-w-md min-h-screen sm:min-h-0 sm:h-[800px] bg-white dark:bg-[#1d1d1f] sm:rounded-[18px] overflow-hidden flex flex-col relative transition-colors duration-250 border border-[#e0e0e0] dark:border-[#2a2a2c]">
          
          <Suspense fallback={
            <div className="flex-1 flex items-center justify-center bg-white dark:bg-[#1d1d1f]">
              <div className="animate-spin w-8 h-8 border-4 border-[#0066cc] border-t-transparent rounded-full" />
            </div>
          }>
            {renderScreen()}
          </Suspense>

          <AnimatePresence>
            {showQuitConfirm && (
              <m.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-neutral-950/60 backdrop-blur-md flex items-center justify-center p-4 z-[60]"
                role="alertdialog"
                aria-modal="true"
              >
                <m.div
                  initial={{ scale: 0.9, y: 30 }}
                  animate={{ scale: 1, y: 0 }}
                  exit={{ scale: 0.9, y: 30 }}
                  transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                  className="bg-white dark:bg-[#1c1c27] w-full max-w-xs rounded-[24px] p-6 border border-amber-500/30 dark:border-amber-500/20 text-center shadow-[0_20px_50px_rgba(245,158,11,0.15)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden relative"
                >
                  {/* Decorative top strip */}
                  <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-amber-500 via-yellow-500 to-orange-500" />
                  
                  {/* Warning icon */}
                  <div className="w-14 h-14 bg-amber-500/10 dark:bg-amber-500/5 rounded-full flex items-center justify-center text-amber-500 mx-auto mb-4 border border-amber-500/20">
                    <HelpCircle className="w-7 h-7" />
                  </div>
                  
                  <h3 className="text-lg font-bold text-[#1d1d1f] dark:text-white mb-2 font-fantasy tracking-wide">
                    {state.settings.language === 'en' ? en.quitConfirm.title : id.quitConfirm.title}
                  </h3>
                  
                  <p className="text-[13px] text-ink-muted mb-6 leading-relaxed px-2">
                    {state.settings.language === 'en' ? en.quitConfirm.desc : id.quitConfirm.desc}
                  </p>
                  
                  <div className="flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={handleConfirmExit}
                      className="btn-danger"
                    >
                      {state.settings.language === 'en' ? en.quitConfirm.yes : id.quitConfirm.yes}
                    </button>
                    <button
                      type="button"
                      onClick={handleCancelExit}
                      className="btn-secondary"
                    >
                      {state.settings.language === 'en' ? en.quitConfirm.no : id.quitConfirm.no}
                    </button>
                  </div>
                </m.div>
              </m.div>
            )}
          </AnimatePresence>
          
        </div>
      </div>
    </LanguageContext.Provider>
  );
};
export default App;
