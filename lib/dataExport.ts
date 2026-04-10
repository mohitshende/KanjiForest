import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getDatabase } from './database';

export interface BackupData {
  version: 1;
  timestamp: string;
  settings: Record<string, any>;
  progress: Record<string, any>;
  streak: Record<string, any>;
  kanjiProgress: any[];
  vocabProgress: any[];
  customLists: any[];
  activityLog: any[];
}

export async function exportData(): Promise<string> {
  const db = await getDatabase();

  const [settings, progress, streak] = await Promise.all([
    AsyncStorage.getItem('kanjiforest_settings'),
    AsyncStorage.getItem('kanjiforest_progress'),
    AsyncStorage.getItem('kanjiforest_streak'),
  ]);

  const [kanjiProgress, vocabProgress, customLists, activityLog] = await Promise.all([
    db.getAllAsync('SELECT * FROM kanji_progress'),
    db.getAllAsync('SELECT * FROM vocab_progress'),
    db.getAllAsync('SELECT * FROM custom_lists'),
    db.getAllAsync('SELECT * FROM activity_log'),
  ]);

  const backup: BackupData = {
    version: 1,
    timestamp: new Date().toISOString(),
    settings: settings ? JSON.parse(settings) : {},
    progress: progress ? JSON.parse(progress) : {},
    streak: streak ? JSON.parse(streak) : {},
    kanjiProgress,
    vocabProgress,
    customLists,
    activityLog,
  };

  const json = JSON.stringify(backup, null, 2);
  const filePath = `${FileSystem.documentDirectory}kanjiforest_backup.json`;

  await FileSystem.writeAsStringAsync(filePath, json);

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(filePath, {
      mimeType: 'application/json',
      dialogTitle: 'Export KanjiForest Data',
    });
  }

  return filePath;
}

export async function importData(json: string): Promise<boolean> {
  try {
    const backup: BackupData = JSON.parse(json);

    if (backup.version !== 1) {
      throw new Error('Unsupported backup version');
    }

    // Restore AsyncStorage data
    if (backup.settings) {
      await AsyncStorage.setItem(
        'kanjiforest_settings',
        JSON.stringify(backup.settings)
      );
    }
    if (backup.progress) {
      await AsyncStorage.setItem(
        'kanjiforest_progress',
        JSON.stringify(backup.progress)
      );
    }
    if (backup.streak) {
      await AsyncStorage.setItem(
        'kanjiforest_streak',
        JSON.stringify(backup.streak)
      );
    }

    // Restore SQLite data
    const db = await getDatabase();

    if (backup.kanjiProgress?.length > 0) {
      await db.execAsync('DELETE FROM kanji_progress');
      for (const kp of backup.kanjiProgress) {
        await db.runAsync(
          `INSERT INTO kanji_progress (kanji_id, recognition_level, reading_level, writing_level, next_recognition_review, next_reading_review, next_writing_review, times_correct, times_incorrect, date_unlocked, date_mastered)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          kp.kanji_id,
          kp.recognition_level,
          kp.reading_level,
          kp.writing_level,
          kp.next_recognition_review,
          kp.next_reading_review,
          kp.next_writing_review,
          kp.times_correct,
          kp.times_incorrect,
          kp.date_unlocked,
          kp.date_mastered
        );
      }
    }

    if (backup.vocabProgress?.length > 0) {
      await db.execAsync('DELETE FROM vocab_progress');
      for (const vp of backup.vocabProgress) {
        await db.runAsync(
          `INSERT INTO vocab_progress (vocab_id, level, next_review, times_correct, times_incorrect)
           VALUES (?, ?, ?, ?, ?)`,
          vp.vocab_id,
          vp.level,
          vp.next_review,
          vp.times_correct,
          vp.times_incorrect
        );
      }
    }

    if (backup.customLists?.length > 0) {
      await db.execAsync('DELETE FROM custom_lists');
      for (const cl of backup.customLists) {
        await db.runAsync(
          `INSERT INTO custom_lists (id, name, description, created_at, kanji_ids, vocab_ids)
           VALUES (?, ?, ?, ?, ?, ?)`,
          cl.id,
          cl.name,
          cl.description,
          cl.created_at,
          cl.kanji_ids,
          cl.vocab_ids
        );
      }
    }

    if (backup.activityLog?.length > 0) {
      await db.execAsync('DELETE FROM activity_log');
      for (const al of backup.activityLog) {
        await db.runAsync(
          `INSERT INTO activity_log (date, reviews_done, new_kanji_learned, xp_earned, study_time_minutes)
           VALUES (?, ?, ?, ?, ?)`,
          al.date,
          al.reviews_done,
          al.new_kanji_learned,
          al.xp_earned,
          al.study_time_minutes
        );
      }
    }

    return true;
  } catch (e) {
    console.error('Import failed:', e);
    return false;
  }
}
