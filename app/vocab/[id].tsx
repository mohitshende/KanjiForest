import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { useThemeColors } from '@/hooks/useTheme';
import { getVocabById, getSentenceById } from '@/lib/database';
import { useSettingsStore } from '@/stores/useSettingsStore';

interface VocabData {
  id: number;
  word: string;
  reading: string;
  meaning: string;
  part_of_speech: string;
  example_sentence_id: number | null;
  jlpt_level: number;
  frequency_rank: number;
}

interface SentenceData {
  japanese: string;
  reading: string;
  english: string;
}

export default function VocabDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useThemeColors();
  const router = useRouter();
  const ttsEnabled = useSettingsStore((s) => s.ttsEnabled);
  const [vocab, setVocab] = useState<VocabData | null>(null);
  const [sentence, setSentence] = useState<SentenceData | null>(null);

  useEffect(() => {
    if (!id) return;
    const vocabId = parseInt(id, 10);
    getVocabById(vocabId).then((v) => {
      const data = v as VocabData | null;
      setVocab(data);
      if (data?.example_sentence_id) {
        getSentenceById(data.example_sentence_id).then((s) =>
          setSentence(s as SentenceData | null)
        );
      }
    });
  }, [id]);

  const handleSpeak = () => {
    if (ttsEnabled && vocab) {
      Speech.speak(vocab.word, { language: 'ja' });
    }
  };

  if (!vocab) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.centered}>
          <Text style={{ color: colors.textSecondary }}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
          Vocabulary
        </Text>
        <Pressable onPress={handleSpeak} style={styles.backBtn}>
          <Ionicons name="volume-high-outline" size={22} color={colors.accentBlue} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Word */}
        <Animated.View entering={FadeInUp.delay(100)} style={styles.heroSection}>
          <Text
            style={[
              styles.heroWord,
              { color: colors.textPrimary, fontFamily: 'NotoSansJP-Bold' },
            ]}
          >
            {vocab.word}
          </Text>
          <Text
            style={[
              styles.reading,
              { color: colors.accentBlue, fontFamily: 'NotoSansJP-Regular' },
            ]}
          >
            {vocab.reading}
          </Text>
          <Text style={[styles.meaning, { color: colors.textSecondary }]}>
            {vocab.meaning}
          </Text>
        </Animated.View>

        {/* Badges */}
        <Animated.View entering={FadeInUp.delay(200)} style={styles.badgeRow}>
          <View style={[styles.badge, { backgroundColor: colors.accentPurple + '20' }]}>
            <Text style={[styles.badgeText, { color: colors.accentPurple }]}>
              {vocab.part_of_speech}
            </Text>
          </View>
          {vocab.jlpt_level > 0 && (
            <View style={[styles.badge, { backgroundColor: colors.accentBlue + '20' }]}>
              <Text style={[styles.badgeText, { color: colors.accentBlue }]}>
                N{vocab.jlpt_level}
              </Text>
            </View>
          )}
          {vocab.frequency_rank > 0 && (
            <View style={[styles.badge, { backgroundColor: colors.accentOrange + '20' }]}>
              <Text style={[styles.badgeText, { color: colors.accentOrange }]}>
                #{vocab.frequency_rank}
              </Text>
            </View>
          )}
        </Animated.View>

        {/* Example Sentence */}
        {sentence && (
          <Animated.View entering={FadeInUp.delay(300)}>
            <View
              style={[
                styles.card,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <Text style={[styles.cardLabel, { color: colors.textSecondary }]}>
                Example
              </Text>
              <Text
                style={[
                  styles.sentenceJp,
                  { color: colors.textPrimary, fontFamily: 'NotoSansJP-Regular' },
                ]}
              >
                {sentence.japanese}
              </Text>
              <Text
                style={[styles.sentenceReading, { color: colors.textMuted }]}
              >
                {sentence.reading}
              </Text>
              <Text style={[styles.sentenceEn, { color: colors.textSecondary }]}>
                {sentence.english}
              </Text>
            </View>
          </Animated.View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '600' },
  scrollContent: { paddingHorizontal: 20 },

  heroSection: { alignItems: 'center', paddingVertical: 32 },
  heroWord: { fontSize: 48, lineHeight: 56 },
  reading: { fontSize: 20, marginTop: 8 },
  meaning: { fontSize: 20, marginTop: 8 },

  badgeRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 24,
  },
  badge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999 },
  badgeText: { fontSize: 13, fontWeight: '600' },

  card: { borderRadius: 16, padding: 16, borderWidth: 1, marginBottom: 16 },
  cardLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  sentenceJp: { fontSize: 20, lineHeight: 30 },
  sentenceReading: { fontSize: 13, marginTop: 4 },
  sentenceEn: { fontSize: 15, marginTop: 8, lineHeight: 22 },
});
