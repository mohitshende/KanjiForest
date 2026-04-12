import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  ScrollView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  FadeIn,
  FadeInUp,
  SlideInDown,
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
import { checkAchievements } from '@/lib/checkAchievements';

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
  const [wrongItems, setWrongItems] = useState<VocabItem[]>([]);

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
      setWrongItems((prev) =>
        prev.find((v) => v.id === currentVocab.id) ? prev : [...prev, currentVocab]
      );
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
      checkAchievements({ sessionCorrect: totalCorrect, sessionTotal: totalAnswered + 1 });
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
    const xpEarned = totalCorrect * XP_PER_CORRECT;
    const isPerfect = wrongItems.length === 0;
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <ScrollView contentContainerStyle={styles.summaryContent} showsVerticalScrollIndicator={false}>
          <Animated.View entering={FadeIn} style={styles.summaryHero}>
            <Ionicons name={isPerfect ? 'trophy' : 'checkmark-circle'} size={72}
              color={isPerfect ? colors.xpGold : colors.accentGreen} />
            <Text style={[styles.completeTitle, { color: colors.textPrimary }]}>
              {isPerfect ? 'Perfect Session!' : 'Session Complete!'}
            </Text>
          </Animated.View>

          <View style={styles.summaryStatsRow}>
            <View style={[styles.summaryStat, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.summaryStatValue, { color: colors.accentGreen }]}>{totalCorrect}</Text>
              <Text style={[styles.summaryStatLabel, { color: colors.textMuted }]}>Correct</Text>
            </View>
            <View style={[styles.summaryStat, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.summaryStatValue, { color: colors.accentRed }]}>{totalAnswered - totalCorrect}</Text>
              <Text style={[styles.summaryStatLabel, { color: colors.textMuted }]}>Wrong</Text>
            </View>
            <View style={[styles.summaryStat, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.summaryStatValue, { color: colors.accentBlue }]}>{accuracy}%</Text>
              <Text style={[styles.summaryStatLabel, { color: colors.textMuted }]}>Accuracy</Text>
            </View>
            <View style={[styles.summaryStat, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.summaryStatValue, { color: colors.xpGold }]}>+{xpEarned}</Text>
              <Text style={[styles.summaryStatLabel, { color: colors.textMuted }]}>XP</Text>
            </View>
          </View>

          {wrongItems.length > 0 && (
            <>
              <Text style={[styles.weakTitle, { color: colors.textSecondary }]}>REVIEW THESE</Text>
              <View style={[styles.weakCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                {wrongItems.map((v, i) => (
                  <View key={v.id} style={[
                    styles.weakItem,
                    i < wrongItems.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border },
                  ]}>
                    <View style={styles.weakVocabLeft}>
                      <Text style={[styles.weakWord, { color: colors.textPrimary }]}>{v.word}</Text>
                      <Text style={[styles.weakReading, { color: colors.accentBlue }]}>{v.reading}</Text>
                    </View>
                    <Text style={[styles.weakMeaning, { color: colors.textSecondary }]} numberOfLines={2}>{v.meaning}</Text>
                  </View>
                ))}
              </View>
            </>
          )}

          <Pressable style={[styles.primaryBtn, { backgroundColor: colors.accentBlue }]} onPress={() => router.back()}>
            <Text style={styles.primaryBtnText}>Done</Text>
          </Pressable>
          <View style={{ height: 40 }} />
        </ScrollView>
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

      <ScrollView style={styles.gameArea} contentContainerStyle={{ paddingBottom: showAnswer ? 220 : 20 }} showsVerticalScrollIndicator={false}>
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

        <View style={{ height: 40 }} />
      </ScrollView>

      {showAnswer && (
        <Animated.View
          entering={SlideInDown.duration(250)}
          style={[
            styles.answerPanel,
            { backgroundColor: colors.surface, borderTopColor: colors.border },
          ]}
        >
          <Text
            style={[
              styles.resultText,
              { color: isCorrect ? colors.accentGreen : colors.accentRed },
            ]}
          >
            {isCorrect ? '✓ Correct!' : '✗ Incorrect'}
          </Text>
          {!isCorrect && (
            <Text style={[styles.correctAnswerText, { color: colors.textSecondary }]}>
              Correct answer: <Text style={{ color: colors.textPrimary, fontWeight: '600' }}>{correctAnswer}</Text>
            </Text>
          )}
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
            <Text style={styles.nextBtnText}>Continue</Text>
            <Ionicons name="arrow-forward" size={18} color="#FFF" />
          </Pressable>
        </Animated.View>
      )}
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

  answerPanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: Platform.OS === 'ios' ? 28 : 20,
    gap: 10,
  },
  resultText: { fontSize: 17, fontWeight: '700' },
  correctAnswerText: { fontSize: 13 },
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

  summaryContent: { padding: 24, paddingTop: 40 },
  summaryHero: { alignItems: 'center', gap: 12, marginBottom: 24 },
  summaryStatsRow: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  summaryStat: { flex: 1, borderRadius: 14, borderWidth: 1, padding: 12, alignItems: 'center', gap: 4 },
  summaryStatValue: { fontSize: 22, fontWeight: '700' },
  summaryStatLabel: { fontSize: 11, fontWeight: '600' },
  weakTitle: { fontSize: 12, fontWeight: '700', letterSpacing: 1, marginBottom: 10 },
  weakCard: { borderRadius: 16, borderWidth: 1, overflow: 'hidden', marginBottom: 20 },
  weakItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, gap: 14 },
  weakVocabLeft: { width: 80, gap: 2 },
  weakWord: { fontSize: 20, fontFamily: 'NotoSansJP-Bold' },
  weakReading: { fontSize: 12, fontFamily: 'NotoSansJP-Regular' },
  weakMeaning: { flex: 1, fontSize: 14 },
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
