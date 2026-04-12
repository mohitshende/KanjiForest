import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
  FlipInYRight,
} from 'react-native-reanimated';
import { useThemeColors } from '@/hooks/useTheme';
import { useHaptics } from '@/hooks/useHaptics';
import { getAllKanji, recordCorrect, recordIncorrect } from '@/lib/database';
import { generateOptions, partialMatch } from '@/lib/quiz';
import { useProgressStore } from '@/stores/useProgressStore';
import { useStreakStore } from '@/stores/useStreakStore';
import { XP_PER_CORRECT, XP_STREAK_BONUS } from '@/constants/SRS';

interface KanjiItem {
  id: number;
  character: string;
  meaning: string;
  onyomi: string;
  kunyomi: string;
  mnemonic: string;
}

type GameStage = 'meaning_from_kanji' | 'kanji_from_meaning';

export default function RecognitionGame() {
  const colors = useThemeColors();
  const router = useRouter();
  const haptics = useHaptics();
  const addXP = useProgressStore((s) => s.addXP);
  const recordReview = useProgressStore((s) => s.recordReview);
  const recordStudy = useStreakStore((s) => s.recordStudy);

  const [allKanji, setAllKanji] = useState<KanjiItem[]>([]);
  const [queue, setQueue] = useState<KanjiItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [options, setOptions] = useState<string[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [streak, setStreak] = useState(0);
  const [totalCorrect, setTotalCorrect] = useState(0);
  const [totalAnswered, setTotalAnswered] = useState(0);
  const [typedAnswer, setTypedAnswer] = useState('');
  const [useTypedInput, setUseTypedInput] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [stage, setStage] = useState<GameStage>('meaning_from_kanji');
  const [sessionComplete, setSessionComplete] = useState(false);

  const shakeX = useSharedValue(0);
  const cardScale = useSharedValue(1);

  useEffect(() => {
    loadKanji();
  }, []);

  const loadKanji = async () => {
    const data = (await getAllKanji()) as KanjiItem[];
    setAllKanji(data);
    const shuffled = data.sort(() => Math.random() - 0.5).slice(0, 10);
    setQueue(shuffled);
    if (shuffled.length > 0) {
      setupQuestion(shuffled[0], data, 'meaning_from_kanji');
    }
  };

  const setupQuestion = (
    kanji: KanjiItem,
    all: KanjiItem[],
    gameStage: GameStage
  ) => {
    setSelected(null);
    setIsCorrect(null);
    setShowAnswer(false);
    setShowHint(false);
    setTypedAnswer('');

    if (gameStage === 'meaning_from_kanji') {
      const allMeanings = all.map((k) => k.meaning);
      setOptions(generateOptions(kanji.meaning, allMeanings, 4));
    } else {
      const allChars = all.map((k) => k.character);
      setOptions(generateOptions(kanji.character, allChars, 4));
    }
    setStage(gameStage);
  };

  const currentKanji = queue[currentIndex];

  const handleAnswer = (answer: string) => {
    if (showAnswer) return;

    setSelected(answer);
    const correct =
      stage === 'meaning_from_kanji'
        ? partialMatch(answer, currentKanji.meaning)
        : answer === currentKanji.character;

    setIsCorrect(correct);
    setShowAnswer(true);
    setTotalAnswered((p) => p + 1);

    if (correct) {
      haptics.success();
      setStreak((p) => p + 1);
      setTotalCorrect((p) => p + 1);
      recordCorrect(currentKanji.id);
      recordReview(true);
      const xp = XP_PER_CORRECT + (streak > 0 ? XP_STREAK_BONUS : 0);
      addXP(xp);
      recordStudy();
      cardScale.value = withSequence(
        withSpring(1.05, { damping: 10 }),
        withSpring(1, { damping: 15 })
      );
    } else {
      haptics.error();
      setStreak(0);
      recordIncorrect(currentKanji.id);
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
    const nextStage: GameStage =
      nextIndex % 2 === 0 ? 'meaning_from_kanji' : 'kanji_from_meaning';
    setupQuestion(queue[nextIndex], allKanji, nextStage);
  };

  const shakeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeX.value }],
  }));

  const scaleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cardScale.value }],
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
          <Animated.View entering={FadeInUp}>
            <Ionicons
              name="checkmark-circle"
              size={64}
              color={colors.accentGreen}
            />
          </Animated.View>
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

  const correctAnswer =
    stage === 'meaning_from_kanji'
      ? currentKanji.meaning
      : currentKanji.character;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.closeBtn}>
          <Ionicons name="close" size={24} color={colors.textSecondary} />
        </Pressable>
        <View style={styles.progressInfo}>
          <Text style={[styles.progressText, { color: colors.textSecondary }]}>
            {currentIndex + 1}/{queue.length}
          </Text>
        </View>
        <View style={styles.streakDisplay}>
          <Ionicons name="flame" size={18} color={colors.streakFlame} />
          <Text style={[styles.streakNum, { color: colors.streakFlame }]}>
            {streak}
          </Text>
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

      {/* Card */}
      <ScrollView
        style={styles.gameArea}
        contentContainerStyle={{ paddingBottom: showAnswer ? 220 : 20 }}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={[styles.kanjiCard, scaleStyle, shakeStyle]}>
          <View
            style={[
              styles.cardInner,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            {stage === 'meaning_from_kanji' ? (
              <>
                <Text style={[styles.cardKanji, { color: colors.textPrimary }]}>
                  {currentKanji.character}
                </Text>
                <Text style={[styles.cardPrompt, { color: colors.textSecondary }]}>
                  What does this kanji mean?
                </Text>
              </>
            ) : (
              <>
                <Text style={[styles.cardMeaning, { color: colors.textPrimary }]}>
                  {currentKanji.meaning}
                </Text>
                <Text style={[styles.cardPrompt, { color: colors.textSecondary }]}>
                  Which kanji matches?
                </Text>
              </>
            )}

            {showHint && (
              <Animated.Text
                entering={FadeIn}
                style={[styles.hintText, { color: colors.accentPurple }]}
              >
                {currentKanji.mnemonic || `Readings: ${currentKanji.onyomi}`}
              </Animated.Text>
            )}
          </View>
        </Animated.View>

        {/* Hint button */}
        {!showAnswer && (
          <Pressable
            style={styles.hintBtn}
            onPress={() => setShowHint(true)}
          >
            <Ionicons name="bulb-outline" size={18} color={colors.accentOrange} />
            <Text style={[styles.hintBtnText, { color: colors.accentOrange }]}>
              Hint
            </Text>
          </Pressable>
        )}

        {/* Toggle typed input */}
        <Pressable
          style={styles.toggleBtn}
          onPress={() => setUseTypedInput((p) => !p)}
        >
          <Ionicons
            name={useTypedInput ? 'grid-outline' : 'create-outline'}
            size={16}
            color={colors.textMuted}
          />
          <Text style={[styles.toggleText, { color: colors.textMuted }]}>
            {useTypedInput ? 'Multiple Choice' : 'Type Answer'}
          </Text>
        </Pressable>

        {/* Answer Area */}
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
              placeholder={
                stage === 'meaning_from_kanji'
                  ? 'Type the meaning...'
                  : 'Type the kanji...'
              }
              placeholderTextColor={colors.textMuted}
              value={typedAnswer}
              onChangeText={setTypedAnswer}
              onSubmitEditing={handleTypedSubmit}
              editable={!showAnswer}
              autoCapitalize="none"
              returnKeyType="done"
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
                          stage === 'kanji_from_meaning'
                            ? 'NotoSansJP-Bold'
                            : undefined,
                        fontSize: stage === 'kanji_from_meaning' ? 28 : 15,
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

      {/* Fixed bottom answer panel */}
      {showAnswer && (
        <Animated.View
          entering={SlideInDown.duration(250)}
          style={[styles.answerPanel, { backgroundColor: colors.surface, borderTopColor: colors.border }]}
        >
          <Text
            style={[styles.resultText, { color: isCorrect ? colors.accentGreen : colors.accentRed }]}
          >
            {isCorrect ? '✓ Correct!' : '✗ Incorrect'}
          </Text>
          {!isCorrect && (
            <Text style={[styles.correctAnswerText, { color: colors.textSecondary }]}>
              Correct answer: <Text style={{ color: colors.textPrimary, fontWeight: '600' }}>{correctAnswer}</Text>
            </Text>
          )}
          <View style={styles.answerRow}>
            <Text style={[styles.answerKanji, { color: colors.textPrimary }]}>
              {currentKanji.character}
            </Text>
            <View style={styles.answerReadings}>
              <Text style={[styles.answerMeaning, { color: colors.textSecondary }]}>
                {currentKanji.meaning}
              </Text>
              <View style={styles.readingRow}>
                {currentKanji.onyomi ? (
                  <Text style={[styles.answerReading, { color: colors.accentRed }]}>
                    ON: {currentKanji.onyomi}
                  </Text>
                ) : null}
                {currentKanji.kunyomi ? (
                  <Text style={[styles.answerReading, { color: colors.accentBlue }]}>
                    KUN: {currentKanji.kunyomi}
                  </Text>
                ) : null}
              </View>
            </View>
          </View>
          <Pressable
            style={[styles.nextBtn, { backgroundColor: isCorrect ? colors.accentGreen : colors.accentBlue }]}
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
  progressInfo: { alignItems: 'center' },
  progressText: { fontSize: 15, fontWeight: '600' },
  streakDisplay: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  streakNum: { fontSize: 17, fontWeight: '700' },

  progressBar: { height: 3, marginHorizontal: 16 },
  progressFill: { height: '100%', borderRadius: 2 },

  gameArea: { flex: 1, paddingHorizontal: 20, paddingTop: 24 },

  kanjiCard: { alignItems: 'center', marginBottom: 16 },
  cardInner: {
    width: '100%',
    borderRadius: 16,
    padding: 32,
    borderWidth: 1,
    alignItems: 'center',
  },
  cardKanji: { fontSize: 96, fontFamily: 'NotoSansJP-Bold', lineHeight: 110 },
  cardMeaning: { fontSize: 28, fontWeight: '700', textAlign: 'center' },
  cardPrompt: { fontSize: 15, marginTop: 8 },
  hintText: { fontSize: 13, marginTop: 12, textAlign: 'center', lineHeight: 18 },

  hintBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginBottom: 8,
  },
  hintBtnText: { fontSize: 13, fontWeight: '500' },

  toggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
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
  optionText: { fontWeight: '500' },

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
  resultText: { fontSize: 16, fontWeight: '700' },
  correctAnswerText: { fontSize: 13 },
  answerRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  answerKanji: { fontSize: 36, fontFamily: 'NotoSansJP-Bold' },
  answerReadings: { flex: 1, gap: 2 },
  answerMeaning: { fontSize: 14, fontWeight: '500' },
  readingRow: { flexDirection: 'row', gap: 10 },
  answerReading: { fontSize: 12, fontWeight: '500' },
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
