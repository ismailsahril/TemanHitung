import { useState, useEffect, useCallback } from 'react';
import { Preferences } from '@capacitor/preferences';
import { PetState, PetType, DEFAULT_PET_STATE } from '../types';

const PET_STATE_KEY = 'math_app_pet_state_v1';
let memoryPetState: PetState = { ...DEFAULT_PET_STATE };

/**
 * Calculates experience points (EXP) required to level up.
 * Progression uses: required = level * 100 EXP.
 */
export function getExpNeededForNextLevel(level: number): number {
  return level * 100;
}

/**
 * Custom hook to manage the companion pet state (adoption status, name, level, EXP).
 * Handles progression formula and persists state in Preferences.
 */
export function usePet(): {
  petState: PetState;
  adoptPet: (type: PetType, name: string) => Promise<void>;
  feedPet: (expGained: number) => Promise<{ leveledUp: boolean; nextLevel: number }>;
  clearPetData: () => Promise<void>;
  addCoins: (amount: number) => Promise<void>;
  buyUpgrade: (id: string, cost: number) => Promise<void>;
  equipUpgrade: (id: string) => Promise<void>;
  interactWithPet: (cost: number, expGained: number) => Promise<{ leveledUp: boolean; nextLevel: number }>;
  isPetLoaded: boolean;
} {
  const [petState, setPetState] = useState<PetState>(DEFAULT_PET_STATE);
  const [isPetLoaded, setIsPetLoaded] = useState(false);

  useEffect(() => {
    async function loadPet() {
      try {
        const { value } = await Preferences.get({ key: PET_STATE_KEY });
        if (value) {
          const parsed = JSON.parse(value) as PetState;
          const merged: PetState = {
            ...DEFAULT_PET_STATE,
            ...parsed,
            coins: typeof parsed.coins === 'number' ? parsed.coins : 0,
            purchasedUpgrades: parsed.purchasedUpgrades || ['default'],
            activeUpgrade: parsed.activeUpgrade || 'default',
          };
          setPetState(merged);
          memoryPetState = merged;
        } else {
          // If no pet exists yet, set default unadopted state
          setPetState(DEFAULT_PET_STATE);
          memoryPetState = { ...DEFAULT_PET_STATE };
        }
      } catch (error) {
        const isDev = import.meta.env.DEV;
        if (isDev) {
          console.warn('Preferences failed, using in-memory pet fallback:', error);
        }
        setPetState(memoryPetState);
      } finally {
        setIsPetLoaded(true);
      }
    }
    loadPet();
  }, []);

  const adoptPet = useCallback(async (type: PetType, name: string): Promise<void> => {
    const newState: PetState = {
      hasAdopted: true,
      type,
      name: name.trim() || 'Companion',
      level: 1,
      exp: 0,
      adoptedAt: Date.now(),
      coins: 0,
      purchasedUpgrades: ['default'],
      activeUpgrade: 'default',
    };

    setPetState(newState);
    memoryPetState = newState;

    try {
      await Preferences.set({
        key: PET_STATE_KEY,
        value: JSON.stringify(newState),
      });
    } catch (err) {
      const isDev = import.meta.env.DEV;
      if (isDev) {
        console.error('Failed to save adopted pet settings:', err);
      }
    }
  }, []);

  const feedPet = useCallback(async (expGained: number): Promise<{ leveledUp: boolean; nextLevel: number }> => {
    let leveledUp = false;
    let currentLevel = petState.level;
    let currentExp = petState.exp + expGained;

    // Check level up (supports multi-level up if large EXP is gained)
    while (currentExp >= getExpNeededForNextLevel(currentLevel)) {
      currentExp -= getExpNeededForNextLevel(currentLevel);
      currentLevel += 1;
      leveledUp = true;
    }

    const newState: PetState = {
      ...petState,
      level: currentLevel,
      exp: currentExp,
    };

    setPetState(newState);
    memoryPetState = newState;

    try {
      await Preferences.set({
        key: PET_STATE_KEY,
        value: JSON.stringify(newState),
      });
    } catch (err) {
      const isDev = import.meta.env.DEV;
      if (isDev) {
        console.error('Failed to save pet feeding state:', err);
      }
    }

    return { leveledUp, nextLevel: currentLevel };
  }, [petState]);

  const addCoins = useCallback(async (amount: number): Promise<void> => {
    const newState: PetState = {
      ...petState,
      coins: (petState.coins || 0) + amount,
    };

    setPetState(newState);
    memoryPetState = newState;

    try {
      await Preferences.set({
        key: PET_STATE_KEY,
        value: JSON.stringify(newState),
      });
    } catch (err) {
      const isDev = import.meta.env.DEV;
      if (isDev) {
        console.error('Failed to save pet coins:', err);
      }
    }
  }, [petState]);

  const buyUpgrade = useCallback(async (id: string, cost: number): Promise<void> => {
    const activeUpgrades = petState.purchasedUpgrades || ['default'];
    if (activeUpgrades.includes(id)) return;

    const newState: PetState = {
      ...petState,
      coins: Math.max(0, (petState.coins || 0) - cost),
      purchasedUpgrades: [...activeUpgrades, id],
      activeUpgrade: id,
    };

    setPetState(newState);
    memoryPetState = newState;

    try {
      await Preferences.set({
        key: PET_STATE_KEY,
        value: JSON.stringify(newState),
      });
    } catch (err) {
      const isDev = import.meta.env.DEV;
      if (isDev) {
        console.error('Failed to buy upgrade:', err);
      }
    }
  }, [petState]);

  const equipUpgrade = useCallback(async (id: string): Promise<void> => {
    const newState: PetState = {
      ...petState,
      activeUpgrade: id,
    };

    setPetState(newState);
    memoryPetState = newState;

    try {
      await Preferences.set({
        key: PET_STATE_KEY,
        value: JSON.stringify(newState),
      });
    } catch (err) {
      const isDev = import.meta.env.DEV;
      if (isDev) {
        console.error('Failed to equip upgrade:', err);
      }
    }
  }, [petState]);

  const clearPetData = useCallback(async (): Promise<void> => {
    try {
      await Preferences.remove({ key: PET_STATE_KEY });
      setPetState(DEFAULT_PET_STATE);
      memoryPetState = { ...DEFAULT_PET_STATE };
    } catch (err) {
      const isDev = import.meta.env.DEV;
      if (isDev) {
        console.error('Failed to reset pet storage:', err);
      }
      setPetState(DEFAULT_PET_STATE);
      memoryPetState = { ...DEFAULT_PET_STATE };
    }
  }, []);

  const interactWithPet = useCallback(async (cost: number, expGained: number): Promise<{ leveledUp: boolean; nextLevel: number }> => {
    let leveledUp = false;
    let currentLevel = petState.level;
    let currentExp = petState.exp + expGained;

    while (currentExp >= getExpNeededForNextLevel(currentLevel)) {
      currentExp -= getExpNeededForNextLevel(currentLevel);
      currentLevel += 1;
      leveledUp = true;
    }

    const newState: PetState = {
      ...petState,
      coins: Math.max(0, (petState.coins || 0) - cost),
      level: currentLevel,
      exp: currentExp,
    };

    setPetState(newState);
    memoryPetState = newState;

    try {
      await Preferences.set({
        key: PET_STATE_KEY,
        value: JSON.stringify(newState),
      });
    } catch (err) {
      const isDev = import.meta.env.DEV;
      if (isDev) {
        console.error('Failed to save pet interaction state:', err);
      }
    }

    return { leveledUp, nextLevel: currentLevel };
  }, [petState]);

  return {
    petState,
    adoptPet,
    feedPet,
    clearPetData,
    addCoins,
    buyUpgrade,
    equipUpgrade,
    interactWithPet,
    isPetLoaded,
  };
}
export default usePet;
