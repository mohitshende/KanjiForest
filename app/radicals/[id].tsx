import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { useThemeColors } from '@/hooks/useTheme';
import { getAllRadicals, getKanjiByRadical } from '@/lib/database';

interface RadicalRow {
  id: number;
  character: string;
  meaning: string;
  stroke_count: number;
  reading: string;
}

interface KanjiRow {
  id: number;
  character: string;
  meaning: string;
  onyomi: string;
  kunyomi: string;
  jlpt_level: number;
  stroke_count: number;
}

const JLPT_COLORS: Record<number, string> = {
  5: '#4CAF50',
  4: '#2196F3',
  3: '#FF9800',
  2: '#E91E63',
  1: '#9C27B0',
};

export default function RadicalDetailScreen() {
  const colors = useThemeColors();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const radicalId = parseInt(id, 10);

  const [radical, setRadical] = useState<RadicalRow | null>(null);
  const [kanjiList, setKanjiList] = useState<KanjiRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const radicals = (await getAllRadicals()) as RadicalRow[];
        const found = radicals.find((r) => r.id === radicalId) || null;
        setRadical(found);

        const kanji = (await getKanjiByRadical(radicalId)) as KanjiRow[];
        setKanjiList(kanji);
      } catch {
        // handle gracefully
      } finally {
        setLoading(false);
      }
    })();
  }, [radicalId]);

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.accentGreen} />
        </View>
      </SafeAreaView>
    );
  }

  if (!radical) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.centered}>
          <Text style={{ color: colors.textSecondary }}>Radical not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.textSecondary} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Radical</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Radical hero */}
        <Animated.View
          entering={FadeInUp.duration(300)}
          style={[styles.heroCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
        >
          <Text style={[styles.heroChar, { color: colors.textPrimary }]}>
            {radical.character}
          </Text>

          <View style={[styles.badge, { backgroundColor: colors.accentGreen + '20' }]}>
            <Text style={[styles.badgeText, { color: colors.accentGreen }]}>
              Radical #{radical.id}
            </Text>
          </View>

          <Text style={[styles.heroMeaning, { color: colors.textPrimary }]}>
            {radical.meaning}
          </Text>

          <View style={styles.metaRow}>
            {radical.reading ? (
              <View style={[styles.metaChip, { backgroundColor: colors.accentBlue + '15' }]}>
                <Text style={[styles.metaLabel, { color: colors.textMuted }]}>Reading</Text>
                <Text style={[styles.metaValue, { color: colors.accentBlue, fontFamily: 'NotoSansJP-Regular' }]}>
                  {radical.reading}
                </Text>
              </View>
            ) : null}
            <View style={[styles.metaChip, { backgroundColor: colors.accentPurple + '15' }]}>
              <Text style={[styles.metaLabel, { color: colors.textMuted }]}>Strokes</Text>
              <Text style={[styles.metaValue, { color: colors.accentPurple }]}>
                {radical.stroke_count}
              </Text>
            </View>
            <View style={[styles.metaChip, { backgroundColor: colors.accentOrange + '15' }]}>
              <Text style={[styles.metaLabel, { color: colors.textMuted }]}>Kanji</Text>
              <Text style={[styles.metaValue, { color: colors.accentOrange }]}>
                {kanjiList.length}
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* Kanji using this radical */}
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
          KANJI WITH THIS RADICAL
        </Text>

        {kanjiList.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="search-outline" size={40} color={colors.textMuted} />
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>
              No kanji found for this radical
            </Text>
          </View>
        ) : (
          <View style={styles.kanjiGrid}>
            {kanjiList.map((kanji) => {
              const jlptColor = JLPT_COLORS[kanji.jlpt_level] || colors.textMuted;
              return (
                <Pressable
                  key={kanji.id}
                  style={[styles.kanjiCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                  onPress={() => router.push(`/kanji/${kanji.id}` as any)}
                >
                  {kanji.jlpt_level > 0 && (
                    <View style={[styles.jlptDot, { backgroundColor: jlptColor }]} />
                  )}
                  <Text style={[styles.kanjiChar, { color: colors.textPrimary }]}>
                    {kanji.character}
                  </Text>
                  <Text style={[styles.kanjiMeaning, { color: colors.textSecondary }]} numberOfLines={2}>
                    {kanji.meaning}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  backBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '600' },

  content: { paddingHorizontal: 20, paddingTop: 8 },

  heroCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 28,
    alignItems: 'center',
    marginBottom: 28,
    gap: 10,
  },
  heroChar: {
    fontSize: 96,
    fontFamily: 'NotoSansJP-Bold',
    lineHeight: 112,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
  },
  badgeText: { fontSize: 13, fontWeight: '600' },
  heroMeaning: { fontSize: 22, fontWeight: '700', textAlign: 'center' },

  metaRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
  metaChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    alignItems: 'center',
    gap: 2,
  },
  metaLabel: { fontSize: 10, fontWeight: '600', letterSpacing: 0.5 },
  metaValue: { fontSize: 16, fontWeight: '700' },

  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 14,
  },

  kanjiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  kanjiCard: {
    width: '30%',
    aspectRatio: 0.85,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    position: 'relative',
  },
  jlptDot: {
    position: 'absolute',
    top: 7,
    right: 7,
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  kanjiChar: {
    fontSize: 36,
    fontFamily: 'NotoSansJP-Bold',
    lineHeight: 44,
  },
  kanjiMeaning: {
    fontSize: 11,
    fontFamily: 'NotoSansJP-Regular',
    textAlign: 'center',
    marginTop: 3,
  },

  emptyState: { alignItems: 'center', paddingTop: 40, gap: 10 },
  emptyText: { fontSize: 14 },
});
