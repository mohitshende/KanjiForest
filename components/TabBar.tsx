import React, { useEffect } from 'react';
import { View, Pressable, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import Animated, {
  useAnimatedStyle,
  withTiming,
  useSharedValue,
  Easing,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useThemeColors } from '@/hooks/useTheme';
import { useSettingsStore } from '@/stores/useSettingsStore';

const TAB_CONFIG: {
  name: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconFilled: keyof typeof Ionicons.glyphMap;
}[] = [
  { name: 'index', label: 'Journey', icon: 'leaf-outline', iconFilled: 'leaf' },
  { name: 'library', label: 'Library', icon: 'book-outline', iconFilled: 'book' },
  { name: 'practice', label: 'Practice', icon: 'flash-outline', iconFilled: 'flash' },
  { name: 'progress', label: 'Progress', icon: 'bar-chart-outline', iconFilled: 'bar-chart' },
  { name: 'settings', label: 'Settings', icon: 'settings-outline', iconFilled: 'settings' },
];

function TabBarButton({
  tab,
  isFocused,
  onPress,
  onLongPress,
  colors,
}: {
  tab: (typeof TAB_CONFIG)[number];
  isFocused: boolean;
  onPress: () => void;
  onLongPress: () => void;
  colors: ReturnType<typeof useThemeColors>;
}) {
  const pillOpacity = useSharedValue(isFocused ? 1 : 0);
  const pillWidth = useSharedValue(isFocused ? 1 : 0);

  useEffect(() => {
    const timingConfig = { duration: 280, easing: Easing.bezier(0.25, 0.1, 0.25, 1) };
    pillOpacity.value = withTiming(isFocused ? 1 : 0, timingConfig);
    pillWidth.value = withTiming(isFocused ? 1 : 0, timingConfig);
  }, [isFocused]);

  const pillStyle = useAnimatedStyle(() => ({
    opacity: pillOpacity.value,
    transform: [{ scaleX: pillWidth.value }],
  }));

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      style={styles.tabButton}
      accessibilityRole="tab"
      accessibilityState={{ selected: isFocused }}
      accessibilityLabel={tab.label}
    >
      <View style={styles.tabContent}>
        {/* Glass pill background */}
        <Animated.View
          style={[
            styles.glassPill,
            {
              backgroundColor: isFocused
                ? colors.accentBlue + '18'
                : 'transparent',
              borderColor: isFocused
                ? colors.accentBlue + '30'
                : 'transparent',
            },
            pillStyle,
          ]}
        />
        <Ionicons
          name={isFocused ? tab.iconFilled : tab.icon}
          size={21}
          color={isFocused ? colors.accentBlue : colors.textMuted}
        />
        {isFocused && (
          <Animated.Text
            style={[styles.tabLabel, { color: colors.accentBlue }]}
            numberOfLines={1}
          >
            {tab.label}
          </Animated.Text>
        )}
      </View>
    </Pressable>
  );
}

export default function CustomTabBar({
  state,
  descriptors,
  navigation,
}: BottomTabBarProps) {
  const colors = useThemeColors();
  const hapticEnabled = useSettingsStore((s) => s.hapticFeedbackEnabled);
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, 16) }]}>
      <View
        style={[
          styles.tabBar,
          {
            backgroundColor: colors.surface + 'E8',
            borderColor: colors.border + '80',
          },
        ]}
      >
        {state.routes.map((route, index) => {
          const tabConfig = TAB_CONFIG.find(
            (t) => t.name === route.name
          );
          if (!tabConfig) return null;

          const isFocused = state.index === index;

          const onPress = () => {
            if (hapticEnabled) {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }

            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          const onLongPress = () => {
            navigation.emit({
              type: 'tabLongPress',
              target: route.key,
            });
          };

          return (
            <TabBarButton
              key={route.key}
              tab={tabConfig}
              isFocused={isFocused}
              onPress={onPress}
              onLongPress={onLongPress}
              colors={colors}
            />
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  tabBar: {
    flexDirection: 'row',
    borderRadius: 24,
    paddingVertical: 6,
    paddingHorizontal: 6,
    borderWidth: 0.5,
    boxShadow: '0px 8px 24px rgba(0,0,0,0.08)',
    ...Platform.select({
      android: {
        elevation: 12,
      },
    }),
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    minWidth: 44,
  },
  tabContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 18,
    gap: 3,
    position: 'relative',
    overflow: 'hidden',
  },
  glassPill: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 18,
    borderWidth: 0.5,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
});
