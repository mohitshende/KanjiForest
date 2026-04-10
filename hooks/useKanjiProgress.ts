import { useState, useEffect, useCallback } from 'react';
import {
  getAllKanji,
  getUnlockedKanjiIds,
  getMasteredKanjiIds,
  getReviewsDue,
} from '@/lib/database';
import { KanjiNode } from '@/lib/treeOrder';

export function useKanjiProgress() {
  const [kanjiData, setKanjiData] = useState<KanjiNode[]>([]);
  const [unlockedIds, setUnlockedIds] = useState<Set<number>>(new Set());
  const [masteredIds, setMasteredIds] = useState<Set<number>>(new Set());
  const [reviewsDue, setReviewsDue] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const [allKanji, unlocked, mastered, reviews] = await Promise.all([
        getAllKanji(),
        getUnlockedKanjiIds(),
        getMasteredKanjiIds(),
        getReviewsDue(),
      ]);

      setKanjiData(
        (allKanji as any[]).map((k) => ({
          ...k,
          component_kanji_ids: Array.isArray(k.component_kanji_ids)
            ? k.component_kanji_ids
            : JSON.parse(k.component_kanji_ids || '[]'),
        }))
      );
      setUnlockedIds(new Set(unlocked));
      setMasteredIds(new Set(mastered));
      setReviewsDue(reviews);
    } catch (e) {
      console.error('Failed to load kanji progress:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    kanjiData,
    unlockedIds,
    masteredIds,
    reviewsDue,
    isLoading,
    refresh,
  };
}
