import { useProgressStore } from '@/stores/useProgressStore';
import { useStreakStore } from '@/stores/useStreakStore';

/**
 * Check and unlock any newly earned achievements based on current state.
 * Call this after any game session completes.
 */
export function checkAchievements(opts?: {
  sessionCorrect?: number;
  sessionTotal?: number;
}) {
  const {
    kanjiLearnedCount,
    totalReviews,
    totalCorrect,
    level,
    vocabLearnedCount,
    achievements,
    unlockAchievement,
  } = useProgressStore.getState();

  const { currentStreak } = useStreakStore.getState();

  const unlock = (id: string) => {
    if (!achievements.includes(id)) {
      unlockAchievement(id);
      return true;
    }
    return false;
  };

  // Kanji milestones
  if (kanjiLearnedCount >= 1) unlock('first_kanji');
  if (kanjiLearnedCount >= 10) unlock('kanji_10');
  if (kanjiLearnedCount >= 50) unlock('kanji_50');
  if (kanjiLearnedCount >= 100) unlock('kanji_100');
  // N5 is ~80 kanji
  if (kanjiLearnedCount >= 80) unlock('n5_complete');

  // Streak milestones
  if (currentStreak >= 7) unlock('streak_7');
  if (currentStreak >= 30) unlock('streak_30');
  if (currentStreak >= 100) unlock('streak_100');

  // Review milestones
  if (totalReviews >= 100) unlock('reviews_100');
  if (totalReviews >= 1000) unlock('reviews_1000');

  // Accuracy (need at least 50 reviews)
  if (totalReviews >= 50 && totalCorrect / totalReviews >= 0.9) unlock('accuracy_90');

  // Level milestones
  if (level >= 10) unlock('level_10');

  // Vocab milestones
  if (vocabLearnedCount >= 50) unlock('vocab_50');

  // Perfect session (called from game)
  if (
    opts?.sessionTotal != null &&
    opts.sessionTotal >= 10 &&
    opts.sessionCorrect === opts.sessionTotal
  ) {
    unlock('perfect_session');
  }
}
