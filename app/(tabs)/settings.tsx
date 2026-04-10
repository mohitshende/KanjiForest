import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  Pressable,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { useThemeColors } from '@/hooks/useTheme';
import { useSettingsStore } from '@/stores/useSettingsStore';

type OptionKey<T> = { label: string; value: T };

function SettingRow({
  label,
  children,
  colors,
}: {
  label: string;
  children: React.ReactNode;
  colors: ReturnType<typeof useThemeColors>;
}) {
  return (
    <View style={[styles.row, { borderBottomColor: colors.border }]}>
      <Text style={[styles.rowLabel, { color: colors.textPrimary }]}>{label}</Text>
      {children}
    </View>
  );
}

function SegmentedControl<T extends string>({
  options,
  selected,
  onChange,
  colors,
}: {
  options: OptionKey<T>[];
  selected: T;
  onChange: (val: T) => void;
  colors: ReturnType<typeof useThemeColors>;
}) {
  return (
    <View style={styles.segmented}>
      {options.map((opt) => (
        <Pressable
          key={opt.value}
          style={[
            styles.segBtn,
            {
              backgroundColor:
                selected === opt.value ? colors.accentBlue : colors.surfaceElevated,
            },
          ]}
          onPress={() => onChange(opt.value)}
        >
          <Text
            style={[
              styles.segText,
              { color: selected === opt.value ? '#FFF' : colors.textSecondary },
            ]}
          >
            {opt.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

export default function SettingsScreen() {
  const colors = useThemeColors();
  const router = useRouter();
  const s = useSettingsStore();

  const handleResetProgress = () => {
    Alert.alert(
      'Reset Progress',
      'This will erase all your learning progress. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => {
            // Will be implemented in data export/import step
            Alert.alert('Reset', 'Progress has been reset.');
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.title, { color: colors.textPrimary }]}>Settings</Text>

        {/* Display Section */}
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
          DISPLAY
        </Text>

        <SettingRow label="Reading Display" colors={colors}>
          <SegmentedControl
            options={[
              { label: 'Romaji', value: 'romaji' as const },
              { label: 'Hiragana', value: 'hiragana' as const },
              { label: 'Both', value: 'both' as const },
            ]}
            selected={s.readingDisplay}
            onChange={s.setReadingDisplay}
            colors={colors}
          />
        </SettingRow>

        <SettingRow label="Theme" colors={colors}>
          <SegmentedControl
            options={[
              { label: 'System', value: 'system' as const },
              { label: 'Light', value: 'light' as const },
              { label: 'Dark', value: 'dark' as const },
            ]}
            selected={s.themeMode}
            onChange={s.setThemeMode}
            colors={colors}
          />
        </SettingRow>

        <SettingRow label="Font Size" colors={colors}>
          <SegmentedControl
            options={[
              { label: 'S', value: 'small' as const },
              { label: 'M', value: 'medium' as const },
              { label: 'L', value: 'large' as const },
            ]}
            selected={s.fontSize}
            onChange={s.setFontSize}
            colors={colors}
          />
        </SettingRow>

        {/* Learning Section */}
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
          LEARNING
        </Text>

        <SettingRow label={`Daily new kanji: ${s.dailyNewKanjiLimit}`} colors={colors}>
          <Slider
            style={styles.slider}
            minimumValue={1}
            maximumValue={20}
            step={1}
            value={s.dailyNewKanjiLimit}
            onSlidingComplete={(v) => s.setDailyNewKanjiLimit(v)}
            minimumTrackTintColor={colors.accentBlue}
            maximumTrackTintColor={colors.border}
          />
        </SettingRow>

        <SettingRow
          label={`Max reviews/session: ${s.maxReviewsPerSession}`}
          colors={colors}
        >
          <Slider
            style={styles.slider}
            minimumValue={10}
            maximumValue={200}
            step={10}
            value={s.maxReviewsPerSession}
            onSlidingComplete={(v) => s.setMaxReviewsPerSession(v)}
            minimumTrackTintColor={colors.accentBlue}
            maximumTrackTintColor={colors.border}
          />
        </SettingRow>

        <SettingRow label="SRS Difficulty" colors={colors}>
          <SegmentedControl
            options={[
              { label: 'Relaxed', value: 'relaxed' as const },
              { label: 'Standard', value: 'standard' as const },
              { label: 'Strict', value: 'strict' as const },
            ]}
            selected={s.srsDifficulty}
            onChange={s.setSRSDifficulty}
            colors={colors}
          />
        </SettingRow>

        {/* Audio & Feedback */}
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
          AUDIO & FEEDBACK
        </Text>

        <SettingRow label="Text-to-Speech" colors={colors}>
          <Switch
            value={s.ttsEnabled}
            onValueChange={s.setTTSEnabled}
            trackColor={{ false: colors.border, true: colors.accentBlue }}
          />
        </SettingRow>

        <SettingRow label="Sound Effects" colors={colors}>
          <Switch
            value={s.soundEffectsEnabled}
            onValueChange={s.setSoundEffectsEnabled}
            trackColor={{ false: colors.border, true: colors.accentBlue }}
          />
        </SettingRow>

        <SettingRow label="Haptic Feedback" colors={colors}>
          <Switch
            value={s.hapticFeedbackEnabled}
            onValueChange={s.setHapticFeedbackEnabled}
            trackColor={{ false: colors.border, true: colors.accentBlue }}
          />
        </SettingRow>

        {/* Notifications */}
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
          NOTIFICATIONS
        </Text>

        <SettingRow label="Daily Reminder" colors={colors}>
          <Switch
            value={s.reminderEnabled}
            onValueChange={s.setReminderEnabled}
            trackColor={{ false: colors.border, true: colors.accentBlue }}
          />
        </SettingRow>

        {/* Data */}
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
          DATA
        </Text>

        <Pressable
          style={[styles.actionRow, { borderBottomColor: colors.border }]}
          onPress={() => router.push('/lists')}
        >
          <Text style={[styles.actionText, { color: colors.accentBlue }]}>
            Study Lists
          </Text>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </Pressable>

        <Pressable
          style={[styles.actionRow, { borderBottomColor: colors.border }]}
          onPress={() => {
            /* handled in step 20 */
          }}
        >
          <Text style={[styles.actionText, { color: colors.accentBlue }]}>
            Export Data (JSON)
          </Text>
          <Ionicons name="download-outline" size={18} color={colors.textMuted} />
        </Pressable>

        <Pressable
          style={[styles.actionRow, { borderBottomColor: colors.border }]}
          onPress={() => {
            /* handled in step 20 */
          }}
        >
          <Text style={[styles.actionText, { color: colors.accentBlue }]}>
            Import Data (JSON)
          </Text>
          <Ionicons name="push-outline" size={18} color={colors.textMuted} />
        </Pressable>

        <Pressable
          style={[styles.actionRow, { borderBottomColor: colors.border }]}
          onPress={handleResetProgress}
        >
          <Text style={[styles.actionText, { color: colors.accentRed }]}>
            Reset Progress
          </Text>
          <Ionicons name="warning-outline" size={18} color={colors.accentRed} />
        </Pressable>

        {/* About */}
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
          ABOUT
        </Text>

        <View style={styles.aboutSection}>
          <Text style={[styles.aboutText, { color: colors.textPrimary }]}>
            KanjiForest
          </Text>
          <Text style={[styles.version, { color: colors.textMuted }]}>
            Version 1.0.0
          </Text>
          <Text style={[styles.builtBy, { color: colors.textSecondary }]}>
            Developed by Mohit Shende
          </Text>
          <Text style={[styles.techStack, { color: colors.textMuted }]}>
            Built with React Native + Expo
          </Text>
          <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
          <Text style={[styles.creditsTitle, { color: colors.textSecondary }]}>
            Open Source Credits
          </Text>
          <Text style={[styles.credits, { color: colors.textMuted }]}>
            KANJIDIC2 (CC BY-SA 4.0){'\n'}
            JMdict / EDICT (CC BY-SA 4.0){'\n'}
            KanjiVG (CC BY-SA 4.0){'\n'}
            Tatoeba Project (CC BY 2.0 FR){'\n'}
            JLPT Classifications (Public Domain){'\n'}
            Leeds Internet Corpus (CC BY)
          </Text>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 20 },
  title: { fontSize: 28, fontWeight: '700', marginBottom: 24 },

  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    marginTop: 24,
    marginBottom: 12,
  },

  row: {
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  rowLabel: {
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 8,
  },

  segmented: {
    flexDirection: 'row',
    gap: 6,
  },
  segBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  segText: {
    fontSize: 13,
    fontWeight: '600',
  },

  slider: {
    width: '100%',
    height: 36,
  },

  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  actionText: { fontSize: 15, fontWeight: '500' },

  aboutSection: {
    paddingVertical: 16,
  },
  aboutText: { fontSize: 22, fontWeight: '700' },
  version: { fontSize: 13, marginTop: 2 },
  builtBy: { fontSize: 15, fontWeight: '600', marginTop: 12 },
  techStack: { fontSize: 13, marginTop: 4 },
  dividerLine: { height: 1, marginVertical: 16 },
  creditsTitle: { fontSize: 13, fontWeight: '600', marginBottom: 8 },
  credits: { fontSize: 11, lineHeight: 18 },
});
