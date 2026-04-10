import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import * as Speech from 'expo-speech';
import { useThemeColors } from '@/hooks/useTheme';
import { useHaptics } from '@/hooks/useHaptics';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useStreakStore } from '@/stores/useStreakStore';
import { useProgressStore } from '@/stores/useProgressStore';
import { XP_PER_CORRECT } from '@/constants/SRS';

interface SentenceData {
  id: number;
  japanese: string;
  reading: string;
  english: string;
  vocab_ids: number[];
}

export default function SentencesGame() {
  const colors = useThemeColors();
  const router = useRouter();
  const haptics = useHaptics();
  const ttsEnabled = useSettingsStore((s) => s.ttsEnabled);
  const recordStudy = useStreakStore((s) => s.recordStudy);
  const addXP = useProgressStore((s) => s.addXP);

  const [sentences, setSentences] = useState<SentenceData[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showReading, setShowReading] = useState(false);
  const [showTranslation, setShowTranslation] = useState(false);
  const [difficulty, setDifficulty] = useState<'easy' | 'hard' | null>(null);
  const [sessionComplete, setSessionComplete] = useState(false);

  useEffect(() => {
    const data = require('@/assets/data/sentences.json') as SentenceData[];
    const shuffled = [...data].sort(() => Math.random() - 0.5).slice(0, 10);
    setSentences(shuffled);
  }, []);

  const current = sentences[currentIndex];

  const handleSpeak = () => {
    if (ttsEnabled && current) {
      Speech.speak(current.japanese, { language: 'ja', rate: 0.8 });
    }
  };

  const handleRate = (rating: 'easy' | 'hard') => {
    setDifficulty(rating);
    haptics.light();
    recordStudy();
    addXP(rating === 'easy' ? XP_PER_CORRECT : Math.floor(XP_PER_CORRECT / 2));
  };

  const handleNext = () => {
    const nextIndex = currentIndex + 1;
    if (nextIndex >= sentences.length) {
      setSessionComplete(true);
      return;
    }
    setCurrentIndex(nextIndex);
    setShowReading(false);
    setShowTranslation(false);
    setDifficulty(null);
  };

  if (sentences.length === 0) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.centered}>
          <Text style={{ color: colors.textSecondary }}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (sessionComplete) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.centered}>
          <Ionicons name="checkmark-circle" size={64} color={colors.accentGreen} />
          <Text style={[styles.completeTitle, { color: colors.textPrimary }]}>
            Reading Complete!
          </Text>
          <Text style={[styles.completeSub, { color: colors.textSecondary }]}>
            {sentences.length} sentences reviewed
          </Text>
          <Pressable
            style={[styles.doneBtn, { backgroundColor: colors.accentBlue }]}
            onPress={() => router.back()}
          >
            <Text style={styles.doneBtnText}>Done</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.closeBtn}>
          <Ionicons name="close" size={24} color={colors.textSecondary} />
        </Pressable>
        <Text style={[styles.progressText, { color: colors.textSecondary }]}>
          {currentIndex + 1}/{sentences.length}
        </Text>
        <View style={{ width: 44 }} />
      </View>

      {/* Progress bar */}
      <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
        <View
          style={[
            styles.progressFill,
            {
              backgroundColor: colors.accentPurple,
              width: `${((currentIndex + 1) / sentences.length) * 100}%`,
            },
          ]}
        />
      </View>

      <View style={styles.content}>
        {/* Sentence Card */}
        <Animated.View entering={FadeInUp}>
          <View
            style={[
              styles.sentenceCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <Text
              style={[
                styles.japaneseText,
                { color: colors.textPrimary, fontFamily: 'NotoSansJP-Regular' },
              ]}
            >
              {current.japanese}
            </Text>

            {showReading && (
              <Animated.Text
                entering={FadeIn}
                style={[
                  styles.readingText,
                  { color: colors.accentBlue, fontFamily: 'NotoSansJP-Regular' },
                ]}
              >
                {current.reading}
              </Animated.Text>
            )}

            {showTranslation && (
              <Animated.Text
                entering={FadeIn}
                style={[styles.translationText, { color: colors.textSecondary }]}
              >
                {current.english}
              </Animated.Text>
            )}
          </View>
        </Animated.View>

        {/* Controls */}
        <View style={styles.controlsRow}>
          <Pressable
            style={[styles.controlBtn, { borderColor: colors.border }]}
            onPress={handleSpeak}
          >
            <Ionicons name="volume-high" size={22} color={colors.accentBlue} />
          </Pressable>
          <Pressable
            style={[
              styles.controlBtn,
              {
                borderColor: showReading ? colors.accentBlue : colors.border,
                backgroundColor: showReading ? colors.accentBlue + '10' : 'transparent',
              },
            ]}
            onPress={() => setShowReading(!showReading)}
          >
            <Text
              style={[
                styles.controlLabel,
                { color: showReading ? colors.accentBlue : colors.textSecondary },
              ]}
            >
              Reading
            </Text>
          </Pressable>
          <Pressable
            style={[
              styles.controlBtn,
              {
                borderColor: showTranslation ? colors.accentGreen : colors.border,
                backgroundColor: showTranslation ? colors.accentGreen + '10' : 'transparent',
              },
            ]}
            onPress={() => setShowTranslation(!showTranslation)}
          >
            <Text
              style={[
                styles.controlLabel,
                {
                  color: showTranslation ? colors.accentGreen : colors.textSecondary,
                },
              ]}
            >
              Translation
            </Text>
          </Pressable>
        </View>

        {/* Rating */}
        {!difficulty ? (
          <View style={styles.ratingRow}>
            <Pressable
              style={[styles.ratingBtn, { backgroundColor: colors.accentGreen + '15', borderColor: colors.accentGreen }]}
              onPress={() => handleRate('easy')}
            >
              <Text style={[styles.ratingText, { color: colors.accentGreen }]}>Easy</Text>
            </Pressable>
            <Pressable
              style={[styles.ratingBtn, { backgroundColor: colors.accentRed + '15', borderColor: colors.accentRed }]}
              onPress={() => handleRate('hard')}
            >
              <Text style={[styles.ratingText, { color: colors.accentRed }]}>Hard</Text>
            </Pressable>
          </View>
        ) : (
          <Pressable
            style={[styles.nextBtn, { backgroundColor: colors.accentBlue }]}
            onPress={handleNext}
          >
            <Text style={styles.nextBtnText}>Next</Text>
            <Ionicons name="arrow-forward" size={18} color="#FFF" />
          </Pressable>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, gap: 16 },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  closeBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  progressText: { fontSize: 15, fontWeight: '600' },

  progressBar: { height: 3, marginHorizontal: 16 },
  progressFill: { height: '100%', borderRadius: 2 },

  content: { flex: 1, paddingHorizontal: 20, paddingTop: 32, gap: 24 },

  sentenceCard: {
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    gap: 16,
  },
  japaneseText: { fontSize: 24, lineHeight: 36 },
  readingText: { fontSize: 15, lineHeight: 22 },
  translationText: { fontSize: 15, lineHeight: 22 },

  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
  },
  controlBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  controlLabel: { fontSize: 14, fontWeight: '500' },

  ratingRow: {
    flexDirection: 'row',
    gap: 12,
  },
  ratingBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ratingText: { fontSize: 16, fontWeight: '600' },

  nextBtn: {
    height: 48,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  nextBtnText: { color: '#FFF', fontSize: 16, fontWeight: '600' },

  completeTitle: { fontSize: 28, fontWeight: '700' },
  completeSub: { fontSize: 17 },
  doneBtn: {
    height: 52,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 48,
    marginTop: 16,
  },
  doneBtnText: { color: '#FFF', fontSize: 17, fontWeight: '600' },
});
