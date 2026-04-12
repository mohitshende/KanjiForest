import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInUp } from 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useThemeColors } from '@/hooks/useTheme';
import {
  getKanjiById,
  getVocabularyForKanji,
  getKanjiProgress,
  unlockKanji,
  getAllCustomLists,
  updateCustomList,
  getCustomListById,
} from '@/lib/database';
import { SRS_LEVEL_NAMES } from '@/constants/SRS';

interface KanjiData {
  id: number;
  character: string;
  meaning: string;
  onyomi: string;
  kunyomi: string;
  stroke_count: number;
  jlpt_level: number;
  joyo_grade: number;
  radical_ids: string;
  component_kanji_ids: string;
  mnemonic: string;
  frequency_rank: number;
}

interface VocabData {
  id: number;
  word: string;
  reading: string;
  meaning: string;
  part_of_speech: string;
}

interface ProgressData {
  recognition_level: number;
  reading_level: number;
  writing_level: number;
  times_correct: number;
  times_incorrect: number;
  date_unlocked: number | null;
}

interface CustomList {
  id: number;
  name: string;
  kanji_ids: string;
  vocab_ids: string;
}

export default function KanjiDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useThemeColors();
  const router = useRouter();
  const [kanji, setKanji] = useState<KanjiData | null>(null);
  const [vocab, setVocab] = useState<VocabData[]>([]);
  const [progress, setProgress] = useState<ProgressData | null>(null);
  const [userNote, setUserNote] = useState('');
  const [lists, setLists] = useState<CustomList[]>([]);
  const [showListPicker, setShowListPicker] = useState(false);
  const saveNoteTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!id) return;
    const kanjiId = parseInt(id, 10);

    Promise.all([
      getKanjiById(kanjiId),
      getVocabularyForKanji(kanjiId),
      getKanjiProgress(kanjiId),
      AsyncStorage.getItem(`kanjiforest_note_${kanjiId}`),
      getAllCustomLists(),
    ]).then(([k, v, p, note, l]) => {
      setKanji(k as KanjiData | null);
      setVocab(v as VocabData[]);
      setProgress(p as ProgressData | null);
      if (note) setUserNote(note);
      setLists(l as CustomList[]);
    });
  }, [id]);

  const handleNoteChange = (text: string) => {
    setUserNote(text);
    if (saveNoteTimer.current) clearTimeout(saveNoteTimer.current);
    saveNoteTimer.current = setTimeout(() => {
      AsyncStorage.setItem(`kanjiforest_note_${id}`, text);
    }, 600);
  };

  const handleAddToList = async (listId: number) => {
    if (!id) return;
    const kanjiId = parseInt(id, 10);
    const list = await getCustomListById(listId) as CustomList | null;
    if (!list) return;
    const existingIds: number[] = JSON.parse(list.kanji_ids || '[]');
    if (!existingIds.includes(kanjiId)) {
      await updateCustomList(listId, [...existingIds, kanjiId], JSON.parse(list.vocab_ids || '[]'));
    }
    setShowListPicker(false);
  };

  const handleStartLearning = async () => {
    if (!id) return;
    await unlockKanji(parseInt(id, 10));
    router.push('/games/recognition');
  };

  if (!kanji) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <Text style={{ color: colors.textSecondary }}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const componentIds: number[] = Array.isArray(kanji.component_kanji_ids)
    ? kanji.component_kanji_ids
    : JSON.parse(kanji.component_kanji_ids || '[]');

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
          {kanji.character}
        </Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Kanji */}
        <Animated.View entering={FadeInUp.delay(100)} style={styles.heroSection}>
          <Text style={[styles.heroKanji, { color: colors.textPrimary }]}>
            {kanji.character}
          </Text>
          <Text style={[styles.meaningText, { color: colors.textSecondary }]}>
            {kanji.meaning}
          </Text>
        </Animated.View>

        {/* Badges */}
        <Animated.View entering={FadeInUp.delay(200)} style={styles.badgeRow}>
          <View style={[styles.badge, { backgroundColor: colors.accentBlue + '20' }]}>
            <Text style={[styles.badgeText, { color: colors.accentBlue }]}>
              N{kanji.jlpt_level}
            </Text>
          </View>
          <View style={[styles.badge, { backgroundColor: colors.accentGreen + '20' }]}>
            <Text style={[styles.badgeText, { color: colors.accentGreen }]}>
              Grade {kanji.joyo_grade}
            </Text>
          </View>
          <View style={[styles.badge, { backgroundColor: colors.accentPurple + '20' }]}>
            <Text style={[styles.badgeText, { color: colors.accentPurple }]}>
              {kanji.stroke_count} strokes
            </Text>
          </View>
          <View style={[styles.badge, { backgroundColor: colors.accentOrange + '20' }]}>
            <Text style={[styles.badgeText, { color: colors.accentOrange }]}>
              #{kanji.frequency_rank}
            </Text>
          </View>
        </Animated.View>

        {/* Readings */}
        <Animated.View entering={FadeInUp.delay(300)}>
          <View
            style={[
              styles.card,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <View style={styles.readingRow}>
              <Text style={[styles.readingLabel, { color: colors.accentRed }]}>ON:</Text>
              <Text
                style={[
                  styles.readingValue,
                  { color: colors.textPrimary, fontFamily: 'NotoSansJP-Bold' },
                ]}
              >
                {kanji.onyomi || '—'}
              </Text>
            </View>
            <View style={styles.readingRow}>
              <Text style={[styles.readingLabel, { color: colors.accentBlue }]}>
                KUN:
              </Text>
              <Text
                style={[
                  styles.readingValue,
                  { color: colors.textPrimary, fontFamily: 'NotoSansJP-Regular' },
                ]}
              >
                {kanji.kunyomi || '—'}
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* Mnemonic */}
        {kanji.mnemonic ? (
          <Animated.View entering={FadeInUp.delay(400)}>
            <View
              style={[
                styles.card,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <Text style={[styles.cardLabel, { color: colors.textSecondary }]}>
                Mnemonic Story
              </Text>
              <Text style={[styles.mnemonicText, { color: colors.textPrimary }]}>
                {kanji.mnemonic}
              </Text>
            </View>
          </Animated.View>
        ) : null}

        {/* Your Stats */}
        {progress && (
          <Animated.View entering={FadeInUp.delay(450)}>
            <View
              style={[
                styles.card,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <Text style={[styles.cardLabel, { color: colors.textSecondary }]}>
                Your Progress
              </Text>
              <View style={styles.statsGrid}>
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: colors.accentBlue }]}>
                    {SRS_LEVEL_NAMES[progress.recognition_level] || 'Unseen'}
                  </Text>
                  <Text style={[styles.statName, { color: colors.textMuted }]}>
                    Recognition
                  </Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: colors.accentOrange }]}>
                    {SRS_LEVEL_NAMES[progress.reading_level] || 'Unseen'}
                  </Text>
                  <Text style={[styles.statName, { color: colors.textMuted }]}>
                    Reading
                  </Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: colors.accentGreen }]}>
                    {SRS_LEVEL_NAMES[progress.writing_level] || 'Unseen'}
                  </Text>
                  <Text style={[styles.statName, { color: colors.textMuted }]}>
                    Writing
                  </Text>
                </View>
              </View>
              <Text style={[styles.accuracy, { color: colors.textSecondary }]}>
                {progress.times_correct + progress.times_incorrect > 0
                  ? `${Math.round(
                      (progress.times_correct /
                        (progress.times_correct + progress.times_incorrect)) *
                        100
                    )}% accuracy`
                  : 'No reviews yet'}
              </Text>
            </View>
          </Animated.View>
        )}

        {/* User Notes */}
        <Animated.View entering={FadeInUp.delay(500)}>
          <View
            style={[
              styles.card,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.cardLabel, { color: colors.textSecondary }]}>
              Your Notes
            </Text>
            <TextInput
              style={[
                styles.noteInput,
                {
                  color: colors.textPrimary,
                  borderColor: colors.border,
                },
              ]}
              placeholder="Add your own notes or mnemonic..."
              placeholderTextColor={colors.textMuted}
              multiline
              value={userNote}
              onChangeText={handleNoteChange}
            />
          </View>
        </Animated.View>

        {/* Vocabulary */}
        <Animated.View entering={FadeInUp.delay(600)}>
          <View
            style={[
              styles.card,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.cardLabel, { color: colors.textSecondary }]}>
              Vocabulary ({vocab.length} words)
            </Text>
            {vocab.slice(0, 10).map((v) => (
              <Pressable
                key={v.id}
                style={[styles.vocabRow, { borderBottomColor: colors.border }]}
                onPress={() => router.push(`/vocab/${v.id}`)}
              >
                <View>
                  <Text
                    style={[
                      styles.vocabWord,
                      { color: colors.textPrimary, fontFamily: 'NotoSansJP-Bold' },
                    ]}
                  >
                    {v.word}
                  </Text>
                  <Text
                    style={[
                      styles.vocabReading,
                      { color: colors.textSecondary, fontFamily: 'NotoSansJP-Regular' },
                    ]}
                  >
                    {v.reading}
                  </Text>
                </View>
                <Text style={[styles.vocabMeaning, { color: colors.textSecondary }]}>
                  {v.meaning}
                </Text>
              </Pressable>
            ))}
          </View>
        </Animated.View>

        {/* Add to List Button */}
        <Pressable
          style={[styles.addListButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={() => setShowListPicker(!showListPicker)}
        >
          <Ionicons name="bookmark-outline" size={18} color={colors.accentGreen} />
          <Text style={[styles.addListText, { color: colors.accentGreen }]}>Add to Custom List</Text>
          <Ionicons name={showListPicker ? 'chevron-up' : 'chevron-down'} size={16} color={colors.textMuted} />
        </Pressable>

        {showListPicker && (
          <Animated.View entering={FadeInUp.delay(0)}>
            <View style={[styles.listPickerCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              {lists.length === 0 ? (
                <Text style={[styles.listPickerEmpty, { color: colors.textMuted }]}>
                  No custom lists yet. Create one in Practice → Custom Lists.
                </Text>
              ) : (
                lists.map((list) => (
                  <Pressable
                    key={list.id}
                    style={[styles.listPickerRow, { borderBottomColor: colors.border }]}
                    onPress={() => handleAddToList(list.id)}
                  >
                    <Ionicons name="list-outline" size={16} color={colors.accentBlue} />
                    <Text style={[styles.listPickerName, { color: colors.textPrimary }]}>{list.name}</Text>
                    <Ionicons name="add-circle-outline" size={18} color={colors.accentGreen} />
                  </Pressable>
                ))
              )}
            </View>
          </Animated.View>
        )}

        {/* Start Learning Button */}
        {!progress?.date_unlocked && (
          <Pressable
            style={[styles.learnButton, { backgroundColor: colors.accentBlue }]}
            onPress={handleStartLearning}
          >
            <Ionicons name="play" size={20} color="#FFF" />
            <Text style={styles.learnButtonText}>Start Learning</Text>
          </Pressable>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'NotoSansJP-Bold',
  },

  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20 },

  heroSection: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  heroKanji: {
    fontSize: 96,
    fontFamily: 'NotoSansJP-Bold',
    lineHeight: 110,
  },
  meaningText: {
    fontSize: 20,
    marginTop: 8,
  },

  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 20,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  badgeText: {
    fontSize: 13,
    fontWeight: '600',
  },

  card: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  cardLabel: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },

  readingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  readingLabel: {
    fontSize: 13,
    fontWeight: '700',
    width: 40,
  },
  readingValue: {
    fontSize: 20,
  },

  mnemonicText: {
    fontSize: 15,
    lineHeight: 22,
  },

  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 8,
  },
  statItem: { alignItems: 'center' },
  statValue: { fontSize: 13, fontWeight: '600' },
  statName: { fontSize: 11, marginTop: 2 },
  accuracy: { fontSize: 13, textAlign: 'center' },

  noteInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    minHeight: 80,
    fontSize: 15,
    textAlignVertical: 'top',
  },

  vocabRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  vocabWord: { fontSize: 20 },
  vocabReading: { fontSize: 13 },
  vocabMeaning: { fontSize: 15, maxWidth: '50%', textAlign: 'right' },

  learnButton: {
    height: 52,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  learnButtonText: {
    color: '#FFF',
    fontSize: 17,
    fontWeight: '600',
  },

  addListButton: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 10,
  },
  addListText: { fontSize: 15, fontWeight: '600' },

  listPickerCard: {
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
    overflow: 'hidden',
  },
  listPickerEmpty: { padding: 16, fontSize: 13, textAlign: 'center' },
  listPickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    borderBottomWidth: 1,
  },
  listPickerName: { flex: 1, fontSize: 15 },
});
