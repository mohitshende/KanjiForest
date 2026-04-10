import { SRS_INTERVALS } from '@/constants/SRS';

export interface SRSCard {
  interval: number;       // days until next review
  repetitions: number;    // consecutive successes
  easeFactor: number;     // default 2.5
  nextReview: number;     // unix timestamp ms
  level: number;          // SRS level 0-9
}

export type Quality = 0 | 1 | 2 | 3 | 4 | 5;

export function createNewCard(): SRSCard {
  return {
    interval: 0,
    repetitions: 0,
    easeFactor: 2.5,
    nextReview: Date.now(),
    level: 0,
  };
}

export function sm2(card: SRSCard, quality: Quality): SRSCard {
  // quality: 0-1 = fail, 2 = hard, 3 = good, 4 = easy, 5 = very easy
  if (quality < 3) {
    // Failed — drop 2 levels, restart repetitions
    const newLevel = Math.max(0, card.level - 2);
    const intervalHours = SRS_INTERVALS[newLevel] || 4;
    return {
      ...card,
      repetitions: 0,
      interval: 1,
      level: newLevel,
      nextReview: Date.now() + intervalHours * 60 * 60 * 1000,
    };
  }

  // Passed
  const newEF = Math.max(
    1.3,
    card.easeFactor + 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)
  );

  let newInterval: number;
  if (card.repetitions === 0) {
    newInterval = 1;
  } else if (card.repetitions === 1) {
    newInterval = 6;
  } else {
    newInterval = Math.round(card.interval * newEF);
  }

  const newLevel = Math.min(9, card.level + 1);
  const intervalHours = SRS_INTERVALS[newLevel] || newInterval * 24;

  return {
    interval: newInterval,
    repetitions: card.repetitions + 1,
    easeFactor: newEF,
    level: newLevel,
    nextReview:
      newLevel >= 9
        ? Number.MAX_SAFE_INTEGER // Burned
        : Date.now() + intervalHours * 60 * 60 * 1000,
  };
}

export function qualityFromCorrect(correct: boolean, hintUsed: boolean): Quality {
  if (!correct) return 1;
  if (hintUsed) return 3;
  return 4;
}

export function isReviewDue(card: SRSCard): boolean {
  return card.level > 0 && card.level < 9 && Date.now() >= card.nextReview;
}

export function getNextReviewText(nextReview: number): string {
  if (nextReview >= Number.MAX_SAFE_INTEGER) return 'Burned';

  const diff = nextReview - Date.now();
  if (diff <= 0) return 'Now';

  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (hours < 1) return 'Less than 1h';
  if (hours < 24) return `${hours}h`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  if (days < 30) return `${Math.floor(days / 7)}w`;
  return `${Math.floor(days / 30)}mo`;
}

export function adjustIntervalsForDifficulty(
  difficulty: 'relaxed' | 'standard' | 'strict'
): number {
  switch (difficulty) {
    case 'relaxed':
      return 1.3;
    case 'standard':
      return 1.0;
    case 'strict':
      return 0.7;
  }
}
