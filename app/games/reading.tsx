import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  FadeIn,
  FadeInUp,
  useAnimatedStyle,
  withSequence,
  withTiming,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import * as Speech from 'expo-speech';
import { useThemeColors } from '@/hooks/useTheme';
import { useHaptics } from '@/hooks/useHaptics';
import { generateOptions, partialMatch } from '@/lib/quiz';
import { useProgressStore } from '@/stores/useProgressStore';
import { useStreakStore } from '@/stores/useStreakStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { XP_PER_CORRECT } from '@/constants/SRS';

interface VocabItem {
  id: number;
  word: string;
  reading: string;
  meaning: string;
  part_of_speech: string;
}

type QuizMode = 'word_to_meaning' | 'word_to_reading' | 'reading_to_word';

export default function ReadingGame() {
  const colors = useThemeColors();
  const router = useRouter();
  const haptics = useHaptics();
  const addXP = useProgressStore((s) => s.addXP);
  const recordReview = useProgressStore((s) => s.recordReview);
  const recordStudy = useStreakStore((s) => s.recordStudy);
  const ttsEnabled = useSettingsStore((s) => s.ttsEnabled);

  const [allVocab, setAllVocab] = useState<VocabItem[]>([]);
  const [queue, setQueue] = useState<VocabItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [options, setOptions] = useState<string[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [streak, setStreak] = useState(0);
  const [totalCorrect, setTotalCorrect] = useState(0);
  const [totalAnswered, setTotalAnswered] = useState(0);
  const [mode, setMode] = useState<QuizMode>('word_to_meaning');
  const [showFurigana, setShowFurigana] = useState(false);
  const [useTypedInput, setUseTypedInput] = useState(false);
  const [typedAnswer, setTypedAnswer] = useState('');
  const [sessionComplete, setSessionComplete] = useState(false);

  const shakeX = useSharedValue(0);

  useEffect(() => {
    loadVocab();
  }, []);

  const loadVocab = async () => {
    const data = require('@/assets/data/vocabulary.json') as VocabItem[];
    setAllVocab(data);
    const shuffled = [...data].sort(() => Math.random() - 0.5).slice(0, 10);
    setQueue(shuffled);
    if (shuffled.length > 0) {
      setupQuestion(shuffled[0], data, 'word_to_meaning');
    }
  };

  const setupQuestion = (vocab: VocabItem, all: VocabItem[], quizMode: QuizMode) => {
    setSelected(null);
    setIsCorrect(null);
    setShowAnswer(false);
    setShowFurigana(false);
    setTypedAnswer('');

    if (quizMode === 'word_to_meaning') {
      const allMeanings = all.map((v) => v.meaning);
      setOptions(generateOptions(vocab.meaning, allMeanings, 4));
    } else if (quizMode === 'word_to_reading') {
      const allReadings = all.map((v) => v.reading);
      setOptions(generateOptions(vocab.reading, allReadings, 4));
    } else {
      const allWords = all.map((v) => v.word);
      setOptions(generateOptions(vocab.word, allWords, 4));
    }
    setMode(quizMode);
  };

  const currentVocab = queue[currentIndex];

  const getCorrectAnswer = (): string => {
    if (mode === 'word_to_meaning') return currentVocab.meaning;
    if (mode === 'word_to_reading') return currentVocab.reading;
    return currentVocab.word;
  };

  const handleAnswer = (answer: string) => {
    if (showAnswer) return;
    setSelected(answer);
    const correct = partialMatch(answer, getCorrectAnswer());
    setIsCorrect(correct);
    setShowAnswer(true);
    setTotalAnswered((p) => p + 1);

    if (correct) {
      haptics.success();
      setStreak((p) => p + 1);
      setTotalCorrect((p) => p + 1);
      recordReview(true);
      addXP(XP_PER_CORRECT);
      recordStudy();
    } else {
      haptics.error();
      setStreak(0);
      recordReview(false);
      shakeX.value = withSequence(
        withTiming(-10, { duration: 50 }),
        withTiming(10, { duration: 50 }),
        withTiming(-10, { duration: 50 }),
        withTiming(0, { duration: 50 })
      );
    }
  };

  const handleTypedSubmit = () => {
    if (!typedAnswer.trim()) return;
    handleAnswer(typedAnswer.trim());
  };

  const handleNext = () => {
    const nextIndex = currentIndex + 1;
    if (nextIndex >= queue.length) {
      setSessionComplete(true);
      return;
    }
    setCurrentIndex(nextIndex);
    const modes: QuizMode[] = ['word_to_meaning', 'word_to_reading', 'reading_to_word'];
    const nextMode = modes[nextIndex % 3];
    setupQuestion(queue[nextIndex], allVocab, nextMode);
  };

  const speakWord = () => {
    if (ttsEnabled && currentVocab) {
      Speech.speak(currentVocab.word, { language: 'ja' });
    }
  };

  const shakeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeX.value }],
  }));

  if (queue.length === 0) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.centered}>
          <Text style={{ color: colors.textSecondary }}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (sessionComplete) {
    const accuracy =
      totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : 0;
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.centered}>
          <Ionicons name="checkmark-circle" size={64} color={colors.accentGreen} />
          <Text style={[styles.completeTitle, { color: colors.textPrimary }]}>
            Session Complete!
          </Text>
          <Text style={[styles.completeStats, { color: colors.textSecondary }]}>
            {totalCorrect}/{totalAnswered} correct ({accuracy}%)
          </Text>
          <Pressable
            style={[styles.primaryBtn, { backgroundColor: colors.accentBlue }]}
            onPress={() => router.back()}
          >
            <Text style={styles.primaryBtnText}>Done</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const correctAnswer = getCorrectAnswer();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.closeBtn}>
          <Ionicons name="close" size={24} color={colors.textSecondary} />
        </Pressable>
        <Text style={[styles.progressText, { color: colors.textSecondary }]}>
          {currentIndex + 1}/{queue.length}
        </Text>
        <View style={styles.streakDisplay}>
          <Ionicons name="flame" size={18} color={colors.streakFlame} />
          <Text style={[styles.streakNum, { color: colors.streakFlame }]}>{streak}</Text>
        </View>
      </View>

      {/* Progress bar */}
      <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
        <View
          style={[
            styles.progressFill,
            {
              backgroundColor: colors.accentBlue,
              width: `${((currentIndex + 1) / queue.length) * 100}%`,
            },
          ]}
        />
      </View>

      <View style={styles.gameArea}>
        {/* Word Card */}
        <Animated.View style={shakeStyle}>
          <View
            style={[
              styles.wordCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            {mode === 'reading_to_word' ? (
              <Text
                style={[
                  styles.wordReading,
                  { color: colors.textPrimary, fontFamily: 'NotoSansJP-Regular' },
                ]}
              >
                {currentVocab.reading}
              </Text>
            ) : (
              <>
                <Text
                  style={[
                    styles.wordKanji,
                    { color: colors.textPrimary, fontFamily: 'NotoSansJP-Bold' },
                  ]}
                >
                  {currentVocab.word}
                </Text>
                {showFurigana && (
                  <Text
                    style={[
                      styles.furigana,
                      { color: colors.textSecondary, fontFamily: 'NotoSansJP-Regular' },
                    ]}
                  >
                    {currentVocab.reading}
                  </Text>
                )}
              </>
            )}

            <View style={styles.wordMeta}>
              <View style={[styles.posBadge, { backgroundColor: colors.accentPurple + '20' }]}>
                <Text style={[styles.posText, { color: colors.accentPurple }]}>
                  {currentVocab.part_of_speech}
                </Text>
              </View>
              <Pressable onPress={speakWord} style={styles.audioBtn}>
                <Ionicons name="volume-high-outline" size={22} color={colors.accentBlue} />
              </Pressable>
            </View>

            <Text style={[styles.cardPrompt, { color: colors.textSecondary }]}>
              {mode === 'word_to_meaning'
                ? 'Choose the meaning'
                : mode === 'word_to_reading'
                ? 'Choose the reading'
                : 'Which word matches?'}
            </Text>
          </View>
        </Animated.View>

        {/* Controls */}
        <View style={styles.controls}>
          {mode !== 'reading_to_word' && (
            <Pressable onPress={() => setShowFurigana((p) => !p)}>
              <Text style={[styles.toggleText, { color: colors.textMuted }]}>
                {showFurigana ? 'Hide' : 'Show'} Furigana
              </Text>
            </Pressable>
          )}
          <Pressable onPress={() => setUseTypedInput((p) => !p)}>
            <Text style={[styles.toggleText, { color: colors.textMuted }]}>
              {useTypedInput ? 'Multiple Choice' : 'Type Answer'}
            </Text>
          </Pressable>
        </View>

        {/* Options */}
        {useTypedInput ? (
          <View style={styles.typedArea}>
            <TextInput
              style={[
                styles.typeInput,
                {
                  color: colors.textPrimary,
                  borderColor: showAnswer
                    ? isCorrect
                      ? colors.accentGreen
                      : colors.accentRed
                    : colors.border,
                  backgroundColor: colors.surface,
                },
              ]}
              placeholder="Type your answer..."
              placeholderTextColor={colors.textMuted}
              value={typedAnswer}
              onChangeText={setTypedAnswer}
              onSubmitEditing={handleTypedSubmit}
              editable={!showAnswer}
              autoCapitalize="none"
            />
            {!showAnswer && (
              <Pressable
                style={[styles.submitBtn, { backgroundColor: colors.accentBlue }]}
                onPress={handleTypedSubmit}
              >
                <Text style={styles.submitBtnText}>Check</Text>
              </Pressable>
            )}
          </View>
        ) : (
          <View style={styles.optionsGrid}>
            {options.map((opt, i) => {
              const isSelected = selected === opt;
              const isCorrectOpt = opt === correctAnswer;

              let bgColor = colors.surface;
              let borderClr = colors.border;

              if (showAnswer) {
                if (isCorrectOpt) {
                  bgColor = colors.accentGreen + '20';
                  borderClr = colors.accentGreen;
                } else if (isSelected && !isCorrect) {
                  bgColor = colors.accentRed + '20';
                  borderClr = colors.accentRed;
                }
              }

              return (
                <Pressable
                  key={i}
                  style={[
                    styles.optionBtn,
                    { backgroundColor: bgColor, borderColor: borderClr },
                  ]}
                  onPress={() => handleAnswer(opt)}
                  disabled={showAnswer}
                >
                  <Text
                    style={[
                      styles.optionText,
                      {
                        color: showAnswer && isCorrectOpt
                          ? colors.accentGreen
                          : colors.textPrimary,
                        fontFamily:
                          mode === 'word_to_reading' || mode === 'reading_to_word'
                            ? 'NotoSansJP-Regular'
                            : undefined,
                      },
                    ]}
                  >
                    {opt}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        )}

        {showAnswer && (
          <Animated.View entering={FadeIn} style={styles.resultArea}>
            <Text
              style={[
                styles.resultText,
                { color: isCorrect ? colors.accentGreen : colors.accentRed },
              ]}
            >
              {isCorrect ? 'Correct!' : `Answer: ${correctAnswer}`}
            </Text>
            <View style={[styles.answerDetail, { backgroundColor: colors.surfaceElevated }]}>
              <Text style={[styles.answerWord, { color: colors.textPrimary, fontFamily: 'NotoSansJP-Bold' }]}>
                {currentVocab.word}
              </Text>
              <Text style={[styles.answerReading, { color: colors.accentBlue, fontFamily: 'NotoSansJP-Regular' }]}>
                {currentVocab.reading}
              </Text>
              <Text style={[styles.answerMeaning, { color: colors.textSecondary }]}>
                {currentVocab.meaning}
              </Text>
            </View>
            <Pressable
              style={[styles.nextBtn, { backgroundColor: colors.accentBlue }]}
              onPress={handleNext}
            >
              <Text style={styles.nextBtnText}>Next</Text>
              <Ionicons name="arrow-forward" size={18} color="#FFF" />
            </Pressable>
          </Animated.View>
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
  streakDisplay: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  streakNum: { fontSize: 17, fontWeight: '700' },

  progressBar: { height: 3, marginHorizontal: 16 },
  progressFill: { height: '100%', borderRadius: 2 },

  gameArea: { flex: 1, paddingHorizontal: 20, paddingTop: 20 },

  wordCard: {
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    alignItems: 'center',
    marginBottom: 12,
  },
  wordKanji: { fontSize: 48, lineHeight: 56 },
  wordReading: { fontSize: 32, lineHeight: 40 },
  furigana: { fontSize: 15, marginTop: 4 },
  wordMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 12,
  },
  posBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  posText: { fontSize: 12, fontWeight: '600' },
  audioBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  cardPrompt: { fontSize: 15, marginTop: 12 },

  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginBottom: 16,
  },
  toggleText: { fontSize: 12 },

  optionsGrid: { gap: 10 },
  optionBtn: {
    borderWidth: 1.5,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  optionText: { fontSize: 16, fontWeight: '500' },

  typedArea: { gap: 12 },
  typeInput: {
    borderWidth: 1.5,
    borderRadius: 12,
    height: 52,
    paddingHorizontal: 16,
    fontSize: 17,
  },
  submitBtn: {
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitBtnText: { color: '#FFF', fontSize: 16, fontWeight: '600' },

  resultArea: { marginTop: 16, alignItems: 'center', gap: 12 },
  resultText: { fontSize: 17, fontWeight: '700' },
  answerDetail: {
    width: '100%',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    gap: 4,
  },
  answerWord: { fontSize: 28 },
  answerReading: { fontSize: 15 },
  answerMeaning: { fontSize: 15 },
  nextBtn: {
    height: 48,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 32,
  },
  nextBtnText: { color: '#FFF', fontSize: 16, fontWeight: '600' },

  completeTitle: { fontSize: 28, fontWeight: '700' },
  completeStats: { fontSize: 17 },
  primaryBtn: {
    height: 52,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 48,
    marginTop: 16,
  },
  primaryBtnText: { color: '#FFF', fontSize: 17, fontWeight: '600' },
});
