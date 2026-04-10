import { searchKanji, searchVocabulary } from './database';

export interface SearchResult {
  type: 'kanji' | 'vocabulary';
  id: number;
  primary: string;
  secondary: string;
  tertiary?: string;
}

export async function universalSearch(query: string): Promise<SearchResult[]> {
  if (!query.trim()) return [];

  const [kanjiResults, vocabResults] = await Promise.all([
    searchKanji(query.trim()),
    searchVocabulary(query.trim()),
  ]);

  const results: SearchResult[] = [];

  for (const k of kanjiResults as any[]) {
    results.push({
      type: 'kanji',
      id: k.id,
      primary: k.character,
      secondary: k.meaning,
      tertiary: `N${k.jlpt_level}`,
    });
  }

  for (const v of vocabResults as any[]) {
    results.push({
      type: 'vocabulary',
      id: v.id,
      primary: v.word,
      secondary: v.meaning,
      tertiary: v.reading,
    });
  }

  return results;
}
