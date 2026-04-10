import { useEffect, useState } from 'react';
import { initializeDatabase, seedDatabase } from '@/lib/database';

export function useDatabase() {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;

    async function setup() {
      try {
        await initializeDatabase();
        await seedDatabase();
        if (mounted) setIsReady(true);
      } catch (err) {
        console.error('Database initialization failed:', err);
        if (mounted) setError(err as Error);
      }
    }

    setup();
    return () => {
      mounted = false;
    };
  }, []);

  return { isReady, error };
}
