export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string; // Ionicons name
  color: string;
}

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_kanji',
    title: 'First Step',
    description: 'Learn your first kanji',
    icon: 'star-outline',
    color: '#F2B705',
  },
  {
    id: 'kanji_10',
    title: 'Getting Started',
    description: 'Learn 10 kanji',
    icon: 'school-outline',
    color: '#3A7BD5',
  },
  {
    id: 'kanji_50',
    title: 'Dedicated Learner',
    description: 'Learn 50 kanji',
    icon: 'ribbon-outline',
    color: '#27AE60',
  },
  {
    id: 'kanji_100',
    title: 'Century Club',
    description: 'Learn 100 kanji',
    icon: 'trophy-outline',
    color: '#F4A261',
  },
  {
    id: 'n5_complete',
    title: 'N5 Complete',
    description: 'Learn all N5 kanji',
    icon: 'checkmark-circle-outline',
    color: '#27AE60',
  },
  {
    id: 'streak_7',
    title: 'Week Warrior',
    description: 'Maintain a 7-day streak',
    icon: 'flame-outline',
    color: '#FF6B35',
  },
  {
    id: 'streak_30',
    title: 'Monthly Master',
    description: 'Maintain a 30-day streak',
    icon: 'flame',
    color: '#FF6B35',
  },
  {
    id: 'streak_100',
    title: '100-Day Streak',
    description: 'Maintain a 100-day streak',
    icon: 'medal-outline',
    color: '#F2B705',
  },
  {
    id: 'reviews_100',
    title: 'Review Regular',
    description: 'Complete 100 reviews',
    icon: 'refresh-circle-outline',
    color: '#3A7BD5',
  },
  {
    id: 'reviews_1000',
    title: 'Review Machine',
    description: 'Complete 1,000 reviews',
    icon: 'reload-circle-outline',
    color: '#7C5CBF',
  },
  {
    id: 'accuracy_90',
    title: 'Sharp Mind',
    description: 'Reach 90% accuracy over 50+ reviews',
    icon: 'checkmark-done-outline',
    color: '#27AE60',
  },
  {
    id: 'level_10',
    title: 'Rising Learner',
    description: 'Reach level 10',
    icon: 'trending-up-outline',
    color: '#3A7BD5',
  },
  {
    id: 'perfect_session',
    title: 'Perfect Session',
    description: 'Complete a session with 100% accuracy (10+ items)',
    icon: 'diamond-outline',
    color: '#F2B705',
  },
  {
    id: 'vocab_50',
    title: 'Word Hoarder',
    description: 'Learn 50 vocabulary words',
    icon: 'book-outline',
    color: '#F4A261',
  },
];

export const ACHIEVEMENT_MAP: Record<string, Achievement> = Object.fromEntries(
  ACHIEVEMENTS.map((a) => [a.id, a])
);
