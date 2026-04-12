import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  ScrollView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useThemeColors } from '@/hooks/useTheme';
import {
  searchKanji,
  searchVocabulary,
  getAllKanji,
  getAllVocabulary,
  getMasteredKanjiIds,
  getUnlockedKanjiIds,
} from '@/lib/database';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface KanjiRow {
  id: number;
  character: string;
  meaning: string;
  onyomi: string;
  kunyomi: string;
  stroke_count: number;
  jlpt_level: number;
  joyo_grade: number;
  frequency_rank: number;
}

interface VocabRow {
  id: number;
  word: string;
  reading: string;
  meaning: string;
  part_of_speech: string;
  jlpt_level: number;
  frequency_rank: number;
}

type BrowseMode = 'kanji' | 'vocabulary';
type JlptFilter = 'all' | 5 | 4 | 3 | 2 | 1 | 'grade';
type SortKey = 'frequency' | 'grade' | 'jlpt' | 'strokes';
type StatusFilter = 'all' | 'learned' | 'learning' | 'locked';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const JLPT_COLORS: Record<number, string> = {
  5: '#4CAF50',
  4: '#2196F3',
  3: '#FF9800',
  2: '#E91E63',
  1: '#9C27B0',
};

function jlptLabel(level: number | null | undefined): string {
  if (!level) return '';
  return `N${level}`;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function LibraryScreen() {
  const colors = useThemeColors();
  const router = useRouter();

  // --- state ---------------------------------------------------------------
  const [query, setQuery] = useState('');
  const [browseMode, setBrowseMode] = useState<BrowseMode>('kanji');
  const [jlptFilter, setJlptFilter] = useState<JlptFilter>('all');
  const [sortKey, setSortKey] = useState<SortKey>('frequency');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  const [kanjiResults, setKanjiResults] = useState<KanjiRow[]>([]);
  const [vocabResults, setVocabResults] = useState<VocabRow[]>([]);
  const [loading, setLoading] = useState(true);

  // Progress id sets for status filtering
  const [learnedIds, setLearnedIds] = useState<Set<number>>(new Set());
  const [learningIds, setLearningIds] = useState<Set<number>>(new Set());

  // --- data loading --------------------------------------------------------

  // Load progress data once
  useEffect(() => {
    (async () => {
      try {
        const mastered = await getMasteredKanjiIds();
        const unlocked = await getUnlockedKanjiIds();
        setLearnedIds(new Set(mastered));
        setLearningIds(new Set(unlocked.filter((id: number) => !mastered.includes(id))));
      } catch {
        // progress tables may be empty on first launch
      }
    })();
  }, []);

  // Fetch data whenever query or browse mode changes
  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    (async () => {
      try {
        if (browseMode === 'kanji') {
          const rows = query.trim()
            ? ((await searchKanji(query.trim())) as KanjiRow[])
            : ((await getAllKanji()) as KanjiRow[]);
          if (!cancelled) setKanjiResults(rows);
        } else {
          if (query.trim()) {
            const rows = (await searchVocabulary(query.trim())) as VocabRow[];
            if (!cancelled) setVocabResults(rows);
          } else {
            const rows = (await getAllVocabulary()) as VocabRow[];
            if (!cancelled) setVocabResults(rows.slice(0, 200));
          }
        }
      } catch {
        // handle gracefully
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [query, browseMode]);

  // --- filtering & sorting -------------------------------------------------

  const filteredKanji = useMemo(() => {
    let list = [...kanjiResults];

    // JLPT / Grade filter
    if (jlptFilter !== 'all' && jlptFilter !== 'grade') {
      list = list.filter((k) => k.jlpt_level === jlptFilter);
    }
    if (jlptFilter === 'grade') {
      list = list.filter((k) => k.joyo_grade != null && k.joyo_grade > 0);
    }

    // Status filter
    if (statusFilter === 'learned') {
      list = list.filter((k) => learnedIds.has(k.id));
    } else if (statusFilter === 'learning') {
      list = list.filter((k) => learningIds.has(k.id));
    } else if (statusFilter === 'locked') {
      list = list.filter(
        (k) => !learnedIds.has(k.id) && !learningIds.has(k.id)
      );
    }

    // Sort
    list.sort((a, b) => {
      switch (sortKey) {
        case 'frequency':
          return (a.frequency_rank || 9999) - (b.frequency_rank || 9999);
        case 'grade':
          return (a.joyo_grade || 99) - (b.joyo_grade || 99);
        case 'jlpt':
          return (b.jlpt_level || 0) - (a.jlpt_level || 0);
        case 'strokes':
          return (a.stroke_count || 0) - (b.stroke_count || 0);
        default:
          return 0;
      }
    });

    return list;
  }, [kanjiResults, jlptFilter, sortKey, statusFilter, learnedIds, learningIds]);

  const filteredVocab = useMemo(() => {
    let list = [...vocabResults];

    if (jlptFilter !== 'all' && jlptFilter !== 'grade') {
      list = list.filter((v) => v.jlpt_level === jlptFilter);
    }

    list.sort((a, b) => {
      if (sortKey === 'frequency')
        return (a.frequency_rank || 9999) - (b.frequency_rank || 9999);
      if (sortKey === 'jlpt')
        return (b.jlpt_level || 0) - (a.jlpt_level || 0);
      return 0;
    });

    return list;
  }, [vocabResults, jlptFilter, sortKey]);

  // --- navigation ----------------------------------------------------------

  const handleKanjiPress = useCallback(
    (id: number) => {
      router.push(`/kanji/${id}` as any);
    },
    [router]
  );

  const handleVocabPress = useCallback(
    (id: number) => {
      router.push(`/vocab/${id}` as any);
    },
    [router]
  );

  // --- render helpers ------------------------------------------------------

  const renderKanjiCard = useCallback(
    ({ item }: { item: KanjiRow }) => {
      const jlptColor = JLPT_COLORS[item.jlpt_level] || colors.textMuted;
      const isLearned = learnedIds.has(item.id);
      const isLearning = learningIds.has(item.id);

      return (
        <TouchableOpacity
          style={[styles.kanjiCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
          activeOpacity={0.7}
          onPress={() => handleKanjiPress(item.id)}
        >
          {/* JLPT badge */}
          {item.jlpt_level > 0 && (
            <View style={[styles.jlptBadge, { backgroundColor: jlptColor }]}>
              <Text style={styles.jlptBadgeText}>{jlptLabel(item.jlpt_level)}</Text>
            </View>
          )}

          {/* Status dot */}
          {(isLearned || isLearning) && (
            <View
              style={[
                styles.statusDot,
                {
                  backgroundColor: isLearned
                    ? colors.accentGreen
                    : colors.accentOrange,
                },
              ]}
            />
          )}

          <Text style={[styles.kanjiCharacter, { color: colors.textPrimary }]}>
            {item.character}
          </Text>
          <Text
            style={[styles.kanjiMeaning, { color: colors.textSecondary }]}
            numberOfLines={2}
          >
            {item.meaning}
          </Text>
        </TouchableOpacity>
      );
    },
    [colors, learnedIds, learningIds, handleKanjiPress]
  );

  const renderVocabCard = useCallback(
    ({ item }: { item: VocabRow }) => {
      const jlptColor = JLPT_COLORS[item.jlpt_level] || colors.textMuted;

      return (
        <TouchableOpacity
          style={[styles.vocabCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
          activeOpacity={0.7}
          onPress={() => handleVocabPress(item.id)}
        >
          <View style={styles.vocabLeft}>
            <Text style={[styles.vocabWord, { color: colors.textPrimary }]}>
              {item.word}
            </Text>
            <Text style={[styles.vocabReading, { color: colors.accentPurple }]}>
              {item.reading}
            </Text>
          </View>
          <View style={styles.vocabRight}>
            <Text
              style={[styles.vocabMeaning, { color: colors.textSecondary }]}
              numberOfLines={2}
            >
              {item.meaning}
            </Text>
            {item.jlpt_level > 0 && (
              <View style={[styles.jlptBadgeSmall, { backgroundColor: jlptColor }]}>
                <Text style={styles.jlptBadgeTextSmall}>
                  {jlptLabel(item.jlpt_level)}
                </Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      );
    },
    [colors, handleVocabPress]
  );

  // --- pill helpers --------------------------------------------------------

  const jlptOptions: { label: string; value: JlptFilter }[] = [
    { label: 'All', value: 'all' },
    { label: 'N5', value: 5 },
    { label: 'N4', value: 4 },
    { label: 'N3', value: 3 },
    { label: 'N2', value: 2 },
    { label: 'N1', value: 1 },
    { label: 'By Grade', value: 'grade' },
  ];

  const sortOptions: { label: string; value: SortKey; icon: keyof typeof Ionicons.glyphMap }[] = [
    { label: 'Freq', value: 'frequency', icon: 'trending-up' },
    { label: 'Grade', value: 'grade', icon: 'school-outline' },
    { label: 'JLPT', value: 'jlpt', icon: 'ribbon-outline' },
    { label: 'Strokes', value: 'strokes', icon: 'brush-outline' },
  ];

  const statusOptions: { label: string; value: StatusFilter }[] = [
    { label: 'All', value: 'all' },
    { label: 'Learned', value: 'learned' },
    { label: 'Learning', value: 'learning' },
    { label: 'Locked', value: 'locked' },
  ];

  // --- main render ---------------------------------------------------------

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Library</Text>
      </View>

      {/* Search bar */}
      <View style={[styles.searchBar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Ionicons name="search" size={20} color={colors.textMuted} style={styles.searchIcon} />
        <TextInput
          style={[styles.searchInput, { color: colors.textPrimary }]}
          placeholder={
            browseMode === 'kanji'
              ? 'Search by kanji, meaning, or reading...'
              : 'Search by word, reading, or meaning...'
          }
          placeholderTextColor={colors.textMuted}
          value={query}
          onChangeText={setQuery}
          autoCorrect={false}
          autoCapitalize="none"
          returnKeyType="search"
        />
        {query.length > 0 && (
          <TouchableOpacity
            onPress={() => setQuery('')}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="close-circle" size={20} color={colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Browse mode toggle */}
      <View style={[styles.modeToggle, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <TouchableOpacity
          style={[
            styles.modeButton,
            browseMode === 'kanji' && [styles.modeButtonActive, { backgroundColor: colors.accentRed }],
          ]}
          onPress={() => setBrowseMode('kanji')}
        >
          <Text
            style={[
              styles.modeButtonText,
              { color: browseMode === 'kanji' ? '#FFFFFF' : colors.textSecondary },
            ]}
          >
            Kanji
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.modeButton,
            browseMode === 'vocabulary' && [styles.modeButtonActive, { backgroundColor: colors.accentBlue }],
          ]}
          onPress={() => setBrowseMode('vocabulary')}
        >
          <Text
            style={[
              styles.modeButtonText,
              { color: browseMode === 'vocabulary' ? '#FFFFFF' : colors.textSecondary },
            ]}
          >
            Vocabulary
          </Text>
        </TouchableOpacity>
      </View>

      {/* Filter pills (horizontal scroll) */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.pillRow}
        style={styles.pillScroll}
      >
        {jlptOptions.map((opt) => {
          const active = jlptFilter === opt.value;
          return (
            <TouchableOpacity
              key={String(opt.value)}
              style={[
                styles.pill,
                {
                  backgroundColor: active ? colors.accentRed : colors.surface,
                  borderColor: active ? colors.accentRed : colors.border,
                },
              ]}
              onPress={() => setJlptFilter(active ? 'all' : opt.value)}
            >
              <Text
                style={[
                  styles.pillText,
                  { color: active ? '#FFFFFF' : colors.textSecondary },
                ]}
              >
                {opt.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Sort row */}
      <View style={styles.controlRow}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.pillRow}
          style={styles.pillScroll}
        >
          {sortOptions.map((opt) => {
            const active = sortKey === opt.value;
            return (
              <TouchableOpacity
                key={opt.value}
                style={[
                  styles.pill,
                  {
                    backgroundColor: active ? colors.accentPurple : colors.surface,
                    borderColor: active ? colors.accentPurple : colors.border,
                  },
                ]}
                onPress={() => setSortKey(opt.value)}
              >
                <Ionicons
                  name={opt.icon}
                  size={14}
                  color={active ? '#FFFFFF' : colors.textSecondary}
                  style={{ marginRight: 4 }}
                />
                <Text
                  style={[
                    styles.pillText,
                    { color: active ? '#FFFFFF' : colors.textSecondary },
                  ]}
                >
                  {opt.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Status filter row (kanji only) */}
      {browseMode === 'kanji' && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.pillRow}
          style={styles.pillScroll}
        >
          {statusOptions.map((opt) => {
            const active = statusFilter === opt.value;
            return (
              <TouchableOpacity
                key={opt.value}
                style={[
                  styles.pill,
                  {
                    backgroundColor: active ? colors.accentBlue : colors.surface,
                    borderColor: active ? colors.accentBlue : colors.border,
                  },
                ]}
                onPress={() => setStatusFilter(opt.value)}
              >
                <Text
                  style={[
                    styles.pillText,
                    { color: active ? '#FFFFFF' : colors.textSecondary },
                  ]}
                >
                  {opt.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      {/* Results count */}
      <View style={styles.resultsInfo}>
        <Text style={[styles.resultsCount, { color: colors.textMuted }]}>
          {browseMode === 'kanji'
            ? `${filteredKanji.length} kanji`
            : `${filteredVocab.length} words`}
        </Text>
      </View>

      {/* Results list */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accentRed} />
        </View>
      ) : browseMode === 'kanji' ? (
        <FlatList
          key="kanji-grid"
          data={filteredKanji}
          renderItem={renderKanjiCard}
          keyExtractor={(item) => `k-${item.id}`}
          numColumns={3}
          columnWrapperStyle={styles.gridRow}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="search-outline" size={48} color={colors.textMuted} />
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                No kanji found
              </Text>
            </View>
          }
        />
      ) : (
        <FlatList
          key="vocab-list"
          data={filteredVocab}
          renderItem={renderVocabCard}
          keyExtractor={(item) => `v-${item.id}`}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="search-outline" size={48} color={colors.textMuted} />
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                No vocabulary found
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 4,
  },
  title: {
    fontSize: 32,
    fontFamily: 'NotoSansJP-Bold',
  },

  // Search
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 10,
    paddingHorizontal: 14,
    height: 48,
    borderRadius: 16,
    borderWidth: 1,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'NotoSansJP-Regular',
    paddingVertical: 0,
  },

  // Mode toggle
  modeToggle: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 10,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  modeButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: 44,
  },
  modeButtonActive: {
    borderRadius: 10,
  },
  modeButtonText: {
    fontSize: 15,
    fontFamily: 'NotoSansJP-Bold',
  },

  // Pills
  pillScroll: {
    flexGrow: 0,
    flexShrink: 0,
    height: 46,
  },
  pillRow: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    gap: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    height: 34,
    borderRadius: 999,
    borderWidth: 1,
  },
  pillText: {
    fontSize: 13,
    fontFamily: 'NotoSansJP-Bold',
  },

  // Control / sort row
  controlRow: {
    height: 46,
  },

  // Results info
  resultsInfo: {
    paddingHorizontal: 20,
    paddingBottom: 4,
  },
  resultsCount: {
    fontSize: 13,
    fontFamily: 'NotoSansJP-Regular',
  },

  // Grid
  listContent: {
    paddingHorizontal: 12,
    paddingBottom: 100,
  },
  gridRow: {
    justifyContent: 'flex-start',
    gap: 10,
    paddingHorizontal: 4,
  },

  // Kanji card
  kanjiCard: {
    width: '30%',
    aspectRatio: 0.85,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    padding: 8,
    position: 'relative',
  },
  kanjiCharacter: {
    fontSize: 38,
    fontFamily: 'NotoSansJP-Bold',
    lineHeight: 46,
  },
  kanjiMeaning: {
    fontSize: 12,
    fontFamily: 'NotoSansJP-Regular',
    textAlign: 'center',
    marginTop: 4,
  },
  jlptBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    borderRadius: 999,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  jlptBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontFamily: 'NotoSansJP-Bold',
  },
  statusDot: {
    position: 'absolute',
    top: 8,
    left: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
  },

  // Vocab card
  vocabCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginBottom: 10,
    minHeight: 64,
  },
  vocabLeft: {
    marginRight: 12,
    minWidth: 80,
  },
  vocabWord: {
    fontSize: 22,
    fontFamily: 'NotoSansJP-Bold',
  },
  vocabReading: {
    fontSize: 13,
    fontFamily: 'NotoSansJP-Regular',
    marginTop: 2,
  },
  vocabRight: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  vocabMeaning: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'NotoSansJP-Regular',
    marginRight: 8,
  },
  jlptBadgeSmall: {
    borderRadius: 999,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  jlptBadgeTextSmall: {
    color: '#FFFFFF',
    fontSize: 10,
    fontFamily: 'NotoSansJP-Bold',
  },

  // Empty / loading
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
  },
  emptyText: {
    fontSize: 16,
    fontFamily: 'NotoSansJP-Regular',
    marginTop: 12,
  },
});
