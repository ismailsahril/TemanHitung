import { useState, useEffect, useCallback } from 'react';
import { Preferences } from '@capacitor/preferences';
import { AppSettings, DEFAULT_SETTINGS } from '../types';

const SETTINGS_KEY = 'math_app_settings_v1';
let memorySettings: AppSettings = { ...DEFAULT_SETTINGS };

/**
 * Helper to apply light/dark theme classes to document root.
 */
export function applyThemeClass(theme: string): void {
  const root = document.documentElement;
  if (theme === 'dark') {
    root.classList.add('dark');
  } else if (theme === 'light') {
    root.classList.remove('dark');
  } else {
    // system
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (systemPrefersDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }
}

/**
 * Helper to apply dynamic font size scales using a CSS variable.
 */
export function applyFontScale(scale: string): void {
  const root = document.documentElement;
  if (scale === 'large') {
    root.style.setProperty('--font-scale', '1.2');
  } else if (scale === 'extra-large') {
    root.style.setProperty('--font-scale', '1.4');
  } else {
    root.style.setProperty('--font-scale', '1.0');
  }
}

/**
 * Helper to apply high contrast class for accessibility.
 */
export function applyHighContrast(enabled: boolean): void {
  const root = document.documentElement;
  if (enabled) {
    root.classList.add('high-contrast');
  } else {
    root.classList.remove('high-contrast');
  }
}

/**
 * Helper to toggle transitions and animations.
 */
export function applyReduceMotion(enabled: boolean): void {
  const root = document.documentElement;
  if (enabled) {
    root.classList.add('reduce-motion');
  } else {
    root.classList.remove('reduce-motion');
  }
}

/**
 * Custom hook to load, apply, and save application-wide user settings.
 * Persists settings using Capacitor Preferences.
 */
export function useSettings(): {
  settings: AppSettings;
  updateSetting: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => Promise<void>;
  resetSettings: () => Promise<void>;
  isLoaded: boolean;
} {
  const [settings, setSettingsState] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    async function loadSettings() {
      try {
        const { value } = await Preferences.get({ key: SETTINGS_KEY });
        if (value) {
          const parsed = JSON.parse(value);
          const merged = { ...DEFAULT_SETTINGS, ...parsed };
          setSettingsState(merged);
          memorySettings = merged;

          // Apply settings to html tag
          applyThemeClass(merged.theme);
          applyFontScale(merged.fontSizeScale);
          applyHighContrast(merged.highContrast);
          applyReduceMotion(merged.reduceAnimations);
        } else {
          await Preferences.set({ key: SETTINGS_KEY, value: JSON.stringify(DEFAULT_SETTINGS) });
          setSettingsState(DEFAULT_SETTINGS);
          memorySettings = { ...DEFAULT_SETTINGS };

          applyThemeClass(DEFAULT_SETTINGS.theme);
          applyFontScale(DEFAULT_SETTINGS.fontSizeScale);
          applyHighContrast(DEFAULT_SETTINGS.highContrast);
          applyReduceMotion(DEFAULT_SETTINGS.reduceAnimations);
        }
      } catch (error) {
        const isDev = import.meta.env.DEV;
        if (isDev) {
          console.warn('Preferences failed, using memory fallback:', error);
        }
        setSettingsState(memorySettings);
        applyThemeClass(memorySettings.theme);
        applyFontScale(memorySettings.fontSizeScale);
        applyHighContrast(memorySettings.highContrast);
        applyReduceMotion(memorySettings.reduceAnimations);
      } finally {
        setIsLoaded(true);
      }
    }
    loadSettings();
  }, []);

  const updateSetting = useCallback(async <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    setSettingsState((prev) => {
      const updated = { ...prev, [key]: value };
      memorySettings = updated;

      // Persist in background (fire-and-forget)
      Preferences.set({ key: SETTINGS_KEY, value: JSON.stringify(updated) }).catch((err) => {
        const isDev = import.meta.env.DEV;
        if (isDev) {
          console.error('Failed to save settings:', err);
        }
      });

      // Instantly synchronize with HTML element classes
      if (key === 'theme') {
        applyThemeClass(value as string);
      } else if (key === 'fontSizeScale') {
        applyFontScale(value as string);
      } else if (key === 'highContrast') {
        applyHighContrast(value as boolean);
      } else if (key === 'reduceAnimations') {
        applyReduceMotion(value as boolean);
      }

      return updated;
    });
  }, []);

  const resetSettings = useCallback(async () => {
    try {
      await Preferences.set({ key: SETTINGS_KEY, value: JSON.stringify(DEFAULT_SETTINGS) });
      setSettingsState(DEFAULT_SETTINGS);
      memorySettings = { ...DEFAULT_SETTINGS };

      applyThemeClass(DEFAULT_SETTINGS.theme);
      applyFontScale(DEFAULT_SETTINGS.fontSizeScale);
      applyHighContrast(DEFAULT_SETTINGS.highContrast);
      applyReduceMotion(DEFAULT_SETTINGS.reduceAnimations);
    } catch (err) {
      const isDev = import.meta.env.DEV;
      if (isDev) {
        console.error('Failed to reset settings:', err);
      }
      setSettingsState(DEFAULT_SETTINGS);
      memorySettings = { ...DEFAULT_SETTINGS };
    }
  }, []);

  return {
    settings,
    updateSetting,
    resetSettings,
    isLoaded,
  };
}
