import { useReducer, Dispatch } from 'react';
import { SessionState, SessionAction, AnsweredQuestion, DEFAULT_SETTINGS, DEFAULT_PET_STATE } from '../types';
import { generateSession, verifyAnswer } from '../utils/mathEngine';

const INITIAL_STATE: SessionState = {
  phase: 'menu',
  config: null,
  questions: [],
  currentIndex: 0,
  history: [],
  score: 0,
  highScores: {},
  recentSessions: [],
  settings: DEFAULT_SETTINGS,
  pet: DEFAULT_PET_STATE,
  timerStartedAt: null,
};

function sessionReducer(state: SessionState, action: SessionAction): SessionState {
  switch (action.type) {
    case 'START_SESSION': {
      const config = action.payload;
      const questions = generateSession(config, state.settings.language);
      return {
        ...state,
        phase: 'playing',
        config,
        questions,
        currentIndex: 0,
        history: [],
        score: 0,
        timerStartedAt: Date.now(), // Initiates the first question's timer
      };
    }

    case 'START_WARUNG': {
      return {
        ...state,
        phase: 'warung',
        config: {
          difficulty: action.payload.difficulty,
          operation: 'addition',
          mode: 'integer',
          questionCount: 5,
        },
        questions: [],
        currentIndex: 0,
        history: [],
        score: 0,
        timerStartedAt: null,
      };
    }

    case 'SUBMIT_ANSWER': {
      if (state.phase !== 'playing' || !state.config) return state;
      
      const currentQuestion = state.questions[state.currentIndex];
      const isAlreadyAnswered = state.history.length === state.currentIndex + 1;
      if (isAlreadyAnswered) return state; // Prevent double answer submissions

      const { answer } = action.payload;
      
      // Security check: recompute and verify answer
      const isCorrect = answer === null ? false : verifyAnswer(currentQuestion, answer);
      const timeSpentMs = state.timerStartedAt ? Date.now() - state.timerStartedAt : 0;

      const answeredQuestion: AnsweredQuestion = {
        ...currentQuestion,
        userAnswer: answer,
        isCorrect,
        answeredAt: Date.now(),
        timeSpentMs,
      };

      return {
        ...state,
        history: [...state.history, answeredQuestion],
        score: isCorrect ? state.score + 1 : state.score,
        timerStartedAt: null, // Stops the timer
      };
    }

    case 'NEXT_QUESTION': {
      if (state.phase !== 'playing' || !state.config) return state;
      const nextIndex = state.currentIndex + 1;
      
      // Guard against index out of bounds
      if (nextIndex >= state.questions.length) {
        return {
          ...state,
          phase: 'summary',
          timerStartedAt: null,
        };
      }

      return {
        ...state,
        currentIndex: nextIndex,
        timerStartedAt: Date.now(), // Reset timer for the next question
      };
    }

    case 'END_SESSION': {
      return {
        ...state,
        phase: 'summary',
        timerStartedAt: null,
      };
    }

    case 'RESTART': {
      return {
        ...state,
        phase: state.pet.hasAdopted ? 'menu' : 'onboarding',
        config: null,
        questions: [],
        currentIndex: 0,
        history: [],
        score: 0,
        timerStartedAt: null,
      };
    }

    case 'GO_TO_SETTINGS': {
      return {
        ...state,
        phase: 'settings',
        timerStartedAt: null,
      };
    }

    case 'BACK_TO_MENU': {
      return {
        ...state,
        phase: state.pet.hasAdopted ? 'menu' : 'onboarding',
        timerStartedAt: null,
      };
    }

    case 'UPDATE_SETTINGS': {
      return {
        ...state,
        settings: {
          ...state.settings,
          ...action.payload,
        },
      };
    }

    case 'SET_HIGH_SCORES': {
      return {
        ...state,
        highScores: action.payload,
      };
    }

    case 'SET_RECENT_SESSIONS': {
      return {
        ...state,
        recentSessions: action.payload,
      };
    }

    case 'SET_PET_STATE': {
      return {
        ...state,
        pet: action.payload,
      };
    }



    case 'ADD_COINS': {
      const { amount } = action.payload;
      return {
        ...state,
        pet: {
          ...state.pet,
          coins: (state.pet.coins || 0) + amount,
        },
      };
    }

    case 'BUY_UPGRADE': {
      const { id, cost } = action.payload;
      const upgrades = state.pet.purchasedUpgrades || ['default'];
      return {
        ...state,
        pet: {
          ...state.pet,
          coins: Math.max(0, (state.pet.coins || 0) - cost),
          purchasedUpgrades: [...upgrades, id],
          activeUpgrade: id,
        },
      };
    }

    case 'EQUIP_UPGRADE': {
      const { id } = action.payload;
      return {
        ...state,
        pet: {
          ...state.pet,
          activeUpgrade: id,
        },
      };
    }

    case 'ADOPT_PET': {
      const adoptedPet = {
        hasAdopted: true,
        type: action.payload.type,
        name: action.payload.name,
        level: 1,
        exp: 0,
        adoptedAt: Date.now(),
        coins: 0,
        purchasedUpgrades: ['default'],
        activeUpgrade: 'default',
      };
      return {
        ...state,
        phase: 'menu',
        pet: adoptedPet,
      };
    }

    case 'FEED_PET': {
      const expGained = action.payload.expGained;
      let level = state.pet.level;
      let exp = state.pet.exp + expGained;
      
      const expNeeded = (lvl: number) => lvl * 100;
      while (exp >= expNeeded(level)) {
        exp -= expNeeded(level);
        level += 1;
      }
      
      return {
        ...state,
        pet: {
          ...state.pet,
          level,
          exp,
        },
      };
    }

    case 'RESET_PET_STATE': {
      return {
        ...state,
        pet: DEFAULT_PET_STATE,
        phase: 'onboarding',
      };
    }

    case 'TICK_TIMER': {
      // Pure reducer: dispatches force state update to re-evaluate time elapsed in the UI
      return {
        ...state,
      };
    }

    default:
      return state;
  }
}

export function useSessionReducer(): {
  state: SessionState;
  dispatch: Dispatch<SessionAction>;
} {
  const [state, dispatch] = useReducer(sessionReducer, INITIAL_STATE);
  return { state, dispatch };
}
