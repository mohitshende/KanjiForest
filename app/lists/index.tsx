import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { useThemeColors } from '@/hooks/useTheme';
import { useListsStore } from '@/stores/useListsStore';

export default function ListsScreen() {
  const colors = useThemeColors();
  const router = useRouter();
  const { lists, loadLists, addList, removeList } = useListsStore();
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');

  useEffect(() => {
    loadLists();
  }, []);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    await addList(newName.trim(), newDesc.trim());
    setNewName('');
    setNewDesc('');
    setShowCreate(false);
  };

  const handleDelete = (id: number, name: string) => {
    Alert.alert('Delete List', `Delete "${name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => removeList(id),
      },
    ]);
  };

  // Pre-built curated lists
  const curatedLists = [
    { id: 'jlpt5', name: 'JLPT N5', desc: 'Beginner kanji', count: 80 },
    { id: 'jlpt4', name: 'JLPT N4', desc: 'Elementary kanji', count: 166 },
    { id: 'jlpt3', name: 'JLPT N3', desc: 'Intermediate kanji', count: 367 },
    { id: 'grade1', name: 'Grade 1', desc: 'First grade kanji', count: 80 },
    { id: 'grade2', name: 'Grade 2', desc: 'Second grade kanji', count: 160 },
    { id: 'freq500', name: 'Top 500', desc: 'Most frequent kanji', count: 500 },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
          Study Lists
        </Text>
        <Pressable
          onPress={() => setShowCreate(!showCreate)}
          style={styles.addBtn}
        >
          <Ionicons name="add-circle-outline" size={28} color={colors.accentBlue} />
        </Pressable>
      </View>

      <FlatList
        data={[...lists]}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <>
            {/* Create new list form */}
            {showCreate && (
              <Animated.View
                entering={FadeInUp}
                style={[
                  styles.createCard,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                ]}
              >
                <TextInput
                  style={[
                    styles.input,
                    { color: colors.textPrimary, borderColor: colors.border },
                  ]}
                  placeholder="List name"
                  placeholderTextColor={colors.textMuted}
                  value={newName}
                  onChangeText={setNewName}
                />
                <TextInput
                  style={[
                    styles.input,
                    { color: colors.textPrimary, borderColor: colors.border },
                  ]}
                  placeholder="Description (optional)"
                  placeholderTextColor={colors.textMuted}
                  value={newDesc}
                  onChangeText={setNewDesc}
                />
                <Pressable
                  style={[styles.createBtn, { backgroundColor: colors.accentBlue }]}
                  onPress={handleCreate}
                >
                  <Text style={styles.createBtnText}>Create List</Text>
                </Pressable>
              </Animated.View>
            )}

            {/* Curated lists */}
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
              CURATED LISTS
            </Text>
            {curatedLists.map((cl) => (
              <Pressable
                key={cl.id}
                style={[
                  styles.listCard,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                ]}
              >
                <View style={styles.listInfo}>
                  <Text style={[styles.listName, { color: colors.textPrimary }]}>
                    {cl.name}
                  </Text>
                  <Text style={[styles.listDesc, { color: colors.textSecondary }]}>
                    {cl.desc}
                  </Text>
                </View>
                <View
                  style={[
                    styles.countBadge,
                    { backgroundColor: colors.accentBlue + '20' },
                  ]}
                >
                  <Text style={[styles.countText, { color: colors.accentBlue }]}>
                    {cl.count}
                  </Text>
                </View>
              </Pressable>
            ))}

            {/* Custom lists header */}
            <Text
              style={[
                styles.sectionTitle,
                { color: colors.textSecondary, marginTop: 24 },
              ]}
            >
              YOUR LISTS
            </Text>

            {lists.length === 0 && (
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                No custom lists yet. Tap + to create one.
              </Text>
            )}
          </>
        }
        renderItem={({ item }) => {
          const kanjiCount = JSON.parse(item.kanji_ids || '[]').length;
          const vocabCount = JSON.parse(item.vocab_ids || '[]').length;

          return (
            <Pressable
              style={[
                styles.listCard,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
              onPress={() => router.push(`/lists/${item.id}`)}
              onLongPress={() => handleDelete(item.id, item.name)}
            >
              <View style={styles.listInfo}>
                <Text style={[styles.listName, { color: colors.textPrimary }]}>
                  {item.name}
                </Text>
                <Text style={[styles.listDesc, { color: colors.textSecondary }]}>
                  {item.description || 'No description'}
                </Text>
                <Text style={[styles.listMeta, { color: colors.textMuted }]}>
                  {kanjiCount} kanji, {vocabCount} vocab
                </Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={colors.textMuted}
              />
            </Pressable>
          );
        }}
        ListFooterComponent={<View style={{ height: 40 }} />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '700' },
  addBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },

  listContent: { paddingHorizontal: 20 },

  createCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    marginBottom: 20,
    gap: 12,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    height: 44,
    paddingHorizontal: 14,
    fontSize: 15,
  },
  createBtn: {
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  createBtnText: { color: '#FFF', fontSize: 15, fontWeight: '600' },

  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 12,
  },

  listCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  listInfo: { flex: 1 },
  listName: { fontSize: 17, fontWeight: '600' },
  listDesc: { fontSize: 13, marginTop: 2 },
  listMeta: { fontSize: 11, marginTop: 4 },

  countBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  countText: { fontSize: 13, fontWeight: '700' },

  emptyText: {
    fontSize: 15,
    textAlign: 'center',
    marginTop: 20,
  },
});
