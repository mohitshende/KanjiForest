import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { useThemeColors } from '@/hooks/useTheme';
import { useProgressStore } from '@/stores/useProgressStore';
import { useStreakStore } from '@/stores/useStreakStore';
import { getActivityLog } from '@/lib/database';
import { SRS_STAGE_COLORS } from '@/constants/SRS';

interface ActivityEntry {
  date: string;
  reviews_done: number;
  new_kanji_learned: number;
  xp_earned: number;
  study_time_minutes: number;
}

export default function ProgressScreen() {
  const colors = useThemeColors();
  const {
    totalXP,
    level,
    kanjiLearnedCount,
    kanjiMasteredCount,
    vocabLearnedCount,
    totalReviews,
    totalCorrect,
  } = useProgressStore();
  const { currentStreak, longestStreak } = useStreakStore();
  const [activityLog, setActivityLog] = useState<ActivityEntry[]>([]);

  useEffect(() => {
    getActivityLog(365).then((data) => setActivityLog(data as ActivityEntry[]));
  }, []);

  const accuracy =
    totalReviews > 0 ? Math.round((totalCorrect / totalReviews) * 100) : 0;

  // Generate heatmap data for last 90 days
  const heatmapData = useMemo(() => {
    const days: { date: string; intensity: number }[] = [];
    const actMap = new Map(activityLog.map((a) => [a.date, a.reviews_done]));
    const today = new Date();

    for (let i = 89; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const reviews = actMap.get(dateStr) || 0;
      const intensity = Math.min(4, Math.floor(reviews / 5));
      days.push({ date: dateStr, intensity });
    }
    return days;
  }, [activityLog]);

  const intensityColors = [
    colors.surfaceElevated,
    colors.accentGreen + '30',
    colors.accentGreen + '60',
    colors.accentGreen + '90',
    colors.accentGreen,
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Title */}
        <Text style={[styles.title, { color: colors.textPrimary }]}>Progress</Text>

        {/* Streak Card */}
        <Animated.View entering={FadeInUp.delay(100)}>
          <View
            style={[
              styles.streakCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <View style={styles.streakMain}>
              <Ionicons name="flame" size={40} color={colors.streakFlame} />
              <View>
                <Text style={[styles.streakNumber, { color: colors.streakFlame }]}>
                  {currentStreak}
                </Text>
                <Text style={[styles.streakLabel, { color: colors.textSecondary }]}>
                  Day Streak
                </Text>
              </View>
            </View>
            <Text style={[styles.longestStreak, { color: colors.textMuted }]}>
              Longest: {longestStreak} days
            </Text>
          </View>
        </Animated.View>

        {/* XP & Level */}
        <Animated.View entering={FadeInUp.delay(200)}>
          <View
            style={[
              styles.card,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <View style={styles.xpRow}>
              <Text style={[styles.levelBadge, { color: colors.xpGold }]}>
                Lv. {level}
              </Text>
              <Text style={[styles.xpText, { color: colors.textSecondary }]}>
                {totalXP} XP total
              </Text>
            </View>
            <View style={[styles.xpBar, { backgroundColor: colors.border }]}>
              <View
                style={[
                  styles.xpFill,
                  {
                    backgroundColor: colors.xpGold,
                    width: `${totalXP % 100}%`,
                  },
                ]}
              />
            </View>
          </View>
        </Animated.View>

        {/* Stats Grid */}
        <Animated.View entering={FadeInUp.delay(300)}>
          <View style={styles.statsGrid}>
            <View
              style={[
                styles.statCard,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <Text style={[styles.statValue, { color: colors.accentBlue }]}>
                {kanjiLearnedCount}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                Kanji Learned
              </Text>
            </View>
            <View
              style={[
                styles.statCard,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <Text style={[styles.statValue, { color: colors.accentGreen }]}>
                {kanjiMasteredCount}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                Mastered
              </Text>
            </View>
            <View
              style={[
                styles.statCard,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <Text style={[styles.statValue, { color: colors.accentOrange }]}>
                {vocabLearnedCount}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                Vocabulary
              </Text>
            </View>
            <View
              style={[
                styles.statCard,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <Text style={[styles.statValue, { color: colors.accentPurple }]}>
                {accuracy}%
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                Accuracy
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* Reviews stat */}
        <Animated.View entering={FadeInUp.delay(350)}>
          <View
            style={[
              styles.card,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
              Total Reviews
            </Text>
            <Text style={[styles.bigStat, { color: colors.accentBlue }]}>
              {totalReviews}
            </Text>
            <Text style={[styles.subStat, { color: colors.textSecondary }]}>
              {totalCorrect} correct / {totalReviews - totalCorrect} incorrect
            </Text>
          </View>
        </Animated.View>

        {/* Activity Heatmap */}
        <Animated.View entering={FadeInUp.delay(400)}>
          <View
            style={[
              styles.card,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
              Activity (90 days)
            </Text>
            <View style={styles.heatmapGrid}>
              {heatmapData.map((day, i) => (
                <View
                  key={i}
                  style={[
                    styles.heatmapSquare,
                    { backgroundColor: intensityColors[day.intensity] },
                  ]}
                />
              ))}
            </View>
            <View style={styles.heatmapLegend}>
              <Text style={[styles.legendText, { color: colors.textMuted }]}>
                Less
              </Text>
              {intensityColors.map((c, i) => (
                <View
                  key={i}
                  style={[styles.legendSquare, { backgroundColor: c }]}
                />
              ))}
              <Text style={[styles.legendText, { color: colors.textMuted }]}>
                More
              </Text>
            </View>
          </View>
        </Animated.View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 20 },
  title: { fontSize: 28, fontWeight: '700', marginBottom: 20 },

  streakCard: {
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    marginBottom: 16,
  },
  streakMain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 8,
  },
  streakNumber: { fontSize: 40, fontWeight: '700' },
  streakLabel: { fontSize: 15 },
  longestStreak: { fontSize: 13 },

  card: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  cardTitle: { fontSize: 15, fontWeight: '600', marginBottom: 12 },

  xpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  levelBadge: { fontSize: 20, fontWeight: '700' },
  xpText: { fontSize: 13 },
  xpBar: { height: 6, borderRadius: 3, overflow: 'hidden' },
  xpFill: { height: '100%', borderRadius: 3 },

  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  statCard: {
    width: '48%',
    flexGrow: 1,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    alignItems: 'center',
  },
  statValue: { fontSize: 28, fontWeight: '700' },
  statLabel: { fontSize: 12, marginTop: 4 },

  bigStat: { fontSize: 36, fontWeight: '700', textAlign: 'center' },
  subStat: { fontSize: 13, textAlign: 'center', marginTop: 4 },

  heatmapGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 3,
  },
  heatmapSquare: {
    width: 10,
    height: 10,
    borderRadius: 2,
  },
  heatmapLegend: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginTop: 12,
  },
  legendSquare: { width: 10, height: 10, borderRadius: 2 },
  legendText: { fontSize: 10 },
});
