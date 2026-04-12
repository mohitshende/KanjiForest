import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { useThemeColors } from '@/hooks/useTheme';
import { useReviewQueue } from '@/hooks/useReviewQueue';
import { getActivityLog } from '@/lib/database';

interface TodayActivity {
  reviews_done: number;
  new_kanji_learned: number;
  xp_earned: number;
}

interface Challenge {
  id: string;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  target: number;
  progress: number;
}

interface GameCard {
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  route: string;
}

export default function PracticeScreen() {
  const colors = useThemeColors();
  const router = useRouter();
  const { queue } = useReviewQueue();
  const [today, setToday] = useState<TodayActivity>({ reviews_done: 0, new_kanji_learned: 0, xp_earned: 0 });

  useEffect(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    getActivityLog(1).then((log: any[]) => {
      const entry = log.find((l) => l.date === todayStr);
      if (entry) setToday(entry);
    });
  }, []);

  const challenges: Challenge[] = [
    {
      id: 'reviews',
      title: 'Review 20 items',
      icon: 'refresh-circle-outline',
      color: colors.accentBlue,
      target: 20,
      progress: today.reviews_done,
    },
    {
      id: 'newkanji',
      title: 'Learn 3 new kanji',
      icon: 'sparkles-outline',
      color: colors.accentGreen,
      target: 3,
      progress: today.new_kanji_learned,
    },
    {
      id: 'xp',
      title: 'Earn 100 XP',
      icon: 'star-outline',
      color: colors.xpGold,
      target: 100,
      progress: today.xp_earned,
    },
  ];

  const games: GameCard[] = [
    {
      title: 'Recognition',
      description: 'Match kanji to meanings',
      icon: 'eye-outline',
      color: colors.accentBlue,
      route: '/games/recognition',
    },
    {
      title: 'Reading',
      description: 'Learn vocabulary & readings',
      icon: 'book-outline',
      color: colors.accentGreen,
      route: '/games/reading',
    },
    {
      title: 'Writing',
      description: 'Practice stroke order',
      icon: 'create-outline',
      color: colors.accentOrange,
      route: '/games/writing',
    },
    {
      title: 'Sentences',
      description: 'Read full sentences',
      icon: 'chatbubbles-outline',
      color: colors.accentPurple,
      route: '/games/sentences',
    },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.title, { color: colors.textPrimary }]}>Practice</Text>

        {/* Review summary */}
        {queue.length > 0 && (
          <Animated.View entering={FadeInUp.delay(100)}>
            <Pressable
              style={[
                styles.reviewCard,
                { backgroundColor: colors.accentBlue, borderColor: colors.accentBlue },
              ]}
              onPress={() => router.push('/games/recognition')}
            >
              <View>
                <Text style={styles.reviewTitle}>Reviews Due</Text>
                <Text style={styles.reviewCount}>{queue.length} items ready</Text>
              </View>
              <Ionicons name="arrow-forward-circle" size={32} color="#FFF" />
            </Pressable>
          </Animated.View>
        )}

        {/* Daily Challenges */}
        <Animated.View entering={FadeInUp.delay(150)}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary, marginTop: 24 }]}>
            DAILY CHALLENGES
          </Text>
          <View style={[styles.challengesCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {challenges.map((c, i) => {
              const pct = Math.min(1, c.progress / c.target);
              const done = pct >= 1;
              return (
                <View key={c.id} style={[styles.challengeRow, i < challenges.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }]}>
                  <View style={[styles.challengeIcon, { backgroundColor: c.color + '15' }]}>
                    <Ionicons name={done ? 'checkmark-circle' : c.icon} size={20} color={done ? colors.accentGreen : c.color} />
                  </View>
                  <View style={styles.challengeInfo}>
                    <View style={styles.challengeTitleRow}>
                      <Text style={[styles.challengeTitle, { color: done ? colors.textMuted : colors.textPrimary }]}>
                        {c.title}
                      </Text>
                      <Text style={[styles.challengeCount, { color: c.color }]}>
                        {Math.min(c.progress, c.target)}/{c.target}
                      </Text>
                    </View>
                    <View style={[styles.challengeTrack, { backgroundColor: colors.border }]}>
                      <View style={[styles.challengeFill, { backgroundColor: done ? colors.accentGreen : c.color, width: `${pct * 100}%` }]} />
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        </Animated.View>

        {/* Game cards */}
        <Text
          style={[
            styles.sectionTitle,
            { color: colors.textSecondary, marginTop: 24 },
          ]}
        >
          GAMES
        </Text>

        <View style={styles.gamesGrid}>
          {games.map((game, i) => (
            <Animated.View key={game.title} entering={FadeInUp.delay(200 + i * 100)}>
              <Pressable
                style={[
                  styles.gameCard,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                ]}
                onPress={() => router.push(game.route as any)}
              >
                <View
                  style={[
                    styles.iconCircle,
                    { backgroundColor: game.color + '15' },
                  ]}
                >
                  <Ionicons name={game.icon} size={28} color={game.color} />
                </View>
                <Text style={[styles.gameTitle, { color: colors.textPrimary }]}>
                  {game.title}
                </Text>
                <Text style={[styles.gameDesc, { color: colors.textSecondary }]}>
                  {game.description}
                </Text>
              </Pressable>
            </Animated.View>
          ))}
        </View>

        {/* Quick actions */}
        <Text
          style={[
            styles.sectionTitle,
            { color: colors.textSecondary, marginTop: 24 },
          ]}
        >
          STUDY TOOLS
        </Text>

        <Pressable
          style={[
            styles.toolRow,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
          onPress={() => router.push('/lists')}
        >
          <Ionicons name="list-outline" size={22} color={colors.accentBlue} />
          <View style={styles.toolInfo}>
            <Text style={[styles.toolTitle, { color: colors.textPrimary }]}>
              Custom Lists
            </Text>
            <Text style={[styles.toolDesc, { color: colors.textSecondary }]}>
              Study your own curated sets
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </Pressable>

        <Pressable
          style={[
            styles.toolRow,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
          onPress={() => router.push('/furigana' as any)}
        >
          <Ionicons name="text-outline" size={22} color={colors.accentPurple} />
          <View style={styles.toolInfo}>
            <Text style={[styles.toolTitle, { color: colors.textPrimary }]}>
              Furigana Reader
            </Text>
            <Text style={[styles.toolDesc, { color: colors.textSecondary }]}>
              Paste text to see kanji readings
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </Pressable>

        <Pressable
          style={[
            styles.toolRow,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
          onPress={() => router.push('/compare' as any)}
        >
          <Ionicons name="swap-horizontal-outline" size={22} color={colors.accentOrange} />
          <View style={styles.toolInfo}>
            <Text style={[styles.toolTitle, { color: colors.textPrimary }]}>
              Kanji Compare
            </Text>
            <Text style={[styles.toolDesc, { color: colors.textSecondary }]}>
              Compare two kanji side by side
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </Pressable>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 20 },
  title: { fontSize: 28, fontWeight: '700', marginBottom: 20 },

  reviewCard: {
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reviewTitle: { color: '#FFF', fontSize: 13, opacity: 0.9 },
  reviewCount: { color: '#FFF', fontSize: 22, fontWeight: '700', marginTop: 4 },

  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 12,
  },

  gamesGrid: { gap: 12 },
  gameCard: {
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gameTitle: { fontSize: 17, fontWeight: '600' },
  gameDesc: { fontSize: 13, marginTop: 2 },

  toolRow: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
  },
  toolInfo: { flex: 1 },
  toolTitle: { fontSize: 15, fontWeight: '600' },
  toolDesc: { fontSize: 12, marginTop: 2 },

  challengesCard: { borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  challengeRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  challengeIcon: { width: 38, height: 38, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  challengeInfo: { flex: 1 },
  challengeTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  challengeTitle: { fontSize: 14, fontWeight: '500' },
  challengeCount: { fontSize: 12, fontWeight: '600' },
  challengeTrack: { height: 4, borderRadius: 2, overflow: 'hidden' },
  challengeFill: { height: '100%', borderRadius: 2 },
});
