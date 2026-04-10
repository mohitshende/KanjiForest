import * as SQLite from 'expo-sqlite';

let db: SQLite.SQLiteDatabase | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (db) return db;
  db = await SQLite.openDatabaseAsync('kanjiforest.db');
  await db.execAsync('PRAGMA journal_mode = WAL;');
  return db;
}

export async function initializeDatabase(): Promise<void> {
  const database = await getDatabase();

  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS kanji (
      id INTEGER PRIMARY KEY,
      character TEXT NOT NULL,
      meaning TEXT,
      onyomi TEXT,
      kunyomi TEXT,
      stroke_count INTEGER,
      jlpt_level INTEGER,
      joyo_grade INTEGER,
      radical_ids TEXT,
      component_kanji_ids TEXT,
      stroke_path_data TEXT,
      mnemonic TEXT,
      frequency_rank INTEGER
    );

    CREATE TABLE IF NOT EXISTS radicals (
      id INTEGER PRIMARY KEY,
      character TEXT NOT NULL,
      meaning TEXT,
      stroke_count INTEGER,
      reading TEXT
    );

    CREATE TABLE IF NOT EXISTS vocabulary (
      id INTEGER PRIMARY KEY,
      word TEXT NOT NULL,
      reading TEXT,
      meaning TEXT,
      part_of_speech TEXT,
      example_sentence_id INTEGER,
      kanji_ids TEXT,
      jlpt_level INTEGER,
      frequency_rank INTEGER
    );

    CREATE TABLE IF NOT EXISTS sentences (
      id INTEGER PRIMARY KEY,
      japanese TEXT,
      reading TEXT,
      english TEXT,
      vocab_ids TEXT
    );

    CREATE TABLE IF NOT EXISTS kanji_progress (
      kanji_id INTEGER PRIMARY KEY,
      recognition_level INTEGER DEFAULT 0,
      reading_level INTEGER DEFAULT 0,
      writing_level INTEGER DEFAULT 0,
      next_recognition_review INTEGER,
      next_reading_review INTEGER,
      next_writing_review INTEGER,
      times_correct INTEGER DEFAULT 0,
      times_incorrect INTEGER DEFAULT 0,
      date_unlocked INTEGER,
      date_mastered INTEGER
    );

    CREATE TABLE IF NOT EXISTS vocab_progress (
      vocab_id INTEGER PRIMARY KEY,
      level INTEGER DEFAULT 0,
      next_review INTEGER,
      times_correct INTEGER DEFAULT 0,
      times_incorrect INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS custom_lists (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      created_at INTEGER,
      kanji_ids TEXT,
      vocab_ids TEXT
    );

    CREATE TABLE IF NOT EXISTS activity_log (
      date TEXT PRIMARY KEY,
      reviews_done INTEGER DEFAULT 0,
      new_kanji_learned INTEGER DEFAULT 0,
      xp_earned INTEGER DEFAULT 0,
      study_time_minutes INTEGER DEFAULT 0
    );
  `);
}

export async function seedDatabase(): Promise<void> {
  const database = await getDatabase();

  // Check if already seeded
  const result = await database.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM kanji'
  );
  if (result && result.count > 0) return;

  // Load seed data from bundled JSON
  const kanjiData = require('../assets/data/kanji.json');
  const radicalsData = require('../assets/data/radicals.json');
  const vocabularyData = require('../assets/data/vocabulary.json');
  const sentencesData = require('../assets/data/sentences.json');

  // Seed kanji
  for (const k of kanjiData) {
    await database.runAsync(
      `INSERT OR IGNORE INTO kanji (id, character, meaning, onyomi, kunyomi, stroke_count, jlpt_level, joyo_grade, radical_ids, component_kanji_ids, stroke_path_data, mnemonic, frequency_rank)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      k.id,
      k.character,
      k.meaning,
      k.onyomi,
      k.kunyomi,
      k.stroke_count,
      k.jlpt_level,
      k.joyo_grade,
      JSON.stringify(k.radical_ids || []),
      JSON.stringify(k.component_kanji_ids || []),
      k.stroke_path_data || '',
      k.mnemonic || '',
      k.frequency_rank || 0
    );
  }

  // Seed radicals
  for (const r of radicalsData) {
    await database.runAsync(
      `INSERT OR IGNORE INTO radicals (id, character, meaning, stroke_count, reading)
       VALUES (?, ?, ?, ?, ?)`,
      r.id,
      r.character,
      r.meaning,
      r.stroke_count,
      r.reading || ''
    );
  }

  // Seed vocabulary
  for (const v of vocabularyData) {
    await database.runAsync(
      `INSERT OR IGNORE INTO vocabulary (id, word, reading, meaning, part_of_speech, example_sentence_id, kanji_ids, jlpt_level, frequency_rank)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      v.id,
      v.word,
      v.reading,
      v.meaning,
      v.part_of_speech || '',
      v.example_sentence_id || null,
      JSON.stringify(v.kanji_ids || []),
      v.jlpt_level || 5,
      v.frequency_rank || 0
    );
  }

  // Seed sentences
  for (const s of sentencesData) {
    await database.runAsync(
      `INSERT OR IGNORE INTO sentences (id, japanese, reading, english, vocab_ids)
       VALUES (?, ?, ?, ?, ?)`,
      s.id,
      s.japanese,
      s.reading,
      s.english,
      JSON.stringify(s.vocab_ids || [])
    );
  }
}

// Query helpers
export async function getAllKanji() {
  const database = await getDatabase();
  return database.getAllAsync('SELECT * FROM kanji ORDER BY id');
}

export async function getKanjiById(id: number) {
  const database = await getDatabase();
  return database.getFirstAsync('SELECT * FROM kanji WHERE id = ?', id);
}

export async function getKanjiByJlptLevel(level: number) {
  const database = await getDatabase();
  return database.getAllAsync(
    'SELECT * FROM kanji WHERE jlpt_level = ? ORDER BY frequency_rank',
    level
  );
}

export async function getVocabularyForKanji(kanjiId: number) {
  const database = await getDatabase();
  return database.getAllAsync(
    "SELECT * FROM vocabulary WHERE kanji_ids LIKE ?",
    `%${kanjiId}%`
  );
}

export async function getVocabById(id: number) {
  const database = await getDatabase();
  return database.getFirstAsync('SELECT * FROM vocabulary WHERE id = ?', id);
}

export async function getSentenceById(id: number) {
  const database = await getDatabase();
  return database.getFirstAsync('SELECT * FROM sentences WHERE id = ?', id);
}

export async function getAllRadicals() {
  const database = await getDatabase();
  return database.getAllAsync('SELECT * FROM radicals ORDER BY id');
}

// Progress helpers
export async function getKanjiProgress(kanjiId: number) {
  const database = await getDatabase();
  return database.getFirstAsync(
    'SELECT * FROM kanji_progress WHERE kanji_id = ?',
    kanjiId
  );
}

export async function updateKanjiProgress(
  kanjiId: number,
  field: 'recognition_level' | 'reading_level' | 'writing_level',
  level: number,
  nextReviewField: string,
  nextReview: number | null
) {
  const database = await getDatabase();
  await database.runAsync(
    `INSERT INTO kanji_progress (kanji_id, ${field}, ${nextReviewField})
     VALUES (?, ?, ?)
     ON CONFLICT(kanji_id) DO UPDATE SET ${field} = ?, ${nextReviewField} = ?`,
    kanjiId,
    level,
    nextReview,
    level,
    nextReview
  );
}

export async function recordCorrect(kanjiId: number) {
  const database = await getDatabase();
  await database.runAsync(
    `INSERT INTO kanji_progress (kanji_id, times_correct) VALUES (?, 1)
     ON CONFLICT(kanji_id) DO UPDATE SET times_correct = times_correct + 1`,
    kanjiId
  );
}

export async function recordIncorrect(kanjiId: number) {
  const database = await getDatabase();
  await database.runAsync(
    `INSERT INTO kanji_progress (kanji_id, times_incorrect) VALUES (?, 1)
     ON CONFLICT(kanji_id) DO UPDATE SET times_incorrect = times_incorrect + 1`,
    kanjiId
  );
}

export async function unlockKanji(kanjiId: number) {
  const database = await getDatabase();
  await database.runAsync(
    `INSERT INTO kanji_progress (kanji_id, date_unlocked) VALUES (?, ?)
     ON CONFLICT(kanji_id) DO UPDATE SET date_unlocked = ?`,
    kanjiId,
    Date.now(),
    Date.now()
  );
}

export async function getReviewsDue(): Promise<any[]> {
  const database = await getDatabase();
  const now = Date.now();
  return database.getAllAsync(
    `SELECT kp.*, k.character, k.meaning, k.onyomi, k.kunyomi
     FROM kanji_progress kp
     JOIN kanji k ON k.id = kp.kanji_id
     WHERE (kp.next_recognition_review IS NOT NULL AND kp.next_recognition_review <= ?)
        OR (kp.next_reading_review IS NOT NULL AND kp.next_reading_review <= ?)
        OR (kp.next_writing_review IS NOT NULL AND kp.next_writing_review <= ?)`,
    now,
    now,
    now
  );
}

export async function getUnlockedKanjiIds(): Promise<number[]> {
  const database = await getDatabase();
  const rows = await database.getAllAsync<{ kanji_id: number }>(
    'SELECT kanji_id FROM kanji_progress WHERE date_unlocked IS NOT NULL'
  );
  return rows.map((r) => r.kanji_id);
}

export async function getMasteredKanjiIds(): Promise<number[]> {
  const database = await getDatabase();
  const rows = await database.getAllAsync<{ kanji_id: number }>(
    `SELECT kanji_id FROM kanji_progress
     WHERE recognition_level >= 4 AND reading_level >= 4 AND writing_level >= 4`
  );
  return rows.map((r) => r.kanji_id);
}

// Activity log
export async function logActivity(
  date: string,
  reviewsDone: number,
  newKanjiLearned: number,
  xpEarned: number,
  studyTimeMinutes: number
) {
  const database = await getDatabase();
  await database.runAsync(
    `INSERT INTO activity_log (date, reviews_done, new_kanji_learned, xp_earned, study_time_minutes)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(date) DO UPDATE SET
       reviews_done = reviews_done + ?,
       new_kanji_learned = new_kanji_learned + ?,
       xp_earned = xp_earned + ?,
       study_time_minutes = study_time_minutes + ?`,
    date,
    reviewsDone,
    newKanjiLearned,
    xpEarned,
    studyTimeMinutes,
    reviewsDone,
    newKanjiLearned,
    xpEarned,
    studyTimeMinutes
  );
}

export async function getActivityLog(days: number = 365) {
  const database = await getDatabase();
  return database.getAllAsync(
    `SELECT * FROM activity_log ORDER BY date DESC LIMIT ?`,
    days
  );
}

// Custom lists
export async function createCustomList(
  name: string,
  description: string,
  kanjiIds: number[],
  vocabIds: number[]
) {
  const database = await getDatabase();
  const result = await database.runAsync(
    `INSERT INTO custom_lists (name, description, created_at, kanji_ids, vocab_ids)
     VALUES (?, ?, ?, ?, ?)`,
    name,
    description,
    Date.now(),
    JSON.stringify(kanjiIds),
    JSON.stringify(vocabIds)
  );
  return result.lastInsertRowId;
}

export async function getAllCustomLists() {
  const database = await getDatabase();
  return database.getAllAsync('SELECT * FROM custom_lists ORDER BY created_at DESC');
}

export async function getCustomListById(id: number) {
  const database = await getDatabase();
  return database.getFirstAsync('SELECT * FROM custom_lists WHERE id = ?', id);
}

export async function updateCustomList(
  id: number,
  kanjiIds: number[],
  vocabIds: number[]
) {
  const database = await getDatabase();
  await database.runAsync(
    'UPDATE custom_lists SET kanji_ids = ?, vocab_ids = ? WHERE id = ?',
    JSON.stringify(kanjiIds),
    JSON.stringify(vocabIds),
    id
  );
}

export async function deleteCustomList(id: number) {
  const database = await getDatabase();
  await database.runAsync('DELETE FROM custom_lists WHERE id = ?', id);
}

// Search
export async function searchKanji(query: string) {
  const database = await getDatabase();
  return database.getAllAsync(
    `SELECT * FROM kanji
     WHERE character LIKE ? OR meaning LIKE ? OR onyomi LIKE ? OR kunyomi LIKE ?
     ORDER BY frequency_rank LIMIT 50`,
    `%${query}%`,
    `%${query}%`,
    `%${query}%`,
    `%${query}%`
  );
}

export async function searchVocabulary(query: string) {
  const database = await getDatabase();
  return database.getAllAsync(
    `SELECT * FROM vocabulary
     WHERE word LIKE ? OR reading LIKE ? OR meaning LIKE ?
     ORDER BY frequency_rank LIMIT 50`,
    `%${query}%`,
    `%${query}%`,
    `%${query}%`
  );
}
