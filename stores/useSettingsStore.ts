import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ReadingDisplay = 'romaji' | 'hiragana' | 'both';
export type ThemeMode = 'system' | 'light' | 'dark';
export type FontSizePref = 'small' | 'medium' | 'large';
export type SRSDifficulty = 'relaxed' | 'standard' | 'strict';

interface SettingsState {
  readingDisplay: ReadingDisplay;
  themeMode: ThemeMode;
  fontSize: FontSizePref;
  dailyNewKanjiLimit: number;
  maxReviewsPerSession: number;
  srsDifficulty: SRSDifficulty;
  ttsEnabled: boolean;
  soundEffectsEnabled: boolean;
  hapticFeedbackEnabled: boolean;
  reminderEnabled: boolean;
  reminderHour: number;
  reminderMinute: number;
  onboardingComplete: boolean;

  setReadingDisplay: (val: ReadingDisplay) => void;
  setThemeMode: (val: ThemeMode) => void;
  setFontSize: (val: FontSizePref) => void;
  setDailyNewKanjiLimit: (val: number) => void;
  setMaxReviewsPerSession: (val: number) => void;
  setSRSDifficulty: (val: SRSDifficulty) => void;
  setTTSEnabled: (val: boolean) => void;
  setSoundEffectsEnabled: (val: boolean) => void;
  setHapticFeedbackEnabled: (val: boolean) => void;
  setReminderEnabled: (val: boolean) => void;
  setReminderTime: (hour: number, minute: number) => void;
  setOnboardingComplete: (val: boolean) => void;
  loadSettings: () => Promise<void>;
}

const STORAGE_KEY = 'kanjiforest_settings';

const persist = async (state: Partial<SettingsState>) => {
  const serializable = { ...state };
  // Remove functions
  Object.keys(serializable).forEach((key) => {
    if (typeof (serializable as any)[key] === 'function') {
      delete (serializable as any)[key];
    }
  });
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(serializable));
};

export const useSettingsStore = create<SettingsState>((set, get) => ({
  readingDisplay: 'hiragana',
  themeMode: 'system',
  fontSize: 'medium',
  dailyNewKanjiLimit: 5,
  maxReviewsPerSession: 50,
  srsDifficulty: 'standard',
  ttsEnabled: true,
  soundEffectsEnabled: true,
  hapticFeedbackEnabled: true,
  reminderEnabled: false,
  reminderHour: 9,
  reminderMinute: 0,
  onboardingComplete: false,

  setReadingDisplay: (val) => {
    set({ readingDisplay: val });
    persist(get());
  },
  setThemeMode: (val) => {
    set({ themeMode: val });
    persist(get());
  },
  setFontSize: (val) => {
    set({ fontSize: val });
    persist(get());
  },
  setDailyNewKanjiLimit: (val) => {
    set({ dailyNewKanjiLimit: val });
    persist(get());
  },
  setMaxReviewsPerSession: (val) => {
    set({ maxReviewsPerSession: val });
    persist(get());
  },
  setSRSDifficulty: (val) => {
    set({ srsDifficulty: val });
    persist(get());
  },
  setTTSEnabled: (val) => {
    set({ ttsEnabled: val });
    persist(get());
  },
  setSoundEffectsEnabled: (val) => {
    set({ soundEffectsEnabled: val });
    persist(get());
  },
  setHapticFeedbackEnabled: (val) => {
    set({ hapticFeedbackEnabled: val });
    persist(get());
  },
  setReminderEnabled: (val) => {
    set({ reminderEnabled: val });
    persist(get());
  },
  setReminderTime: (hour, minute) => {
    set({ reminderHour: hour, reminderMinute: minute });
    persist(get());
  },
  setOnboardingComplete: (val) => {
    set({ onboardingComplete: val });
    persist(get());
  },
  loadSettings: async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        set(parsed);
      }
    } catch (e) {
      console.error('Failed to load settings:', e);
    }
  },
}));
