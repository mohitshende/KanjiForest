import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { useThemeColors } from '@/hooks/useTheme';
import { getKanjiByCharacter } from '@/lib/database';

interface KanjiData {
  id: number;
  character: string;
  meaning: string;
  onyomi: string;
  kunyomi: string;
  stroke_count: number;
  jlpt_level: number;
  joyo_grade: number;
  mnemonic: string;
  radical_ids: string;
}

export default function KanjiCompare() {
  const colors = useThemeColors();
  const router = useRouter();
  const [inputA, setInputA] = useState('');
  const [inputB, setInputB] = useState('');
  const [kanjiA, setKanjiA] = useState<KanjiData | null>(null);
  const [kanjiB, setKanjiB] = useState<KanjiData | null>(null);
  const [error, setError] = useState('');

  const compare = async () => {
    setError('');
    const [a, b] = await Promise.all([
      getKanjiByCharacter(inputA.trim()),
      getKanjiByCharacter(inputB.trim()),
    ]);
    if (!a || !b) {
      setError('One or both kanji not found. Make sure they are valid kanji characters.');
      return;
    }
    setKanjiA(a as KanjiData);
    setKanjiB(b as KanjiData);
  };

  const diff = (a: string | number | null | undefined, b: string | number | null | undefined) =>
    a !== b;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Kanji Compare</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInUp.delay(100)}>
          <Text style={[styles.hint, { color: colors.textMuted }]}>
            Enter two kanji characters to compare them side by side.
          </Text>

          <View style={styles.inputRow}>
            <View style={[styles.inputBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <TextInput
                style={[styles.kanjiInput, { color: colors.textPrimary, fontFamily: 'NotoSansJP-Bold' }]}
                placeholder="語"
                placeholderTextColor={colors.textMuted}
                value={inputA}
                onChangeText={setInputA}
                maxLength={1}
                textAlign="center"
              />
            </View>

            <Ionicons name="swap-horizontal-outline" size={28} color={colors.textMuted} />

            <View style={[styles.inputBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <TextInput
                style={[styles.kanjiInput, { color: colors.textPrimary, fontFamily: 'NotoSansJP-Bold' }]}
                placeholder="話"
                placeholderTextColor={colors.textMuted}
                value={inputB}
                onChangeText={setInputB}
                maxLength={1}
                textAlign="center"
              />
            </View>
          </View>

          {error ? (
            <Text style={[styles.errorText, { color: colors.accentRed }]}>{error}</Text>
          ) : null}

          <Pressable
            style={[styles.compareBtn, { backgroundColor: colors.accentOrange }]}
            onPress={compare}
          >
            <Ionicons name="git-compare-outline" size={18} color="#FFF" />
            <Text style={styles.compareBtnText}>Compare</Text>
          </Pressable>
        </Animated.View>

        {kanjiA && kanjiB && (
          <Animated.View entering={FadeInUp.delay(200)}>
            {/* Hero row */}
            <View style={styles.heroRow}>
              {[kanjiA, kanjiB].map((k, side) => (
                <Pressable
                  key={k.id}
                  style={[styles.heroCard, { backgroundColor: colors.surface, borderColor: colors.accentOrange + '60' }]}
                  onPress={() => router.push(`/kanji/${k.id}`)}
                >
                  <Text style={[styles.heroKanji, { color: colors.textPrimary, fontFamily: 'NotoSansJP-Bold' }]}>
                    {k.character}
                  </Text>
                  <Text style={[styles.heroMeaning, { color: colors.textSecondary }]} numberOfLines={2}>
                    {k.meaning}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Comparison table */}
            {([
              { label: 'On\'yomi', a: kanjiA.onyomi || '—', b: kanjiB.onyomi || '—' },
              { label: 'Kun\'yomi', a: kanjiA.kunyomi || '—', b: kanjiB.kunyomi || '—' },
              { label: 'Strokes', a: String(kanjiA.stroke_count), b: String(kanjiB.stroke_count) },
              { label: 'JLPT', a: kanjiA.jlpt_level ? `N${kanjiA.jlpt_level}` : '—', b: kanjiB.jlpt_level ? `N${kanjiB.jlpt_level}` : '—' },
              { label: 'Grade', a: String(kanjiA.joyo_grade || '—'), b: String(kanjiB.joyo_grade || '—') },
            ] as { label: string; a: string; b: string }[]).map((row) => {
              const isDiff = row.a !== row.b;
              return (
                <View
                  key={row.label}
                  style={[
                    styles.tableRow,
                    {
                      backgroundColor: isDiff ? colors.accentOrange + '10' : colors.surface,
                      borderColor: isDiff ? colors.accentOrange + '40' : colors.border,
                    },
                  ]}
                >
                  <Text style={[styles.tableLabel, { color: colors.textMuted }]}>{row.label}</Text>
                  <Text style={[styles.tableVal, { color: isDiff ? colors.accentOrange : colors.textPrimary, fontFamily: 'NotoSansJP-Regular' }]}>
                    {row.a}
                  </Text>
                  <View style={[styles.tableDivider, { backgroundColor: colors.border }]} />
                  <Text style={[styles.tableVal, { color: isDiff ? colors.accentOrange : colors.textPrimary, fontFamily: 'NotoSansJP-Regular' }]}>
                    {row.b}
                  </Text>
                  {isDiff && <Ionicons name="alert-circle-outline" size={14} color={colors.accentOrange} style={styles.diffIcon} />}
                </View>
              );
            })}

            {/* Mnemonic comparison */}
            {(kanjiA.mnemonic || kanjiB.mnemonic) && (
              <View style={[styles.mnemonicRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={[styles.tableLabel, { color: colors.textMuted, marginBottom: 8 }]}>Mnemonics</Text>
                <View style={styles.mnemonicPair}>
                  <View style={styles.mnemonicCell}>
                    <Text style={[styles.mnemonicChar, { color: colors.accentBlue }]}>{kanjiA.character}</Text>
                    <Text style={[styles.mnemonicText, { color: colors.textSecondary }]}>
                      {kanjiA.mnemonic || 'No mnemonic'}
                    </Text>
                  </View>
                  <View style={[styles.mnemonicDivider, { backgroundColor: colors.border }]} />
                  <View style={styles.mnemonicCell}>
                    <Text style={[styles.mnemonicChar, { color: colors.accentBlue }]}>{kanjiB.character}</Text>
                    <Text style={[styles.mnemonicText, { color: colors.textSecondary }]}>
                      {kanjiB.mnemonic || 'No mnemonic'}
                    </Text>
                  </View>
                </View>
              </View>
            )}
          </Animated.View>
        )}

        <View style={{ height: 80 }} />
      </ScrollView>
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
  headerTitle: { fontSize: 18, fontWeight: '700' },

  content: { padding: 20 },
  hint: { fontSize: 14, marginBottom: 16 },

  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 12,
  },
  inputBox: {
    width: 80,
    height: 80,
    borderRadius: 16,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  kanjiInput: {
    fontSize: 40,
    width: '100%',
    height: '100%',
    textAlign: 'center',
  },

  errorText: { fontSize: 13, textAlign: 'center', marginBottom: 10 },

  compareBtn: {
    height: 50,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 20,
  },
  compareBtnText: { color: '#FFF', fontSize: 16, fontWeight: '600' },

  heroRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  heroCard: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    alignItems: 'center',
  },
  heroKanji: { fontSize: 64, lineHeight: 72 },
  heroMeaning: { fontSize: 13, textAlign: 'center', marginTop: 4 },

  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
    marginBottom: 8,
    gap: 8,
  },
  tableLabel: { fontSize: 12, fontWeight: '600', width: 60 },
  tableVal: { flex: 1, fontSize: 14 },
  tableDivider: { width: 1, height: 16 },
  diffIcon: { marginLeft: 4 },

  mnemonicRow: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    marginBottom: 8,
  },
  mnemonicPair: { flexDirection: 'row', gap: 12 },
  mnemonicCell: { flex: 1 },
  mnemonicChar: { fontSize: 18, fontWeight: '700', marginBottom: 4 },
  mnemonicText: { fontSize: 13, lineHeight: 18 },
  mnemonicDivider: { width: 1 },
});
