import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Dimensions,
  PanResponder,
  GestureResponderEvent,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeInUp, SlideInDown } from 'react-native-reanimated';
import Svg, { Path, Circle } from 'react-native-svg';
import { useThemeColors } from '@/hooks/useTheme';
import { useHaptics } from '@/hooks/useHaptics';
import { getAllKanji, recordCorrect } from '@/lib/database';
import { useProgressStore } from '@/stores/useProgressStore';
import { useStreakStore } from '@/stores/useStreakStore';
import { XP_PER_CORRECT } from '@/constants/SRS';
import { Point } from '@/lib/strokeRecognition';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CANVAS_SIZE = SCREEN_WIDTH - 64;

interface KanjiItem {
  id: number;
  character: string;
  meaning: string;
  stroke_count: number;
}

export default function WritingGame() {
  const colors = useThemeColors();
  const router = useRouter();
  const haptics = useHaptics();
  const addXP = useProgressStore((s) => s.addXP);
  const recordStudy = useStreakStore((s) => s.recordStudy);

  const [queue, setQueue] = useState<KanjiItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [strokes, setStrokes] = useState<string[]>([]);
  const [currentPath, setCurrentPath] = useState('');
  const [currentPoints, setCurrentPoints] = useState<Point[]>([]);
  const [currentStrokeNum, setCurrentStrokeNum] = useState(0);
  const [showGhost, setShowGhost] = useState(false);
  const [wrongAttempts, setWrongAttempts] = useState(0);
  const [stars, setStars] = useState(3);
  const [isComplete, setIsComplete] = useState(false);
  const [sessionComplete, setSessionComplete] = useState(false);
  const [totalStars, setTotalStars] = useState(0);

  useEffect(() => {
    loadKanji();
  }, []);

  const loadKanji = async () => {
    const data = (await getAllKanji()) as KanjiItem[];
    const shuffled = data.sort(() => Math.random() - 0.5).slice(0, 5);
    setQueue(shuffled);
  };

  const currentKanji = queue[currentIndex];

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt: GestureResponderEvent) => {
        const { locationX, locationY } = evt.nativeEvent;
        setCurrentPath(`M ${locationX} ${locationY}`);
        setCurrentPoints([{ x: locationX, y: locationY }]);
      },
      onPanResponderMove: (evt: GestureResponderEvent) => {
        const { locationX, locationY } = evt.nativeEvent;
        setCurrentPath((prev) => `${prev} L ${locationX} ${locationY}`);
        setCurrentPoints((prev) => [...prev, { x: locationX, y: locationY }]);
      },
      onPanResponderRelease: () => {
        if (currentPath) {
          handleStrokeComplete();
        }
      },
    })
  ).current;

  const handleStrokeComplete = () => {
    // Accept stroke and move to next
    setStrokes((prev) => [...prev, currentPath]);
    setCurrentStrokeNum((prev) => prev + 1);
    setCurrentPath('');
    setCurrentPoints([]);
    haptics.light();

    if (currentKanji && currentStrokeNum + 1 >= currentKanji.stroke_count) {
      // All strokes done
      haptics.success();
      setIsComplete(true);
      recordCorrect(currentKanji.id);
      addXP(XP_PER_CORRECT);
      recordStudy();
      setTotalStars((prev) => prev + stars);
    }
  };

  const handleUndo = () => {
    if (strokes.length > 0) {
      setStrokes((prev) => prev.slice(0, -1));
      setCurrentStrokeNum((prev) => Math.max(0, prev - 1));
      setIsComplete(false);
    }
  };

  const handleClear = () => {
    setStrokes([]);
    setCurrentPath('');
    setCurrentPoints([]);
    setCurrentStrokeNum(0);
    setIsComplete(false);
    setShowGhost(false);
    setWrongAttempts(0);
    setStars(3);
  };

  const handleNext = () => {
    const nextIndex = currentIndex + 1;
    if (nextIndex >= queue.length) {
      setSessionComplete(true);
      return;
    }
    setCurrentIndex(nextIndex);
    handleClear();
  };

  const handleShowGhost = () => {
    setShowGhost(true);
    setStars((prev) => Math.max(1, prev - 1));
  };

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
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.centered}>
          <Ionicons name="checkmark-circle" size={64} color={colors.accentGreen} />
          <Text style={[styles.completeTitle, { color: colors.textPrimary }]}>
            Writing Complete!
          </Text>
          <Text style={[styles.completeStats, { color: colors.textSecondary }]}>
            {totalStars} / {queue.length * 3} stars earned
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
        <View style={styles.starDisplay}>
          {[1, 2, 3].map((s) => (
            <Ionicons
              key={s}
              name={s <= stars ? 'star' : 'star-outline'}
              size={18}
              color={colors.xpGold}
            />
          ))}
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
        {/* Kanji info */}
        <View style={styles.kanjiInfo}>
          <Text style={[styles.targetMeaning, { color: colors.textPrimary }]}>
            {currentKanji.meaning}
          </Text>
          <Text style={[styles.strokeCounter, { color: colors.textSecondary }]}>
            Stroke {Math.min(currentStrokeNum + 1, currentKanji.stroke_count)} of{' '}
            {currentKanji.stroke_count}
          </Text>
        </View>

        {/* Canvas */}
        <View
          style={[
            styles.canvas,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
          {...panResponder.panHandlers}
        >
          {/* Ghost character */}
          {showGhost && (
            <Text style={[styles.ghostKanji, { color: colors.textMuted + '30' }]}>
              {currentKanji.character}
            </Text>
          )}

          {/* Grid lines */}
          <Svg
            width={CANVAS_SIZE}
            height={CANVAS_SIZE}
            style={StyleSheet.absoluteFill}
          >
            {/* Center cross guides */}
            <Path
              d={`M ${CANVAS_SIZE / 2} 0 L ${CANVAS_SIZE / 2} ${CANVAS_SIZE}`}
              stroke={colors.border}
              strokeWidth={0.5}
              strokeDasharray="5,5"
            />
            <Path
              d={`M 0 ${CANVAS_SIZE / 2} L ${CANVAS_SIZE} ${CANVAS_SIZE / 2}`}
              stroke={colors.border}
              strokeWidth={0.5}
              strokeDasharray="5,5"
            />

            {/* Completed strokes */}
            {strokes.map((path, i) => (
              <Path
                key={i}
                d={path}
                stroke={colors.accentGreen}
                strokeWidth={4}
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            ))}

            {/* Current stroke */}
            {currentPath ? (
              <Path
                d={currentPath}
                stroke={colors.textPrimary}
                strokeWidth={4}
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            ) : null}
          </Svg>
        </View>

        {/* Controls */}
        <View style={styles.controlRow}>
          <Pressable
            style={[styles.controlBtn, { borderColor: colors.border }]}
            onPress={handleUndo}
          >
            <Ionicons name="arrow-undo" size={20} color={colors.textSecondary} />
            <Text style={[styles.controlText, { color: colors.textSecondary }]}>
              Undo
            </Text>
          </Pressable>

          <Pressable
            style={[styles.controlBtn, { borderColor: colors.border }]}
            onPress={handleClear}
          >
            <Ionicons name="trash-outline" size={20} color={colors.textSecondary} />
            <Text style={[styles.controlText, { color: colors.textSecondary }]}>
              Clear
            </Text>
          </Pressable>

          <Pressable
            style={[styles.controlBtn, { borderColor: colors.border }]}
            onPress={handleShowGhost}
          >
            <Ionicons name="eye-outline" size={20} color={colors.accentOrange} />
            <Text style={[styles.controlText, { color: colors.accentOrange }]}>
              Hint
            </Text>
          </Pressable>
        </View>

      </View>

      {isComplete && (
        <Animated.View
          entering={SlideInDown.duration(250)}
          style={[
            styles.completePanel,
            { backgroundColor: colors.surface, borderTopColor: colors.border },
          ]}
        >
          <View style={styles.completeRow}>
            <Ionicons name="checkmark-circle" size={28} color={colors.accentGreen} />
            <Text style={[styles.completeText, { color: colors.accentGreen }]}>
              {currentKanji.character} Complete!
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
  starDisplay: { flexDirection: 'row', gap: 2 },

  progressBar: { height: 3, marginHorizontal: 16 },
  progressFill: { height: '100%', borderRadius: 2 },

  gameArea: { flex: 1, alignItems: 'center', paddingHorizontal: 20, paddingTop: 20 },

  kanjiInfo: { alignItems: 'center', marginBottom: 16 },
  targetMeaning: { fontSize: 24, fontWeight: '700' },
  strokeCounter: { fontSize: 15, marginTop: 4 },

  canvas: {
    width: CANVAS_SIZE,
    height: CANVAS_SIZE,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  ghostKanji: {
    position: 'absolute',
    fontSize: CANVAS_SIZE * 0.7,
    fontFamily: 'NotoSansJP-Bold',
    lineHeight: CANVAS_SIZE,
  },

  controlRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  controlBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  controlText: { fontSize: 14, fontWeight: '500' },

  completePanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: Platform.OS === 'ios' ? 28 : 20,
    gap: 14,
    alignItems: 'center',
  },
  completeRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  completeText: { fontSize: 20, fontWeight: '700', fontFamily: 'NotoSansJP-Bold' },

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
