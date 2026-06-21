import React, { Suspense, useEffect, useState } from 'react';
import { App as CapApp } from '@capacitor/app';
import { useSessionReducer } from './hooks/useSessionReducer';
import { useSettings } from './hooks/useSettings';
import { useHighScore } from './hooks/useHighScore';
import { LanguageContext } from './hooks/useTranslation';
import SplashScreen from './components/SplashScreen';

import { usePet } from './hooks/usePet';
import { PetType } from './types';

// Lazy-load components to optimize initial page loading and code splitting
const MainMenu = React.lazy(() => import('./components/MainMenu'));
const GameBoard = React.lazy(() => import('./components/GameBoard'));
const ScoreSummary = React.lazy(() => import('./components/ScoreSummary'));
const SettingsScreen = React.lazy(() => import('./components/SettingsScreen'));
const AdoptionScreen = React.lazy(() => import('./components/AdoptionScreen'));
const WarungBoard = React.lazy(() => import('./components/WarungBoard'));

export const App: React.FC = () => {
  const { state, dispatch } = useSessionReducer();
  const [showWebSplash, setShowWebSplash] = useState(true);

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
      if (state.phase === 'playing' || state.phase === 'warung') {
        dispatch({ type: 'BACK_TO_MENU' });
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

  // Active Screen Routing mapping
  const renderScreen = (): React.ReactNode => {
    if (!isSettingsLoaded || !isHighScoreLoaded || !isPetLoaded || showWebSplash) {
      return <SplashScreen />;
    }

    switch (state.phase) {
      case 'onboarding':
        return <AdoptionScreen onAdopt={handleAdoptPet} />;
      case 'menu':
        return <MainMenu settings={state.settings} dispatch={dispatch} pet={state.pet} updateSetting={updateSetting} />;
      case 'playing':
        return <GameBoard state={state} dispatch={dispatch} />;
      case 'warung':
        return (
          <WarungBoard 
            state={state} 
            dispatch={dispatch} 
            feedPet={feedPet} 
            addCoins={handleAddCoins}
            buyUpgrade={handleBuyUpgrade}
            equipUpgrade={handleEquipUpgrade}
          />
        );
      case 'summary':
        return (
          <ScoreSummary 
            state={state} 
            dispatch={dispatch} 
            saveSessionResult={saveSessionResult} 
            feedPet={feedPet}
          />
        );
      case 'settings':
        return (
          <SettingsScreen
            settings={state.settings}
            highScores={state.highScores}
            recentSessions={state.recentSessions}
            dispatch={dispatch}
            updateSetting={updateSetting}
            clearHighScoreData={handleClearAllProgress}
            resetPetOnly={handleResetPetOnly}
          />
        );
      default:
        return state.pet.hasAdopted 
          ? <MainMenu settings={state.settings} dispatch={dispatch} pet={state.pet} updateSetting={updateSetting} />
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
          
        </div>
      </div>
    </LanguageContext.Provider>
  );
};
export default App;
