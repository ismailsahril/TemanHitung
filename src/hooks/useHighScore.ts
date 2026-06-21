import { useState, useEffect, useCallback } from 'react';
import { Preferences } from '@capacitor/preferences';
import { HighScoreMap, SessionHistoryEntry } from '../types';

const HIGH_SCORES_KEY = 'math_app_high_scores_v1';
const RECENT_SESSIONS_KEY = 'math_app_recent_sessions_v1';

let memoryHighScores: HighScoreMap = {};
let memoryRecentSessions: SessionHistoryEntry[] = [];

/**
 * Custom hook to load, save, and manage high scores and recent session histories.
 * Uses Capacitor Preferences for persistent storage across application runs.
 */
export function useHighScore(): {
  highScores: HighScoreMap;
  recentSessions: SessionHistoryEntry[];
  isHighScoreLoaded: boolean;
  saveSessionResult: (
    operation: string,
    difficulty: string,
    score: number,
    outOf: number
  ) => Promise<{ isNewRecord: boolean; previousBest: number }>;
  clearAllData: () => Promise<void>;
} {
  const [highScores, setHighScores] = useState<HighScoreMap>({});
  const [recentSessions, setRecentSessions] = useState<SessionHistoryEntry[]>([]);
  const [isHighScoreLoaded, setIsHighScoreLoaded] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const { value: scoresVal } = await Preferences.get({ key: HIGH_SCORES_KEY });
        const { value: sessionsVal } = await Preferences.get({ key: RECENT_SESSIONS_KEY });

        let loadedScores: HighScoreMap = {};
        let loadedSessions: SessionHistoryEntry[] = [];

        if (scoresVal) {
          loadedScores = JSON.parse(scoresVal);
          setHighScores(loadedScores);
          memoryHighScores = loadedScores;
        }

        if (sessionsVal) {
          loadedSessions = JSON.parse(sessionsVal);
          setRecentSessions(loadedSessions);
          memoryRecentSessions = loadedSessions;
        }
      } catch (error) {
        const isDev = import.meta.env.DEV;
        if (isDev) {
          console.warn('Failed to load score history, using in-memory fallbacks:', error);
        }
        setHighScores(memoryHighScores);
        setRecentSessions(memoryRecentSessions);
      } finally {
        setIsHighScoreLoaded(true);
      }
    }
    loadData();
  }, []);

  const saveSessionResult = useCallback(async (
    operation: string,
    difficulty: string,
    score: number,
    outOf: number
  ): Promise<{ isNewRecord: boolean; previousBest: number }> => {
    const key = `${operation}-${difficulty}`;
    const now = Date.now();

    // 1. Update High Scores
    const previousBest = highScores[key]?.score || 0;
    const isNewRecord = score > previousBest || !highScores[key];

    let updatedScores = { ...highScores };
    if (isNewRecord) {
      updatedScores[key] = {
        score,
        outOf,
        achievedAt: now,
      };
      setHighScores(updatedScores);
      memoryHighScores = updatedScores;

      Preferences.set({
        key: HIGH_SCORES_KEY,
        value: JSON.stringify(updatedScores),
      }).catch((err) => {
        const isDev = import.meta.env.DEV;
        if (isDev) {
          console.error('Failed to save high scores:', err);
        }
      });
    }

    // 2. Add to Recent Sessions History (keep last 10 for progress line chart)
    const newSession: SessionHistoryEntry = {
      id: `${operation}-${difficulty}-${now}-${Math.random()}`,
      operation: operation as SessionHistoryEntry['operation'],
      difficulty: difficulty as SessionHistoryEntry['difficulty'],
      score,
      outOf,
      achievedAt: now,
    };

    const updatedSessions = [newSession, ...recentSessions].slice(0, 10);
    setRecentSessions(updatedSessions);
    memoryRecentSessions = updatedSessions;

    Preferences.set({
      key: RECENT_SESSIONS_KEY,
      value: JSON.stringify(updatedSessions),
    }).catch((err) => {
      const isDev = import.meta.env.DEV;
      if (isDev) {
        console.error('Failed to save recent sessions:', err);
      }
    });

    return { isNewRecord, previousBest };
  }, [highScores, recentSessions]);

  const clearAllData = useCallback(async (): Promise<void> => {
    try {
      await Preferences.remove({ key: HIGH_SCORES_KEY });
      await Preferences.remove({ key: RECENT_SESSIONS_KEY });
      setHighScores({});
      setRecentSessions([]);
      memoryHighScores = {};
      memoryRecentSessions = [];
    } catch (err) {
      const isDev = import.meta.env.DEV;
      if (isDev) {
        console.error('Failed to clear progress data:', err);
      }
      setHighScores({});
      setRecentSessions([]);
    }
  }, []);

  return {
    highScores,
    recentSessions,
    isHighScoreLoaded,
    saveSessionResult,
    clearAllData,
  };
}
