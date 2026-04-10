import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '@/hooks/useTheme';
import { getCustomListById, getKanjiById } from '@/lib/database';
import { useListsStore } from '@/stores/useListsStore';

interface ListData {
  id: number;
  name: string;
  description: string;
  kanji_ids: string;
  vocab_ids: string;
}

interface KanjiItem {
  id: number;
  character: string;
  meaning: string;
  jlpt_level: number;
}

export default function ListDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useThemeColors();
  const router = useRouter();
  const [list, setList] = useState<ListData | null>(null);
  const [kanjiItems, setKanjiItems] = useState<KanjiItem[]>([]);
  const removeKanjiFromList = useListsStore((s) => s.removeKanjiFromList);

  useEffect(() => {
    if (!id) return;
    loadList();
  }, [id]);

  const loadList = async () => {
    const data = (await getCustomListById(parseInt(id!, 10))) as ListData | null;
    if (!data) return;
    setList(data);

    const kanjiIds: number[] = JSON.parse(data.kanji_ids || '[]');
    const items: KanjiItem[] = [];
    for (const kid of kanjiIds) {
      const k = (await getKanjiById(kid)) as KanjiItem | null;
      if (k) items.push(k);
    }
    setKanjiItems(items);
  };

  const handleExport = async () => {
    if (!list) return;
    const kanjiText = kanjiItems.map((k) => k.character).join('');
    await Share.share({
      message: `${list.name}\n${kanjiText}`,
    });
  };

  const handleStudy = () => {
    router.push('/games/recognition');
  };

  if (!list) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.centered}>
          <Text style={{ color: colors.textSecondary }}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]} numberOfLines={1}>
          {list.name}
        </Text>
        <Pressable onPress={handleExport} style={styles.actionBtn}>
          <Ionicons name="share-outline" size={22} color={colors.accentBlue} />
        </Pressable>
      </View>

      {/* Info */}
      <View style={styles.infoSection}>
        {list.description ? (
          <Text style={[styles.desc, { color: colors.textSecondary }]}>
            {list.description}
          </Text>
        ) : null}
        <Text style={[styles.count, { color: colors.textMuted }]}>
          {kanjiItems.length} kanji
        </Text>
      </View>

      {/* Study button */}
      {kanjiItems.length > 0 && (
        <Pressable
          style={[styles.studyBtn, { backgroundColor: colors.accentBlue }]}
          onPress={handleStudy}
        >
          <Ionicons name="play" size={20} color="#FFF" />
          <Text style={styles.studyBtnText}>Study This List</Text>
        </Pressable>
      )}

      {/* Kanji grid */}
      <FlatList
        data={kanjiItems}
        keyExtractor={(item) => String(item.id)}
        numColumns={5}
        contentContainerStyle={styles.grid}
        columnWrapperStyle={styles.gridRow}
        renderItem={({ item }) => (
          <Pressable
            style={[
              styles.kanjiTile,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
            onPress={() => router.push(`/kanji/${item.id}`)}
            onLongPress={() => {
              removeKanjiFromList(list.id, item.id);
              loadList();
            }}
          >
            <Text
              style={[
                styles.kanjiChar,
                { color: colors.textPrimary, fontFamily: 'NotoSansJP-Bold' },
              ]}
            >
              {item.character}
            </Text>
            <Text
              style={[styles.kanjiMeaning, { color: colors.textMuted }]}
              numberOfLines={1}
            >
              {item.meaning}
            </Text>
          </Pressable>
        )}
        ListEmptyComponent={
          <Text style={[styles.emptyText, { color: colors.textMuted }]}>
            No kanji in this list yet.
          </Text>
        }
        ListFooterComponent={<View style={{ height: 40 }} />}
      />
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
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '700', flex: 1, textAlign: 'center' },
  actionBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },

  infoSection: { paddingHorizontal: 20, marginBottom: 12 },
  desc: { fontSize: 15, marginBottom: 4 },
  count: { fontSize: 13 },

  studyBtn: {
    height: 48,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 20,
    marginBottom: 20,
  },
  studyBtnText: { color: '#FFF', fontSize: 16, fontWeight: '600' },

  grid: { paddingHorizontal: 16 },
  gridRow: { gap: 8, marginBottom: 8 },

  kanjiTile: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    maxWidth: '18%',
  },
  kanjiChar: { fontSize: 28 },
  kanjiMeaning: { fontSize: 8, marginTop: 2 },

  emptyText: { fontSize: 15, textAlign: 'center', marginTop: 40 },
});
