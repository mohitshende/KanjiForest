import { Platform } from 'react-native';

// ─── In-memory data stores (used on web, fallback on native) ───
const kanjiData: any[] = require('../assets/data/kanji.json');
const radicalsData: any[] = require('../assets/data/radicals.json');
const vocabularyData: any[] = require('../assets/data/vocabulary.json');
const sentencesData: any[] = require('../assets/data/sentences.json');

let kanjiProgressMap = new Map<number, any>();
// @ts-ignore -- reserved for future vocab progress tracking
let vocabProgressMap = new Map<number, any>();
let customListsArr: any[] = [];
let activityLogMap = new Map<string, any>();
let listIdCounter = 1;

const isWeb = Platform.OS === 'web';

// ─── SQLite (native only) ───
let db: any = null;

async function getNativeDatabase() {
  if (db) return db;
  const SQLite = require('expo-sqlite');
  db = await SQLite.openDatabaseAsync('kanjiforest.db');
  await db.execAsync('PRAGMA journal_mode = WAL;');
  return db;
}

// ─── Public: getDatabase (returns native db or null on web) ───
export async function getDatabase(): Promise<any> {
  if (isWeb) return null;
  return getNativeDatabase();
}

// ─── Initialize ───
export async function initializeDatabase(): Promise<void> {
  if (isWeb) return; // No setup needed — data is in-memory

  const database = await getNativeDatabase();
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS kanji (
      id INTEGER PRIMARY KEY, character TEXT NOT NULL, meaning TEXT,
      onyomi TEXT, kunyomi TEXT, stroke_count INTEGER, jlpt_level INTEGER,
      joyo_grade INTEGER, radical_ids TEXT, component_kanji_ids TEXT,
      stroke_path_data TEXT, mnemonic TEXT, frequency_rank INTEGER
    );
    CREATE TABLE IF NOT EXISTS radicals (
      id INTEGER PRIMARY KEY, character TEXT NOT NULL, meaning TEXT,
      stroke_count INTEGER, reading TEXT
    );
    CREATE TABLE IF NOT EXISTS vocabulary (
      id INTEGER PRIMARY KEY, word TEXT NOT NULL, reading TEXT, meaning TEXT,
      part_of_speech TEXT, example_sentence_id INTEGER, kanji_ids TEXT,
      jlpt_level INTEGER, frequency_rank INTEGER
    );
    CREATE TABLE IF NOT EXISTS sentences (
      id INTEGER PRIMARY KEY, japanese TEXT, reading TEXT, english TEXT, vocab_ids TEXT
    );
    CREATE TABLE IF NOT EXISTS kanji_progress (
      kanji_id INTEGER PRIMARY KEY, recognition_level INTEGER DEFAULT 0,
      reading_level INTEGER DEFAULT 0, writing_level INTEGER DEFAULT 0,
      next_recognition_review INTEGER, next_reading_review INTEGER,
      next_writing_review INTEGER, times_correct INTEGER DEFAULT 0,
      times_incorrect INTEGER DEFAULT 0, date_unlocked INTEGER, date_mastered INTEGER
    );
    CREATE TABLE IF NOT EXISTS vocab_progress (
      vocab_id INTEGER PRIMARY KEY, level INTEGER DEFAULT 0,
      next_review INTEGER, times_correct INTEGER DEFAULT 0,
      times_incorrect INTEGER DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS custom_lists (
      id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL,
      description TEXT, created_at INTEGER, kanji_ids TEXT, vocab_ids TEXT
    );
    CREATE TABLE IF NOT EXISTS activity_log (
      date TEXT PRIMARY KEY, reviews_done INTEGER DEFAULT 0,
      new_kanji_learned INTEGER DEFAULT 0, xp_earned INTEGER DEFAULT 0,
      study_time_minutes INTEGER DEFAULT 0
    );
  `);
}

// ─── Seed ───
export async function seedDatabase(): Promise<void> {
  if (isWeb) return;

  const database = await getNativeDatabase();
  const result = (await database.getFirstAsync(
    'SELECT COUNT(*) as count FROM kanji'
  )) as { count: number } | null;
  if (result && result.count > 0) return;

  for (const k of kanjiData) {
    await database.runAsync(
      `INSERT OR IGNORE INTO kanji VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      k.id, k.character, k.meaning, k.onyomi, k.kunyomi, k.stroke_count,
      k.jlpt_level, k.joyo_grade, JSON.stringify(k.radical_ids || []),
      JSON.stringify(k.component_kanji_ids || []), k.stroke_path_data || '',
      k.mnemonic || '', k.frequency_rank || 0
    );
  }
  for (const r of radicalsData) {
    await database.runAsync(
      `INSERT OR IGNORE INTO radicals VALUES (?,?,?,?,?)`,
      r.id, r.character, r.meaning, r.stroke_count, r.reading || ''
    );
  }
  for (const v of vocabularyData) {
    await database.runAsync(
      `INSERT OR IGNORE INTO vocabulary VALUES (?,?,?,?,?,?,?,?,?)`,
      v.id, v.word, v.reading, v.meaning, v.part_of_speech || '',
      v.example_sentence_id || null, JSON.stringify(v.kanji_ids || []),
      v.jlpt_level || 5, v.frequency_rank || 0
    );
  }
  for (const s of sentencesData) {
    await database.runAsync(
      `INSERT OR IGNORE INTO sentences VALUES (?,?,?,?,?)`,
      s.id, s.japanese, s.reading, s.english, JSON.stringify(s.vocab_ids || [])
    );
  }
}

// ═══════════════════════════════════════════════════════════════
// Query helpers — platform-aware
// ═══════════════════════════════════════════════════════════════

export async function getAllVocabulary() {
  if (isWeb) return vocabularyData;
  const database = await getNativeDatabase();
  return database.getAllAsync('SELECT * FROM vocabulary ORDER BY frequency_rank');
}

export async function getAllKanji() {
  if (isWeb) return kanjiData;
  const database = await getNativeDatabase();
  return database.getAllAsync('SELECT * FROM kanji ORDER BY id');
}

export async function getKanjiById(id: number) {
  if (isWeb) return kanjiData.find((k: any) => k.id === id) || null;
  const database = await getNativeDatabase();
  return database.getFirstAsync('SELECT * FROM kanji WHERE id = ?', id);
}

export async function getKanjiByJlptLevel(level: number) {
  if (isWeb) return kanjiData.filter((k: any) => k.jlpt_level === level);
  const database = await getNativeDatabase();
  return database.getAllAsync('SELECT * FROM kanji WHERE jlpt_level = ? ORDER BY frequency_rank', level);
}

export async function getVocabularyForKanji(kanjiId: number) {
  if (isWeb) {
    return vocabularyData.filter((v: any) => {
      const ids = Array.isArray(v.kanji_ids) ? v.kanji_ids : JSON.parse(v.kanji_ids || '[]');
      return ids.includes(kanjiId);
    });
  }
  const database = await getNativeDatabase();
  return database.getAllAsync("SELECT * FROM vocabulary WHERE kanji_ids LIKE ?", `%${kanjiId}%`);
}

export async function getVocabById(id: number) {
  if (isWeb) return vocabularyData.find((v: any) => v.id === id) || null;
  const database = await getNativeDatabase();
  return database.getFirstAsync('SELECT * FROM vocabulary WHERE id = ?', id);
}

export async function getSentenceById(id: number) {
  if (isWeb) return sentencesData.find((s: any) => s.id === id) || null;
  const database = await getNativeDatabase();
  return database.getFirstAsync('SELECT * FROM sentences WHERE id = ?', id);
}

export async function getAllRadicals() {
  if (isWeb) return radicalsData;
  const database = await getNativeDatabase();
  return database.getAllAsync('SELECT * FROM radicals ORDER BY id');
}

// ─── Progress helpers ───

function getOrCreateProgress(kanjiId: number) {
  if (!kanjiProgressMap.has(kanjiId)) {
    kanjiProgressMap.set(kanjiId, {
      kanji_id: kanjiId,
      recognition_level: 0, reading_level: 0, writing_level: 0,
      next_recognition_review: null, next_reading_review: null, next_writing_review: null,
      times_correct: 0, times_incorrect: 0, date_unlocked: null, date_mastered: null,
    });
  }
  return kanjiProgressMap.get(kanjiId);
}

export async function getKanjiProgress(kanjiId: number) {
  if (isWeb) return kanjiProgressMap.get(kanjiId) || null;
  const database = await getNativeDatabase();
  return database.getFirstAsync('SELECT * FROM kanji_progress WHERE kanji_id = ?', kanjiId);
}

export async function updateKanjiProgress(
  kanjiId: number,
  field: 'recognition_level' | 'reading_level' | 'writing_level',
  level: number,
  nextReviewField: string,
  nextReview: number | null
) {
  if (isWeb) {
    const p = getOrCreateProgress(kanjiId);
    p[field] = level;
    p[nextReviewField] = nextReview;
    return;
  }
  const database = await getNativeDatabase();
  await database.runAsync(
    `INSERT INTO kanji_progress (kanji_id, ${field}, ${nextReviewField})
     VALUES (?, ?, ?)
     ON CONFLICT(kanji_id) DO UPDATE SET ${field} = ?, ${nextReviewField} = ?`,
    kanjiId, level, nextReview, level, nextReview
  );
}

export async function recordCorrect(kanjiId: number) {
  if (isWeb) {
    const p = getOrCreateProgress(kanjiId);
    p.times_correct++;
    return;
  }
  const database = await getNativeDatabase();
  await database.runAsync(
    `INSERT INTO kanji_progress (kanji_id, times_correct) VALUES (?, 1)
     ON CONFLICT(kanji_id) DO UPDATE SET times_correct = times_correct + 1`,
    kanjiId
  );
}

export async function recordIncorrect(kanjiId: number) {
  if (isWeb) {
    const p = getOrCreateProgress(kanjiId);
    p.times_incorrect++;
    return;
  }
  const database = await getNativeDatabase();
  await database.runAsync(
    `INSERT INTO kanji_progress (kanji_id, times_incorrect) VALUES (?, 1)
     ON CONFLICT(kanji_id) DO UPDATE SET times_incorrect = times_incorrect + 1`,
    kanjiId
  );
}

export async function unlockKanji(kanjiId: number) {
  if (isWeb) {
    const p = getOrCreateProgress(kanjiId);
    p.date_unlocked = Date.now();
    return;
  }
  const database = await getNativeDatabase();
  await database.runAsync(
    `INSERT INTO kanji_progress (kanji_id, date_unlocked) VALUES (?, ?)
     ON CONFLICT(kanji_id) DO UPDATE SET date_unlocked = ?`,
    kanjiId, Date.now(), Date.now()
  );
}

export async function getReviewsDue(): Promise<any[]> {
  if (isWeb) {
    const now = Date.now();
    const results: any[] = [];
    kanjiProgressMap.forEach((kp) => {
      if (
        (kp.next_recognition_review && kp.next_recognition_review <= now) ||
        (kp.next_reading_review && kp.next_reading_review <= now) ||
        (kp.next_writing_review && kp.next_writing_review <= now)
      ) {
        const k = kanjiData.find((x: any) => x.id === kp.kanji_id);
        if (k) results.push({ ...kp, character: k.character, meaning: k.meaning, onyomi: k.onyomi, kunyomi: k.kunyomi });
      }
    });
    return results;
  }
  const database = await getNativeDatabase();
  const now = Date.now();
  return database.getAllAsync(
    `SELECT kp.*, k.character, k.meaning, k.onyomi, k.kunyomi
     FROM kanji_progress kp JOIN kanji k ON k.id = kp.kanji_id
     WHERE (kp.next_recognition_review IS NOT NULL AND kp.next_recognition_review <= ?)
        OR (kp.next_reading_review IS NOT NULL AND kp.next_reading_review <= ?)
        OR (kp.next_writing_review IS NOT NULL AND kp.next_writing_review <= ?)`,
    now, now, now
  );
}

export async function getUnlockedKanjiIds(): Promise<number[]> {
  if (isWeb) {
    const ids: number[] = [];
    kanjiProgressMap.forEach((v, k) => { if (v.date_unlocked) ids.push(k); });
    return ids;
  }
  const database = await getNativeDatabase();
  const rows = (await database.getAllAsync(
    'SELECT kanji_id FROM kanji_progress WHERE date_unlocked IS NOT NULL'
  )) as { kanji_id: number }[];
  return rows.map((r: { kanji_id: number }) => r.kanji_id);
}

export async function getMasteredKanjiIds(): Promise<number[]> {
  if (isWeb) {
    const ids: number[] = [];
    kanjiProgressMap.forEach((v, k) => {
      if (v.recognition_level >= 4 && v.reading_level >= 4 && v.writing_level >= 4) ids.push(k);
    });
    return ids;
  }
  const database = await getNativeDatabase();
  const rows = (await database.getAllAsync(
    `SELECT kanji_id FROM kanji_progress
     WHERE recognition_level >= 4 AND reading_level >= 4 AND writing_level >= 4`
  )) as { kanji_id: number }[];
  return rows.map((r: { kanji_id: number }) => r.kanji_id);
}

// ─── Activity log ───

export async function logActivity(
  date: string, reviewsDone: number, newKanjiLearned: number,
  xpEarned: number, studyTimeMinutes: number
) {
  if (isWeb) {
    const existing = activityLogMap.get(date) || {
      date, reviews_done: 0, new_kanji_learned: 0, xp_earned: 0, study_time_minutes: 0,
    };
    existing.reviews_done += reviewsDone;
    existing.new_kanji_learned += newKanjiLearned;
    existing.xp_earned += xpEarned;
    existing.study_time_minutes += studyTimeMinutes;
    activityLogMap.set(date, existing);
    return;
  }
  const database = await getNativeDatabase();
  await database.runAsync(
    `INSERT INTO activity_log (date, reviews_done, new_kanji_learned, xp_earned, study_time_minutes)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(date) DO UPDATE SET
       reviews_done = reviews_done + ?, new_kanji_learned = new_kanji_learned + ?,
       xp_earned = xp_earned + ?, study_time_minutes = study_time_minutes + ?`,
    date, reviewsDone, newKanjiLearned, xpEarned, studyTimeMinutes,
    reviewsDone, newKanjiLearned, xpEarned, studyTimeMinutes
  );
}

export async function getActivityLog(days: number = 365) {
  if (isWeb) {
    return Array.from(activityLogMap.values())
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, days);
  }
  const database = await getNativeDatabase();
  return database.getAllAsync(`SELECT * FROM activity_log ORDER BY date DESC LIMIT ?`, days);
}

// ─── Custom lists ───

export async function createCustomList(
  name: string, description: string, kanjiIds: number[], vocabIds: number[]
) {
  if (isWeb) {
    const id = listIdCounter++;
    customListsArr.push({
      id, name, description, created_at: Date.now(),
      kanji_ids: JSON.stringify(kanjiIds), vocab_ids: JSON.stringify(vocabIds),
    });
    return id;
  }
  const database = await getNativeDatabase();
  const result = await database.runAsync(
    `INSERT INTO custom_lists (name, description, created_at, kanji_ids, vocab_ids) VALUES (?, ?, ?, ?, ?)`,
    name, description, Date.now(), JSON.stringify(kanjiIds), JSON.stringify(vocabIds)
  );
  return result.lastInsertRowId;
}

export async function getAllCustomLists() {
  if (isWeb) return [...customListsArr].sort((a, b) => b.created_at - a.created_at);
  const database = await getNativeDatabase();
  return database.getAllAsync('SELECT * FROM custom_lists ORDER BY created_at DESC');
}

export async function getCustomListById(id: number) {
  if (isWeb) return customListsArr.find((l) => l.id === id) || null;
  const database = await getNativeDatabase();
  return database.getFirstAsync('SELECT * FROM custom_lists WHERE id = ?', id);
}

export async function updateCustomList(id: number, kanjiIds: number[], vocabIds: number[]) {
  if (isWeb) {
    const list = customListsArr.find((l) => l.id === id);
    if (list) {
      list.kanji_ids = JSON.stringify(kanjiIds);
      list.vocab_ids = JSON.stringify(vocabIds);
    }
    return;
  }
  const database = await getNativeDatabase();
  await database.runAsync('UPDATE custom_lists SET kanji_ids = ?, vocab_ids = ? WHERE id = ?',
    JSON.stringify(kanjiIds), JSON.stringify(vocabIds), id);
}

export async function deleteCustomList(id: number) {
  if (isWeb) {
    customListsArr = customListsArr.filter((l) => l.id !== id);
    return;
  }
  const database = await getNativeDatabase();
  await database.runAsync('DELETE FROM custom_lists WHERE id = ?', id);
}

// ─── Search ───

export async function searchKanji(query: string) {
  if (isWeb) {
    const q = query.toLowerCase();
    return kanjiData.filter((k: any) =>
      k.character.includes(q) || (k.meaning || '').toLowerCase().includes(q) ||
      (k.onyomi || '').toLowerCase().includes(q) || (k.kunyomi || '').toLowerCase().includes(q)
    ).slice(0, 50);
  }
  const database = await getNativeDatabase();
  return database.getAllAsync(
    `SELECT * FROM kanji WHERE character LIKE ? OR meaning LIKE ? OR onyomi LIKE ? OR kunyomi LIKE ? ORDER BY frequency_rank LIMIT 50`,
    `%${query}%`, `%${query}%`, `%${query}%`, `%${query}%`
  );
}

export async function searchVocabulary(query: string) {
  if (isWeb) {
    const q = query.toLowerCase();
    return vocabularyData.filter((v: any) =>
      (v.word || '').includes(q) || (v.reading || '').includes(q) ||
      (v.meaning || '').toLowerCase().includes(q)
    ).slice(0, 50);
  }
  const database = await getNativeDatabase();
  return database.getAllAsync(
    `SELECT * FROM vocabulary WHERE word LIKE ? OR reading LIKE ? OR meaning LIKE ? ORDER BY frequency_rank LIMIT 50`,
    `%${query}%`, `%${query}%`, `%${query}%`
  );
}
