export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  condition: (stats: AchievementStats) => boolean;
}

export interface AchievementStats {
  kanjiLearned: number;
  kanjiMastered: number;
  vocabLearned: number;
  totalReviews: number;
  currentStreak: number;
  longestStreak: number;
  totalXP: number;
  level: number;
}

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_kanji',
    title: 'First Steps',
    description: 'Learn your first kanji',
    icon: 'leaf',
    condition: (s) => s.kanjiLearned >= 1,
  },
  {
    id: 'kanji_10',
    title: 'Getting Started',
    description: 'Learn 10 kanji',
    icon: 'school',
    condition: (s) => s.kanjiLearned >= 10,
  },
  {
    id: 'kanji_50',
    title: 'Dedicated Student',
    description: 'Learn 50 kanji',
    icon: 'book',
    condition: (s) => s.kanjiLearned >= 50,
  },
  {
    id: 'kanji_100',
    title: 'Century Club',
    description: 'Learn 100 kanji',
    icon: 'trophy',
    condition: (s) => s.kanjiLearned >= 100,
  },
  {
    id: 'mastered_10',
    title: 'Mastery Begins',
    description: 'Master 10 kanji',
    icon: 'star',
    condition: (s) => s.kanjiMastered >= 10,
  },
  {
    id: 'streak_7',
    title: 'Week Warrior',
    description: '7-day study streak',
    icon: 'flame',
    condition: (s) => s.currentStreak >= 7,
  },
  {
    id: 'streak_30',
    title: 'Monthly Master',
    description: '30-day study streak',
    icon: 'flame',
    condition: (s) => s.currentStreak >= 30,
  },
  {
    id: 'streak_100',
    title: 'Unstoppable',
    description: '100-day study streak',
    icon: 'flame',
    condition: (s) => s.longestStreak >= 100,
  },
  {
    id: 'reviews_100',
    title: 'Reviewer',
    description: 'Complete 100 reviews',
    icon: 'checkmark-circle',
    condition: (s) => s.totalReviews >= 100,
  },
  {
    id: 'reviews_1000',
    title: 'Review Machine',
    description: 'Complete 1,000 reviews',
    icon: 'rocket',
    condition: (s) => s.totalReviews >= 1000,
  },
  {
    id: 'level_10',
    title: 'Rising Star',
    description: 'Reach level 10',
    icon: 'trending-up',
    condition: (s) => s.level >= 10,
  },
  {
    id: 'level_30',
    title: 'Kanji Scholar',
    description: 'Reach level 30',
    icon: 'medal',
    condition: (s) => s.level >= 30,
  },
  {
    id: 'n5_complete',
    title: 'JLPT N5 Ready',
    description: 'Learn all N5 kanji',
    icon: 'ribbon',
    condition: (s) => s.kanjiLearned >= 80,
  },
  {
    id: 'speed_learner',
    title: 'Speed Learner',
    description: 'Learn 10 kanji in one day',
    icon: 'flash',
    condition: () => false, // Checked separately via daily log
  },
  {
    id: 'vocab_50',
    title: 'Word Collector',
    description: 'Learn 50 vocabulary words',
    icon: 'chatbubbles',
    condition: (s) => s.vocabLearned >= 50,
  },
];

export function checkAchievements(
  stats: AchievementStats,
  unlockedIds: string[]
): Achievement[] {
  const newlyUnlocked: Achievement[] = [];

  for (const achievement of ACHIEVEMENTS) {
    if (unlockedIds.includes(achievement.id)) continue;
    if (achievement.condition(stats)) {
      newlyUnlocked.push(achievement);
    }
  }

  return newlyUnlocked;
}
