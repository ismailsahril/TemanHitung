// Game operation types
export type Operation = 'addition' | 'subtraction' | 'multiplication' | 'division';

// Difficulty levels
export type Difficulty = 'easy' | 'medium' | 'hard';

// Number mode
export type NumberMode = 'integer' | 'decimal';

// App language
export type AppLanguage = 'id' | 'en';

// Color theme
export type AppTheme = 'light' | 'dark' | 'system';

// Font size scale
export type FontSizeScale = 'normal' | 'large' | 'extra-large';

// Timer option per question (seconds); 0 = no timer
export type TimerOption = 0 | 15 | 30 | 60;

// Game screen/phase
export type GamePhase = 'menu' | 'playing' | 'summary' | 'settings' | 'onboarding' | 'warung';

export type PetType = 'cat' | 'hamster' | 'bird' | 'rabbit' | 'fox' | 'monkey';

export interface PetState {
  hasAdopted: boolean;
  type: PetType;
  name: string;
  level: number;
  exp: number;
  adoptedAt: number;
  coins: number;
  purchasedUpgrades: string[];
  activeUpgrade: string | null;
}

export const DEFAULT_PET_STATE: PetState = {
  hasAdopted: false,
  type: 'cat',
  name: '',
  level: 1,
  exp: 0,
  adoptedAt: 0,
  coins: 0,
  purchasedUpgrades: ['default'],
  activeUpgrade: 'default',
};

// All user-configurable application settings
// Stored atomically under a single key in @capacitor/preferences
export interface AppSettings {
  // Session & Gameplay
  questionCount: number;        // Default: 10, range: 5–50, step: 5
  timerPerQuestion: TimerOption; // Default: 0 (no timer)
  autoAdvance: boolean;         // Default: true (auto-move after feedback)

  // Language & Localization
  language: AppLanguage;        // Default: 'id'
  numberFormat: 'id' | 'en';   // Default: 'id' (1.000 separator style)
  tipLanguage: AppLanguage;     // Default: matches language setting

  // Display & Theme
  theme: AppTheme;              // Default: 'system'
  fontSizeScale: FontSizeScale; // Default: 'normal'
  reduceAnimations: boolean;    // Default: false

  // Audio & Feedback
  soundEnabled: boolean;        // Default: true
  hapticEnabled: boolean;       // Default: true (Android only)

  // Profile
  userName: string;             // Default: '' (no greeting shown if empty)

  // Accessibility
  highContrast: boolean;        // Default: false
  autoShowTip: boolean;         // Default: false (tip collapsed by default)
}

// Default values — exported as a constant, used when no saved settings exist
export const DEFAULT_SETTINGS: AppSettings = {
  questionCount: 10,
  timerPerQuestion: 0,
  autoAdvance: true,
  language: 'id',
  numberFormat: 'id',
  tipLanguage: 'id',
  theme: 'system',
  fontSizeScale: 'normal',
  reduceAnimations: false,
  soundEnabled: true,
  hapticEnabled: true,
  userName: '',
  highContrast: false,
  autoShowTip: false,
};

// A single generated question
export interface Question {
  id: string;                  // UUID or nanoid
  operandA: number;
  operandB: number;
  operation: Operation;
  correctAnswer: number;       // Pre-computed at generation time
  quickTip: string;            // "Cara Hitung Cepat" string for this question
  displayExpression: string;   // e.g. "24 × 5 = ?"
}

// A completed question entry in session history
export interface AnsweredQuestion extends Question {
  userAnswer: number | null;   // null if skipped/timed out
  isCorrect: boolean;
  answeredAt: number;          // Date.now() timestamp
  timeSpentMs: number;         // Duration from question shown to answer submitted
}

// Full session configuration selected on MainMenu
export interface SessionConfig {
  operation: Operation;
  difficulty: Difficulty;
  mode: NumberMode;
  questionCount: number;       // Pulled from AppSettings at session start
}

// Per-operation high score tracking
export interface HighScoreEntry {
  score: number;
  outOf: number;
  achievedAt: number;          // Date.now() timestamp
}

// High scores keyed by "operation-difficulty" (e.g. "multiplication-hard")
export type HighScoreMap = Record<string, HighScoreEntry>;

// Session history item for progress charting
export interface SessionHistoryEntry {
  id: string;
  operation: Operation;
  difficulty: Difficulty;
  score: number;
  outOf: number;
  achievedAt: number;
}

// useReducer state shape
export interface SessionState {
  phase: GamePhase;
  config: SessionConfig | null;
  questions: Question[];
  currentIndex: number;
  history: AnsweredQuestion[];
  score: number;
  highScores: HighScoreMap;
  recentSessions: SessionHistoryEntry[]; // Used for plotting SVG charts
  settings: AppSettings;       // Always available from loaded preferences
  pet: PetState;               // Companion pet status
  timerStartedAt: number | null; // Date.now() when current question was shown
}

// useReducer action union
export type SessionAction =
  | { type: 'START_SESSION'; payload: SessionConfig }
  | { type: 'START_WARUNG'; payload: { difficulty: Difficulty } }
  | { type: 'SUBMIT_ANSWER'; payload: { answer: number | null } }
  | { type: 'NEXT_QUESTION' }
  | { type: 'END_SESSION' }
  | { type: 'RESTART' }
  | { type: 'GO_TO_SETTINGS' }
  | { type: 'BACK_TO_MENU' }
  | { type: 'UPDATE_SETTINGS'; payload: Partial<AppSettings> }
  | { type: 'SET_HIGH_SCORES'; payload: HighScoreMap }
  | { type: 'SET_RECENT_SESSIONS'; payload: SessionHistoryEntry[] }
  | { type: 'ADOPT_PET'; payload: { type: PetType; name: string } }
  | { type: 'FEED_PET'; payload: { expGained: number } }
  | { type: 'SET_PET_STATE'; payload: PetState }
  | { type: 'RESET_PET_STATE' }
  | { type: 'TICK_TIMER' }
  | { type: 'ADD_COINS'; payload: { amount: number } }
  | { type: 'BUY_UPGRADE'; payload: { id: string; cost: number } }
  | { type: 'EQUIP_UPGRADE'; payload: { id: string } };    // Dispatched every second when timerPerQuestion > 0
