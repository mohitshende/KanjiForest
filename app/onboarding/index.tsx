import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Dimensions,
  ScrollView,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  FadeIn,
  FadeInUp,
  useAnimatedStyle,
  withSpring,
  useSharedValue,
} from 'react-native-reanimated';
import Slider from '@react-native-community/slider';
import { useThemeColors } from '@/hooks/useTheme';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { unlockKanji } from '@/lib/database';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type LevelOption = 'beginner' | 'hiragana' | 'some_kanji' | 'intermediate' | 'advanced';
type GoalOption = 'casual' | 'jlpt' | 'manga' | 'travel' | 'work';

export default function OnboardingScreen() {
  const colors = useThemeColors();
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [selectedLevel, setSelectedLevel] = useState<LevelOption>('beginner');
  const [selectedGoal, setSelectedGoal] = useState<GoalOption>('casual');
  const [dailyGoal, setDailyGoal] = useState(5);
  const setOnboardingComplete = useSettingsStore((s) => s.setOnboardingComplete);
  const setDailyNewKanjiLimit = useSettingsStore((s) => s.setDailyNewKanjiLimit);
  const setReminderEnabled = useSettingsStore((s) => s.setReminderEnabled);

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const page = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    setCurrentPage(page);
  };

  const goToPage = (page: number) => {
    scrollRef.current?.scrollTo({ x: page * SCREEN_WIDTH, animated: true });
    setCurrentPage(page);
  };

  const handleComplete = async () => {
    setDailyNewKanjiLimit(dailyGoal);
    setOnboardingComplete(true);

    // Unlock first 5 kanji
    for (let i = 1; i <= 5; i++) {
      await unlockKanji(i);
    }

    router.replace('/(tabs)');
  };

  const levelOptions: { key: LevelOption; label: string; desc: string }[] = [
    { key: 'beginner', label: 'Complete Beginner', desc: "I'm just starting" },
    { key: 'hiragana', label: 'Know Hiragana', desc: 'I can read hiragana/katakana' },
    { key: 'some_kanji', label: 'Some Kanji', desc: 'I know 50-100 kanji' },
    { key: 'intermediate', label: 'Intermediate', desc: 'I know 300+ kanji' },
    { key: 'advanced', label: 'Advanced', desc: 'I know 1000+ kanji' },
  ];

  const goalOptions: { key: GoalOption; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
    { key: 'casual', label: 'Casual Learning', icon: 'cafe-outline' },
    { key: 'jlpt', label: 'JLPT Prep', icon: 'school-outline' },
    { key: 'manga', label: 'Manga & Anime', icon: 'book-outline' },
    { key: 'travel', label: 'Travel to Japan', icon: 'airplane-outline' },
    { key: 'work', label: 'Work / Business', icon: 'briefcase-outline' },
  ];

  const timeEstimate = Math.round(dailyGoal * 2);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        scrollEnabled={false}
      >
        {/* Page 1: Welcome */}
        <View style={[styles.page, { width: SCREEN_WIDTH }]}>
          <View style={styles.pageContent}>
            <Animated.Text
              entering={FadeInUp.delay(200)}
              style={[styles.heroKanji, { color: colors.textPrimary }]}
            >
              話
            </Animated.Text>
            <Animated.Text
              entering={FadeInUp.delay(400)}
              style={[styles.appName, { color: colors.textPrimary }]}
            >
              KanjiForest
            </Animated.Text>
            <Animated.Text
              entering={FadeInUp.delay(600)}
              style={[styles.tagline, { color: colors.textSecondary }]}
            >
              Learn kanji the smart way.
            </Animated.Text>
          </View>
          <Pressable
            style={[styles.primaryButton, { backgroundColor: colors.accentBlue }]}
            onPress={() => goToPage(1)}
          >
            <Text style={styles.primaryButtonText}>Get Started</Text>
          </Pressable>
        </View>

        {/* Page 2: Your Level */}
        <View style={[styles.page, { width: SCREEN_WIDTH }]}>
          <View style={styles.pageContent}>
            <Text style={[styles.pageTitle, { color: colors.textPrimary }]}>
              Where are you starting?
            </Text>
            <View style={styles.optionsContainer}>
              {levelOptions.map((opt) => (
                <Pressable
                  key={opt.key}
                  style={[
                    styles.optionCard,
                    {
                      backgroundColor:
                        selectedLevel === opt.key ? colors.accentBlue + '15' : colors.surface,
                      borderColor:
                        selectedLevel === opt.key ? colors.accentBlue : colors.border,
                    },
                  ]}
                  onPress={() => setSelectedLevel(opt.key)}
                >
                  <Text
                    style={[
                      styles.optionLabel,
                      {
                        color:
                          selectedLevel === opt.key
                            ? colors.accentBlue
                            : colors.textPrimary,
                      },
                    ]}
                  >
                    {opt.label}
                  </Text>
                  <Text style={[styles.optionDesc, { color: colors.textSecondary }]}>
                    {opt.desc}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
          <View style={styles.navRow}>
            <Pressable onPress={() => goToPage(0)} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color={colors.textSecondary} />
            </Pressable>
            <Pressable
              style={[styles.primaryButton, styles.navButton, { backgroundColor: colors.accentBlue }]}
              onPress={() => goToPage(2)}
            >
              <Text style={styles.primaryButtonText}>Continue</Text>
            </Pressable>
          </View>
        </View>

        {/* Page 3: Your Goal */}
        <View style={[styles.page, { width: SCREEN_WIDTH }]}>
          <View style={styles.pageContent}>
            <Text style={[styles.pageTitle, { color: colors.textPrimary }]}>
              Why are you learning?
            </Text>
            <View style={styles.optionsContainer}>
              {goalOptions.map((opt) => (
                <Pressable
                  key={opt.key}
                  style={[
                    styles.goalCard,
                    {
                      backgroundColor:
                        selectedGoal === opt.key ? colors.accentBlue + '15' : colors.surface,
                      borderColor:
                        selectedGoal === opt.key ? colors.accentBlue : colors.border,
                    },
                  ]}
                  onPress={() => setSelectedGoal(opt.key)}
                >
                  <Ionicons
                    name={opt.icon}
                    size={24}
                    color={
                      selectedGoal === opt.key ? colors.accentBlue : colors.textSecondary
                    }
                  />
                  <Text
                    style={[
                      styles.goalLabel,
                      {
                        color:
                          selectedGoal === opt.key
                            ? colors.accentBlue
                            : colors.textPrimary,
                      },
                    ]}
                  >
                    {opt.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
          <View style={styles.navRow}>
            <Pressable onPress={() => goToPage(1)} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color={colors.textSecondary} />
            </Pressable>
            <Pressable
              style={[styles.primaryButton, styles.navButton, { backgroundColor: colors.accentBlue }]}
              onPress={() => goToPage(3)}
            >
              <Text style={styles.primaryButtonText}>Continue</Text>
            </Pressable>
          </View>
        </View>

        {/* Page 4: Daily Goal */}
        <View style={[styles.page, { width: SCREEN_WIDTH }]}>
          <View style={styles.pageContent}>
            <Text style={[styles.pageTitle, { color: colors.textPrimary }]}>
              Daily Goal
            </Text>
            <Text style={[styles.goalNumber, { color: colors.accentBlue }]}>
              {dailyGoal}
            </Text>
            <Text style={[styles.goalSubtext, { color: colors.textSecondary }]}>
              new kanji per day
            </Text>
            <View style={styles.sliderContainer}>
              <Text style={[styles.sliderLabel, { color: colors.textMuted }]}>1</Text>
              <Slider
                style={styles.slider}
                minimumValue={1}
                maximumValue={20}
                step={1}
                value={dailyGoal}
                onValueChange={setDailyGoal}
                minimumTrackTintColor={colors.accentBlue}
                maximumTrackTintColor={colors.border}
                thumbTintColor={colors.accentBlue}
              />
              <Text style={[styles.sliderLabel, { color: colors.textMuted }]}>20</Text>
            </View>
            <Text style={[styles.timeEstimate, { color: colors.textSecondary }]}>
              ~{timeEstimate} min/day
            </Text>
          </View>
          <View style={styles.navRow}>
            <Pressable onPress={() => goToPage(2)} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color={colors.textSecondary} />
            </Pressable>
            <Pressable
              style={[styles.primaryButton, styles.navButton, { backgroundColor: colors.accentBlue }]}
              onPress={() => goToPage(4)}
            >
              <Text style={styles.primaryButtonText}>Continue</Text>
            </Pressable>
          </View>
        </View>

        {/* Page 5: Notifications */}
        <View style={[styles.page, { width: SCREEN_WIDTH }]}>
          <View style={styles.pageContent}>
            <Ionicons name="notifications-outline" size={64} color={colors.accentOrange} />
            <Text style={[styles.pageTitle, { color: colors.textPrimary, marginTop: 20 }]}>
              Daily Reminders
            </Text>
            <Text style={[styles.pageSubtitle, { color: colors.textSecondary }]}>
              Get a gentle reminder to practice every day
            </Text>
            <Pressable
              style={[styles.primaryButton, { backgroundColor: colors.accentBlue, marginTop: 32 }]}
              onPress={() => {
                setReminderEnabled(true);
                handleComplete();
              }}
            >
              <Text style={styles.primaryButtonText}>Enable Reminders</Text>
            </Pressable>
            <Pressable
              style={[styles.skipButton]}
              onPress={handleComplete}
            >
              <Text style={[styles.skipText, { color: colors.textSecondary }]}>
                Maybe Later
              </Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>

      {/* Page indicator dots */}
      <View style={styles.dots}>
        {[0, 1, 2, 3, 4].map((i) => (
          <View
            key={i}
            style={[
              styles.dot,
              {
                backgroundColor: currentPage === i ? colors.accentBlue : colors.border,
                width: currentPage === i ? 24 : 8,
              },
            ]}
          />
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  page: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingBottom: 80,
  },
  pageContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroKanji: {
    fontSize: 96,
    fontFamily: 'NotoSansJP-Bold',
    marginBottom: 16,
  },
  appName: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 8,
  },
  tagline: {
    fontSize: 17,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 24,
    textAlign: 'center',
  },
  pageSubtitle: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  optionsContainer: {
    width: '100%',
    gap: 12,
  },
  optionCard: {
    borderWidth: 1.5,
    borderRadius: 16,
    padding: 16,
  },
  optionLabel: {
    fontSize: 17,
    fontWeight: '600',
  },
  optionDesc: {
    fontSize: 13,
    marginTop: 2,
  },
  goalCard: {
    borderWidth: 1.5,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  goalLabel: {
    fontSize: 17,
    fontWeight: '500',
  },
  goalNumber: {
    fontSize: 64,
    fontWeight: '700',
  },
  goalSubtext: {
    fontSize: 17,
    marginBottom: 32,
  },
  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 8,
  },
  slider: {
    flex: 1,
    height: 40,
  },
  sliderLabel: {
    fontSize: 13,
    width: 24,
    textAlign: 'center',
  },
  timeEstimate: {
    fontSize: 15,
    marginTop: 8,
  },
  primaryButton: {
    height: 52,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backButton: {
    width: 52,
    height: 52,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navButton: {
    flex: 1,
  },
  skipButton: {
    marginTop: 16,
    padding: 12,
  },
  skipText: {
    fontSize: 15,
  },
  dots: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
});
