import { useState, useEffect, useCallback } from 'react';
import { getReviewsDue } from '@/lib/database';

export function useReviewQueue() {
  const [queue, setQueue] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const reviews = await getReviewsDue();
      setQueue(reviews);
    } catch (e) {
      console.error('Failed to load review queue:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { queue, isLoading, refresh };
}
