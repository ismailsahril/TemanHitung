import { useContext, createContext, useCallback } from 'react';
import { AppLanguage } from '../types';
import { id } from '../i18n/id';
import { en } from '../i18n/en';

/**
 * Resolves nested dot-notation paths (e.g. "menu.title") in translation objects.
 */
function resolveKey(obj: Record<string, unknown>, path: string): string {
  const keys = path.split('.');
  let current: unknown = obj;

  for (const key of keys) {
    if (current && typeof current === 'object' && key in (current as Record<string, unknown>)) {
      current = (current as Record<string, unknown>)[key];
    } else {
      return path; // Fallback to path if key not found
    }
  }

  return typeof current === 'string' ? current : path;
}

/**
 * Replaces parameters in translation strings (e.g., "{name}" -> "Budi").
 */
function interpolate(text: string, params?: Record<string, string | number>): string {
  if (!params) return text;
  let result = text;
  for (const key in params) {
    if (Object.prototype.hasOwnProperty.call(params, key)) {
      result = result.replace(new RegExp(`{${key}}`, 'g'), String(params[key]));
    }
  }
  return result;
}

/**
 * Context containing the active language key ('id' | 'en').
 */
export const LanguageContext = createContext<AppLanguage>('id');

/**
 * Custom hook to translate paths into localized strings.
 * Falls back to Indonesian if key is missing in English translations.
 */
export function useTranslation(): {
  t: (path: string, params?: Record<string, string | number>) => string;
  language: AppLanguage;
} {
  const language = useContext(LanguageContext);

  const t = useCallback((path: string, params?: Record<string, string | number>): string => {
    // Select translation strings
    const strings = language === 'en' ? en : id;
    
    // Resolve key from translations
    let translated = resolveKey(strings as unknown as Record<string, unknown>, path);

    // If key not found in English, fall back to Indonesian
    if (translated === path && language === 'en') {
      translated = resolveKey(id as unknown as Record<string, unknown>, path);
    }

    // Interpolate placeholders
    return interpolate(translated, params);
  }, [language]);

  return { t, language };
}
