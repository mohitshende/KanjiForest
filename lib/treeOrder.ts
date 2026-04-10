export interface KanjiNode {
  id: number;
  character: string;
  meaning: string;
  component_kanji_ids: number[];
  jlpt_level: number;
  joyo_grade: number;
}

export type KanjiStatus = 'locked' | 'unlocked' | 'learning' | 'mastered';

export function isUnlocked(
  kanjiId: number,
  masteredIds: Set<number>,
  kanjiData: KanjiNode[]
): boolean {
  const kanji = kanjiData.find((k) => k.id === kanjiId);
  if (!kanji) return false;

  const deps = kanji.component_kanji_ids;
  if (!deps || deps.length === 0) return true;

  return deps.every((id) => masteredIds.has(id));
}

export function getTreeOrder(kanjiData: KanjiNode[]): number[] {
  // Kahn's algorithm for topological sort
  const inDegree = new Map<number, number>();
  const adjacency = new Map<number, number[]>();
  const allIds = new Set<number>();

  for (const k of kanjiData) {
    allIds.add(k.id);
    if (!inDegree.has(k.id)) inDegree.set(k.id, 0);
    if (!adjacency.has(k.id)) adjacency.set(k.id, []);

    const deps = k.component_kanji_ids || [];
    for (const depId of deps) {
      if (!adjacency.has(depId)) adjacency.set(depId, []);
      adjacency.get(depId)!.push(k.id);
      inDegree.set(k.id, (inDegree.get(k.id) || 0) + 1);
    }
  }

  const queue: number[] = [];
  for (const id of allIds) {
    if ((inDegree.get(id) || 0) === 0) {
      queue.push(id);
    }
  }

  // Sort initial queue by grade then frequency for deterministic order
  queue.sort((a, b) => {
    const ka = kanjiData.find((k) => k.id === a)!;
    const kb = kanjiData.find((k) => k.id === b)!;
    if (ka.joyo_grade !== kb.joyo_grade) return ka.joyo_grade - kb.joyo_grade;
    return a - b;
  });

  const result: number[] = [];

  while (queue.length > 0) {
    const current = queue.shift()!;
    result.push(current);

    const neighbors = adjacency.get(current) || [];
    for (const neighbor of neighbors) {
      const newDegree = (inDegree.get(neighbor) || 1) - 1;
      inDegree.set(neighbor, newDegree);
      if (newDegree === 0) {
        queue.push(neighbor);
      }
    }
  }

  return result;
}

export function getKanjiStatus(
  kanjiId: number,
  unlockedIds: Set<number>,
  masteredIds: Set<number>,
  kanjiData: KanjiNode[]
): KanjiStatus {
  if (masteredIds.has(kanjiId)) return 'mastered';
  if (unlockedIds.has(kanjiId)) return 'learning';
  if (isUnlocked(kanjiId, masteredIds, kanjiData)) return 'unlocked';
  return 'locked';
}

export function getAvailableKanji(
  kanjiData: KanjiNode[],
  unlockedIds: Set<number>,
  masteredIds: Set<number>,
  limit: number
): KanjiNode[] {
  const treeOrder = getTreeOrder(kanjiData);
  const available: KanjiNode[] = [];

  for (const id of treeOrder) {
    if (available.length >= limit) break;
    if (unlockedIds.has(id) || masteredIds.has(id)) continue;
    if (isUnlocked(id, masteredIds, kanjiData)) {
      const kanji = kanjiData.find((k) => k.id === id);
      if (kanji) available.push(kanji);
    }
  }

  return available;
}
