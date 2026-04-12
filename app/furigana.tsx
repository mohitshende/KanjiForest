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

interface AnnotatedChar {
  char: string;
  reading: string | null;
  isKanji: boolean;
}

function isKanjiChar(ch: string): boolean {
  const code = ch.codePointAt(0) ?? 0;
  return (code >= 0x4e00 && code <= 0x9fff) || (code >= 0x3400 && code <= 0x4dbf);
}

export default function FuriganaReader() {
  const colors = useThemeColors();
  const router = useRouter();
  const [inputText, setInputText] = useState('');
  const [annotated, setAnnotated] = useState<AnnotatedChar[]>([]);
  const [loading, setLoading] = useState(false);

  const parseText = async () => {
    if (!inputText.trim()) return;
    setLoading(true);
    const chars = [...inputText];
    const result: AnnotatedChar[] = [];

    for (const ch of chars) {
      if (isKanjiChar(ch)) {
        const kanji = await getKanjiByCharacter(ch) as any;
        const reading = kanji?.kunyomi
          ? kanji.kunyomi.split(/[、,]/)[0].replace(/[（）()]/g, '').trim()
          : null;
        result.push({ char: ch, reading, isKanji: true });
      } else {
        result.push({ char: ch, reading: null, isKanji: false });
      }
    }

    setAnnotated(result);
    setLoading(false);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Furigana Reader</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInUp.delay(100)}>
          <Text style={[styles.hint, { color: colors.textMuted }]}>
            Paste Japanese text below and tap Parse to see furigana above each kanji.
          </Text>

          <View style={[styles.inputCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <TextInput
              style={[styles.input, { color: colors.textPrimary, fontFamily: 'NotoSansJP-Regular' }]}
              placeholder="日本語のテキストを入力..."
              placeholderTextColor={colors.textMuted}
              multiline
              value={inputText}
              onChangeText={setInputText}
              textAlignVertical="top"
            />
          </View>

          <Pressable
            style={[styles.parseBtn, { backgroundColor: colors.accentBlue, opacity: loading ? 0.6 : 1 }]}
            onPress={parseText}
            disabled={loading}
          >
            <Ionicons name="scan-outline" size={18} color="#FFF" />
            <Text style={styles.parseBtnText}>{loading ? 'Parsing...' : 'Parse'}</Text>
          </Pressable>
        </Animated.View>

        {annotated.length > 0 && (
          <Animated.View entering={FadeInUp.delay(200)}>
            <View style={[styles.resultCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.resultLabel, { color: colors.textSecondary }]}>Result</Text>
              <View style={styles.textRow}>
                {annotated.map((item, i) => (
                  <View key={i} style={styles.charBlock}>
                    {item.isKanji && item.reading ? (
                      <Text style={[styles.furigana, { color: colors.accentBlue }]} numberOfLines={1}>
                        {item.reading}
                      </Text>
                    ) : (
                      <Text style={styles.furiganaPlaceholder}> </Text>
                    )}
                    <Text style={[
                      styles.mainChar,
                      {
                        color: item.isKanji ? colors.textPrimary : colors.textSecondary,
                        fontFamily: 'NotoSansJP-Regular',
                        fontWeight: item.isKanji ? '700' : '400',
                      },
                    ]}>
                      {item.char}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
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
  hint: { fontSize: 14, lineHeight: 20, marginBottom: 16 },

  inputCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
    marginBottom: 12,
  },
  input: {
    fontSize: 18,
    minHeight: 100,
    lineHeight: 28,
  },

  parseBtn: {
    height: 50,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 20,
  },
  parseBtnText: { color: '#FFF', fontSize: 16, fontWeight: '600' },

  resultCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  resultLabel: { fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 },
  textRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-end',
    gap: 2,
  },
  charBlock: {
    alignItems: 'center',
    marginHorizontal: 1,
  },
  furigana: {
    fontSize: 9,
    lineHeight: 12,
  },
  furiganaPlaceholder: {
    fontSize: 9,
    lineHeight: 12,
  },
  mainChar: {
    fontSize: 22,
    lineHeight: 28,
  },
});
