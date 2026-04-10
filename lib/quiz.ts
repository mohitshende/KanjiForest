export function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function generateDistractors(
  correctAnswer: string,
  allAnswers: string[],
  count: number = 3
): string[] {
  const others = allAnswers.filter((a) => a !== correctAnswer);
  const shuffled = shuffleArray(others);
  return shuffled.slice(0, count);
}

export function generateOptions(
  correct: string,
  allPossible: string[],
  numOptions: number = 4
): string[] {
  const distractors = generateDistractors(correct, allPossible, numOptions - 1);
  return shuffleArray([correct, ...distractors]);
}

export function fuzzyMatch(input: string, target: string): boolean {
  const normalize = (s: string) =>
    s
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\u3040-\u309f\u30a0-\u30ff\u4e00-\u9faf]/g, '');
  return normalize(input) === normalize(target);
}

export function partialMatch(input: string, target: string): boolean {
  const normalize = (s: string) => s.toLowerCase().trim();
  const inputNorm = normalize(input);
  const targets = target.split(/[,;、]/).map(normalize);
  return targets.some(
    (t) => t.includes(inputNorm) || inputNorm.includes(t)
  );
}
