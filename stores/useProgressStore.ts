import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { XP_PER_LEVEL, MAX_LEVEL } from '@/constants/SRS';

interface ProgressState {
  totalXP: number;
  level: number;
  kanjiLearnedCount: number;
  kanjiMasteredCount: number;
  vocabLearnedCount: number;
  totalReviews: number;
  totalCorrect: number;
  achievements: string[];

  addXP: (amount: number) => void;
  incrementKanjiLearned: () => void;
  incrementKanjiMastered: () => void;
  incrementVocabLearned: () => void;
  recordReview: (correct: boolean) => void;
  unlockAchievement: (id: string) => void;
  loadProgress: () => Promise<void>;
}

const STORAGE_KEY = 'kanjiforest_progress';

const persistProgress = async (state: Partial<ProgressState>) => {
  const serializable: Record<string, any> = {};
  Object.entries(state).forEach(([key, val]) => {
    if (typeof val !== 'function') serializable[key] = val;
  });
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(serializable));
};

export const useProgressStore = create<ProgressState>((set, get) => ({
  totalXP: 0,
  level: 1,
  kanjiLearnedCount: 0,
  kanjiMasteredCount: 0,
  vocabLearnedCount: 0,
  totalReviews: 0,
  totalCorrect: 0,
  achievements: [],

  addXP: (amount) => {
    const newXP = get().totalXP + amount;
    const newLevel = Math.min(MAX_LEVEL, Math.floor(newXP / XP_PER_LEVEL) + 1);
    set({ totalXP: newXP, level: newLevel });
    persistProgress(get());
  },

  incrementKanjiLearned: () => {
    set({ kanjiLearnedCount: get().kanjiLearnedCount + 1 });
    persistProgress(get());
  },

  incrementKanjiMastered: () => {
    set({ kanjiMasteredCount: get().kanjiMasteredCount + 1 });
    persistProgress(get());
  },

  incrementVocabLearned: () => {
    set({ vocabLearnedCount: get().vocabLearnedCount + 1 });
    persistProgress(get());
  },

  recordReview: (correct) => {
    set({
      totalReviews: get().totalReviews + 1,
      totalCorrect: correct ? get().totalCorrect + 1 : get().totalCorrect,
    });
    persistProgress(get());
  },

  unlockAchievement: (id) => {
    if (!get().achievements.includes(id)) {
      set({ achievements: [...get().achievements, id] });
      persistProgress(get());
    }
  },

  loadProgress: async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        set(parsed);
      }
    } catch (e) {
      console.error('Failed to load progress:', e);
    }
  },
}));
