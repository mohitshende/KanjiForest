export const SRS_LEVELS = {
  UNSEEN: 0,
  APPRENTICE_1: 1,
  APPRENTICE_2: 2,
  APPRENTICE_3: 3,
  APPRENTICE_4: 4,
  GURU_1: 5,
  GURU_2: 6,
  MASTER: 7,
  ENLIGHTENED: 8,
  BURNED: 9,
} as const;

export const SRS_LEVEL_NAMES: Record<number, string> = {
  0: 'Unseen',
  1: 'Apprentice 1',
  2: 'Apprentice 2',
  3: 'Apprentice 3',
  4: 'Apprentice 4',
  5: 'Guru 1',
  6: 'Guru 2',
  7: 'Master',
  8: 'Enlightened',
  9: 'Burned',
};

// Intervals in hours
export const SRS_INTERVALS: Record<number, number> = {
  1: 4,        // 4 hours
  2: 8,        // 8 hours
  3: 24,       // 1 day
  4: 48,       // 2 days
  5: 168,      // 1 week
  6: 336,      // 2 weeks
  7: 720,      // ~1 month (30 days)
  8: 2880,     // ~4 months (120 days)
  9: Infinity, // Burned — no more reviews
};

export const SRS_STAGE_COLORS = {
  unseen: '#ABABAB',
  apprentice: '#F4A261',
  guru: '#3A7BD5',
  master: '#27AE60',
  enlightened: '#F2B705',
  burned: '#7C5CBF',
} as const;

export const LEECH_THRESHOLD = 7;

export const XP_PER_CORRECT = 10;
export const XP_STREAK_BONUS = 5;
export const XP_PER_LEVEL = 100;
export const MAX_LEVEL = 60;

export default {
  SRS_LEVELS,
  SRS_LEVEL_NAMES,
  SRS_INTERVALS,
  SRS_STAGE_COLORS,
  LEECH_THRESHOLD,
  XP_PER_CORRECT,
  XP_STREAK_BONUS,
  XP_PER_LEVEL,
  MAX_LEVEL,
};
