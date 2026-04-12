import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { useThemeColors } from '@/hooks/useTheme';
import { useProgressStore } from '@/stores/useProgressStore';
import { useStreakStore } from '@/stores/useStreakStore';
import { getActivityLog, getReviewForecast, getLeeches, getSRSBreakdown } from '@/lib/database';
import { SRS_STAGE_COLORS, LEECH_THRESHOLD } from '@/constants/SRS';
import { ACHIEVEMENTS, ACHIEVEMENT_MAP } from '@/constants/Achievements';

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
    achievements,
  } = useProgressStore();
  const { currentStreak, longestStreak, streakFreezes } = useStreakStore();
  const [activityLog, setActivityLog] = useState<ActivityEntry[]>([]);
  const [forecast, setForecast] = useState<{ date: string; count: number }[]>([]);
  const [leeches, setLeeches] = useState<any[]>([]);
  const [srsBreakdown, setSrsBreakdown] = useState({ apprentice: 0, guru: 0, master: 0, enlightened: 0, burned: 0 });

  useEffect(() => {
    getActivityLog(365).then((data) => setActivityLog(data as ActivityEntry[]));
    getReviewForecast(7).then(setForecast);
    getLeeches(LEECH_THRESHOLD).then((data) => setLeeches(data as any[]));
    getSRSBreakdown().then(setSrsBreakdown);
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

  // Last 7 days bar chart
  const weeklyData = useMemo(() => {
    const actMap = new Map(activityLog.map((a) => [a.date, a.reviews_done]));
    const days: { label: string; count: number }[] = [];
    const today = new Date();
    const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      days.push({ label: i === 0 ? 'Today' : dayLabels[d.getDay()], count: actMap.get(dateStr) || 0 });
    }
    return days;
  }, [activityLog]);

  const weeklyMax = useMemo(() => Math.max(...weeklyData.map((d) => d.count), 1), [weeklyData]);
  const forecastMax = useMemo(() => Math.max(...forecast.map((d) => d.count), 1), [forecast]);

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
            <View style={styles.streakFooter}>
              <Text style={[styles.longestStreak, { color: colors.textMuted }]}>
                Longest: {longestStreak} days
              </Text>
              <View style={styles.freezeRow}>
                <Ionicons name="shield-checkmark-outline" size={14} color={colors.accentBlue} />
                <Text style={[styles.freezeText, { color: colors.accentBlue }]}>
                  {streakFreezes} freeze{streakFreezes !== 1 ? 's' : ''}
                </Text>
              </View>
            </View>
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

        {/* SRS Stage Breakdown */}
        <Animated.View entering={FadeInUp.delay(340)}>
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>SRS Stages</Text>
            {([
              { label: 'Apprentice', value: srsBreakdown.apprentice, color: SRS_STAGE_COLORS.apprentice },
              { label: 'Guru', value: srsBreakdown.guru, color: SRS_STAGE_COLORS.guru },
              { label: 'Master', value: srsBreakdown.master, color: SRS_STAGE_COLORS.master },
              { label: 'Enlightened', value: srsBreakdown.enlightened, color: SRS_STAGE_COLORS.enlightened },
              { label: 'Burned', value: srsBreakdown.burned, color: SRS_STAGE_COLORS.burned },
            ] as { label: string; value: number; color: string }[]).map((s) => {
              const total = srsBreakdown.apprentice + srsBreakdown.guru + srsBreakdown.master + srsBreakdown.enlightened + srsBreakdown.burned;
              const pct = total > 0 ? (s.value / total) * 100 : 0;
              return (
                <View key={s.label} style={styles.srsRow}>
                  <Text style={[styles.srsLabel, { color: s.color }]}>{s.label}</Text>
                  <View style={[styles.srsTrack, { backgroundColor: colors.border }]}>
                    <View style={[styles.srsFill, { backgroundColor: s.color, width: `${pct}%` }]} />
                  </View>
                  <Text style={[styles.srsCount, { color: colors.textMuted }]}>{s.value}</Text>
                </View>
              );
            })}
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

        {/* Weekly Reviews Bar Chart */}
        <Animated.View entering={FadeInUp.delay(450)}>
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>This Week</Text>
            <View style={styles.barChart}>
              {weeklyData.map((day, i) => (
                <View key={i} style={styles.barColumn}>
                  <Text style={[styles.barValue, { color: colors.textMuted }]}>
                    {day.count > 0 ? day.count : ''}
                  </Text>
                  <View style={styles.barTrack}>
                    <View
                      style={[
                        styles.barFill,
                        {
                          backgroundColor: day.label === 'Today' ? colors.accentBlue : colors.accentBlue + '60',
                          height: `${(day.count / weeklyMax) * 100}%`,
                        },
                      ]}
                    />
                  </View>
                  <Text style={[styles.barLabel, { color: day.label === 'Today' ? colors.accentBlue : colors.textMuted }]}>
                    {day.label}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </Animated.View>

        {/* 7-Day Forecast */}
        <Animated.View entering={FadeInUp.delay(500)}>
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Upcoming Reviews</Text>
            <View style={styles.barChart}>
              {forecast.map((day, i) => {
                const d = new Date(day.date);
                const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                const label = i === 0 ? 'Today' : dayLabels[d.getDay()];
                return (
                  <View key={i} style={styles.barColumn}>
                    <Text style={[styles.barValue, { color: colors.textMuted }]}>
                      {day.count > 0 ? day.count : ''}
                    </Text>
                    <View style={styles.barTrack}>
                      <View
                        style={[
                          styles.barFill,
                          {
                            backgroundColor: i === 0 ? colors.accentOrange : colors.accentOrange + '60',
                            height: `${(day.count / forecastMax) * 100}%`,
                          },
                        ]}
                      />
                    </View>
                    <Text style={[styles.barLabel, { color: i === 0 ? colors.accentOrange : colors.textMuted }]}>
                      {label}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        </Animated.View>

        {/* Leeches */}
        {leeches.length > 0 && (
          <Animated.View entering={FadeInUp.delay(550)}>
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.leechHeader}>
                <Ionicons name="bug" size={18} color={colors.accentOrange} />
                <Text style={[styles.cardTitle, { color: colors.textPrimary, marginBottom: 0 }]}>
                  Leeches ({leeches.length})
                </Text>
              </View>
              <Text style={[styles.leechSubtitle, { color: colors.textMuted }]}>
                Items you've gotten wrong {LEECH_THRESHOLD}+ times
              </Text>
              <View style={styles.leechGrid}>
                {leeches.slice(0, 12).map((k) => (
                  <View key={k.id} style={[styles.leechCard, { backgroundColor: colors.surfaceElevated, borderColor: colors.accentOrange + '40' }]}>
                    <Text style={[styles.leechChar, { color: colors.textPrimary }]}>{k.character}</Text>
                    <Text style={[styles.leechMeaning, { color: colors.textSecondary }]} numberOfLines={1}>{k.meaning}</Text>
                  </View>
                ))}
              </View>
              {leeches.length > 12 && (
                <Text style={[styles.leechMore, { color: colors.textMuted }]}>
                  +{leeches.length - 12} more
                </Text>
              )}
            </View>
          </Animated.View>
        )}

        {/* Achievements */}
        <Animated.View entering={FadeInUp.delay(600)}>
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
              Achievements ({achievements.length}/{ACHIEVEMENTS.length})
            </Text>
            <View style={styles.achievementsGrid}>
              {ACHIEVEMENTS.map((a) => {
                const unlocked = achievements.includes(a.id);
                return (
                  <View
                    key={a.id}
                    style={[
                      styles.achievementCard,
                      {
                        backgroundColor: unlocked ? a.color + '15' : colors.surfaceElevated,
                        borderColor: unlocked ? a.color + '40' : colors.border,
                        opacity: unlocked ? 1 : 0.45,
                      },
                    ]}
                  >
                    <Ionicons
                      name={a.icon as any}
                      size={24}
                      color={unlocked ? a.color : colors.textMuted}
                    />
                    <Text style={[styles.achievementTitle, { color: unlocked ? colors.textPrimary : colors.textMuted }]} numberOfLines={2}>
                      {a.title}
                    </Text>
                  </View>
                );
              })}
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
  streakFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  longestStreak: { fontSize: 13 },
  freezeRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  freezeText: { fontSize: 12, fontWeight: '600' },

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

  barChart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 100,
    gap: 6,
    marginTop: 4,
  },
  barColumn: {
    flex: 1,
    alignItems: 'center',
    height: '100%',
    justifyContent: 'flex-end',
    gap: 4,
  },
  barValue: { fontSize: 9, fontWeight: '600', height: 12 },
  barTrack: {
    width: '100%',
    flex: 1,
    justifyContent: 'flex-end',
    borderRadius: 4,
    overflow: 'hidden',
  },
  barFill: { width: '100%', borderRadius: 4, minHeight: 2 },
  barLabel: { fontSize: 9, fontWeight: '600' },

  leechHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  leechSubtitle: { fontSize: 12, marginBottom: 12 },
  leechGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  leechCard: {
    width: '22%',
    flexGrow: 1,
    borderRadius: 10,
    padding: 8,
    alignItems: 'center',
    borderWidth: 1,
  },
  leechChar: { fontSize: 24, fontWeight: '700' },
  leechMeaning: { fontSize: 9, marginTop: 2, textAlign: 'center' },
  leechMore: { fontSize: 12, textAlign: 'center', marginTop: 8 },

  srsRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  srsLabel: { fontSize: 12, fontWeight: '600', width: 80 },
  srsTrack: { flex: 1, height: 6, borderRadius: 3, overflow: 'hidden' },
  srsFill: { height: '100%', borderRadius: 3 },
  srsCount: { fontSize: 12, width: 30, textAlign: 'right' },

  achievementsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  achievementCard: {
    width: '30%',
    flexGrow: 1,
    borderRadius: 12,
    padding: 10,
    alignItems: 'center',
    borderWidth: 1,
    gap: 6,
  },
  achievementTitle: { fontSize: 10, textAlign: 'center', fontWeight: '600' },
});
