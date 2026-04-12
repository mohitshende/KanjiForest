import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { useThemeColors } from '@/hooks/useTheme';
import { useKanjiProgress } from '@/hooks/useKanjiProgress';
import { useStreakStore } from '@/stores/useStreakStore';
import { useProgressStore } from '@/stores/useProgressStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import {
  getKanjiStatus,
  getAvailableKanji,
  getTreeOrder,
  KanjiStatus,
} from '@/lib/treeOrder';
import NotificationBell from '@/components/NotificationBell';
import NotificationDropdown from '@/components/NotificationDropdown';

const STATUS_COLORS: Record<KanjiStatus, string> = {
  locked: '#ABABAB',
  unlocked: '#3A7BD5',
  learning: '#F4A261',
  mastered: '#27AE60',
};

export default function JourneyScreen() {
  const colors = useThemeColors();
  const router = useRouter();
  const { kanjiData, unlockedIds, masteredIds, reviewsDue, isLoading } =
    useKanjiProgress();
  const streak = useStreakStore((s) => s.currentStreak);
  const level = useProgressStore((s) => s.level);
  const totalXP = useProgressStore((s) => s.totalXP);
  const dailyLimit = useSettingsStore((s) => s.dailyNewKanjiLimit);
  const [showNotifications, setShowNotifications] = useState(false);

  const treeOrder = useMemo(
    () => (kanjiData.length > 0 ? getTreeOrder(kanjiData) : []),
    [kanjiData]
  );

  const availableToLearn = useMemo(
    () => getAvailableKanji(kanjiData, unlockedIds, masteredIds, dailyLimit),
    [kanjiData, unlockedIds, masteredIds, dailyLimit]
  );

  const kanjiNodes = useMemo(() => {
    return treeOrder.map((id) => {
      const kanji = kanjiData.find((k) => k.id === id);
      const status = getKanjiStatus(id, unlockedIds, masteredIds, kanjiData);
      return { id, kanji, status };
    });
  }, [treeOrder, kanjiData, unlockedIds, masteredIds]);

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Loading...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View entering={FadeInUp.delay(100)} style={styles.header}>
          <View>
            <Text style={[styles.greeting, { color: colors.textSecondary }]}>
              Your Journey
            </Text>
            <Text style={[styles.title, { color: colors.textPrimary }]}>
              KanjiForest
            </Text>
          </View>
          <View style={styles.headerRight}>
            <NotificationBell onPress={() => setShowNotifications(true)} />
            <View style={styles.streakBadge}>
              <Ionicons name="flame" size={18} color={colors.streakFlame} />
              <Text style={[styles.streakText, { color: colors.streakFlame }]}>
                {streak}
              </Text>
            </View>
          </View>
        </Animated.View>

        <NotificationDropdown
          visible={showNotifications}
          onClose={() => setShowNotifications(false)}
        />

        {/* Today's Lesson Card */}
        <Animated.View entering={FadeInUp.delay(200)}>
          <View
            style={[
              styles.lessonCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
              Today's Lesson
            </Text>
            <View style={styles.lessonStats}>
              <View style={styles.lessonStat}>
                <Text style={[styles.statNumber, { color: colors.accentOrange }]}>
                  {reviewsDue.length}
                </Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                  Reviews Due
                </Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.lessonStat}>
                <Text style={[styles.statNumber, { color: colors.accentBlue }]}>
                  {availableToLearn.length}
                </Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                  New Available
                </Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.lessonStat}>
                <Text style={[styles.statNumber, { color: colors.accentGreen }]}>
                  {masteredIds.size}
                </Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                  Mastered
                </Text>
              </View>
            </View>
            {reviewsDue.length > 0 && (
              <Pressable
                style={[styles.startButton, { backgroundColor: colors.accentBlue }]}
                onPress={() => router.push('/games/recognition')}
              >
                <Text style={styles.startButtonText}>Start Reviews</Text>
                <Ionicons name="arrow-forward" size={18} color="#FFF" />
              </Pressable>
            )}
            {reviewsDue.length === 0 && availableToLearn.length > 0 && (
              <Pressable
                style={[styles.startButton, { backgroundColor: colors.accentGreen }]}
                onPress={() => {
                  if (availableToLearn[0]) {
                    router.push(`/kanji/${availableToLearn[0].id}`);
                  }
                }}
              >
                <Text style={styles.startButtonText}>Learn New Kanji</Text>
                <Ionicons name="arrow-forward" size={18} color="#FFF" />
              </Pressable>
            )}
          </View>
        </Animated.View>

        {/* XP Level Bar */}
        <Animated.View entering={FadeInUp.delay(300)}>
          <View
            style={[
              styles.xpCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <View style={styles.xpHeader}>
              <Text style={[styles.xpLevel, { color: colors.xpGold }]}>
                Lv. {level}
              </Text>
              <Text style={[styles.xpText, { color: colors.textSecondary }]}>
                {totalXP % 100} / 100 XP
              </Text>
            </View>
            <View style={[styles.xpBarBg, { backgroundColor: colors.border }]}>
              <View
                style={[
                  styles.xpBarFill,
                  {
                    backgroundColor: colors.xpGold,
                    width: `${(totalXP % 100)}%`,
                  },
                ]}
              />
            </View>
          </View>
        </Animated.View>

        {/* Tree Map */}
        <Animated.View entering={FadeInUp.delay(400)}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            Learning Tree
          </Text>
          <View style={styles.treeGrid}>
            {kanjiNodes.slice(0, 60).map(({ id, kanji, status }) => (
              <Pressable
                key={id}
                style={[
                  styles.treeNode,
                  {
                    backgroundColor:
                      status === 'locked'
                        ? colors.surfaceElevated
                        : STATUS_COLORS[status] + '20',
                    borderColor: STATUS_COLORS[status],
                  },
                ]}
                onPress={() => {
                  if (status !== 'locked') {
                    router.push(`/kanji/${id}`);
                  }
                }}
                disabled={status === 'locked'}
              >
                <Text
                  style={[
                    styles.nodeKanji,
                    {
                      color:
                        status === 'locked'
                          ? colors.textMuted
                          : STATUS_COLORS[status],
                    },
                  ]}
                >
                  {kanji?.character || '?'}
                </Text>
              </Pressable>
            ))}
          </View>
        </Animated.View>

        {/* Bottom spacing for tab bar */}
        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollView: { flex: 1 },
  scrollContent: { padding: 20 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { fontSize: 17 },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  greeting: { fontSize: 13 },
  title: { fontSize: 28, fontWeight: '700' },
  headerRight: { flexDirection: 'row', gap: 12 },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  streakText: { fontSize: 17, fontWeight: '700' },

  lessonCard: {
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    marginBottom: 16,
  },
  cardTitle: { fontSize: 20, fontWeight: '700', marginBottom: 16 },
  lessonStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  lessonStat: { alignItems: 'center' },
  statNumber: { fontSize: 28, fontWeight: '700' },
  statLabel: { fontSize: 12, marginTop: 2 },
  divider: { width: 1, backgroundColor: '#E8E6E0' },

  startButton: {
    height: 48,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  startButtonText: { color: '#FFF', fontSize: 16, fontWeight: '600' },

  xpCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    marginBottom: 24,
  },
  xpHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  xpLevel: { fontSize: 17, fontWeight: '700' },
  xpText: { fontSize: 13 },
  xpBarBg: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  xpBarFill: {
    height: '100%',
    borderRadius: 3,
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
  },

  treeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  treeNode: {
    width: 52,
    height: 52,
    borderRadius: 12,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nodeKanji: {
    fontSize: 24,
    fontFamily: 'NotoSansJP-Bold',
  },
});
