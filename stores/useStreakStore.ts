import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface StreakState {
  currentStreak: number;
  longestStreak: number;
  lastStudyDate: string | null;
  streakFreezes: number;
  freezeUsedThisWeek: boolean;

  checkAndUpdateStreak: () => void;
  recordStudy: () => void;
  useStreakFreeze: () => boolean;
  addStreakFreeze: () => void;
  loadStreak: () => Promise<void>;
}

const STORAGE_KEY = 'kanjiforest_streak';

function getToday(): string {
  return new Date().toISOString().split('T')[0];
}

function getYesterday(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split('T')[0];
}

const persistStreak = async (state: Partial<StreakState>) => {
  const serializable: Record<string, any> = {};
  Object.entries(state).forEach(([key, val]) => {
    if (typeof val !== 'function') serializable[key] = val;
  });
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(serializable));
};

export const useStreakStore = create<StreakState>((set, get) => ({
  currentStreak: 0,
  longestStreak: 0,
  lastStudyDate: null,
  streakFreezes: 1,
  freezeUsedThisWeek: false,

  checkAndUpdateStreak: () => {
    const { lastStudyDate, currentStreak, streakFreezes, freezeUsedThisWeek } = get();
    const today = getToday();
    const yesterday = getYesterday();

    if (lastStudyDate === today) return;

    if (lastStudyDate === yesterday) {
      // Streak continues, but user hasn't studied today yet
      return;
    }

    if (lastStudyDate && lastStudyDate < yesterday) {
      // Missed at least one day
      if (streakFreezes > 0 && !freezeUsedThisWeek) {
        // Use a freeze
        set({
          streakFreezes: streakFreezes - 1,
          freezeUsedThisWeek: true,
          lastStudyDate: yesterday,
        });
        persistStreak(get());
      } else {
        // Streak broken
        set({ currentStreak: 0 });
        persistStreak(get());
      }
    }
  },

  recordStudy: () => {
    const today = getToday();
    const { lastStudyDate, currentStreak, longestStreak } = get();

    if (lastStudyDate === today) return;

    const yesterday = getYesterday();
    let newStreak: number;

    if (lastStudyDate === yesterday || lastStudyDate === today) {
      newStreak = currentStreak + 1;
    } else {
      newStreak = 1;
    }

    const newLongest = Math.max(longestStreak, newStreak);

    set({
      currentStreak: newStreak,
      longestStreak: newLongest,
      lastStudyDate: today,
    });
    persistStreak(get());
  },

  useStreakFreeze: () => {
    const { streakFreezes, freezeUsedThisWeek } = get();
    if (streakFreezes > 0 && !freezeUsedThisWeek) {
      set({
        streakFreezes: streakFreezes - 1,
        freezeUsedThisWeek: true,
      });
      persistStreak(get());
      return true;
    }
    return false;
  },

  addStreakFreeze: () => {
    set({ streakFreezes: get().streakFreezes + 1 });
    persistStreak(get());
  },

  loadStreak: async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        set(parsed);
      }
    } catch (e) {
      console.error('Failed to load streak:', e);
    }
  },
}));
