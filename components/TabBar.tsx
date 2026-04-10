import React from 'react';
import { View, Pressable, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import Animated, {
  useAnimatedStyle,
  withSpring,
  useSharedValue,
  interpolate,
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
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = () => {
    scale.value = withSpring(0.85, { damping: 15 }, () => {
      scale.value = withSpring(1, { damping: 10 });
    });
    onPress();
  };

  return (
    <Pressable
      onPress={handlePress}
      onLongPress={onLongPress}
      style={styles.tabButton}
      accessibilityRole="tab"
      accessibilityState={{ selected: isFocused }}
      accessibilityLabel={tab.label}
    >
      <Animated.View style={[styles.tabContent, animatedStyle]}>
        <Ionicons
          name={isFocused ? tab.iconFilled : tab.icon}
          size={22}
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
      </Animated.View>
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

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.tabBar,
          {
            backgroundColor: colors.surface + 'F0',
            borderColor: colors.border,
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
    paddingBottom: Platform.OS === 'ios' ? 28 : 16,
    paddingHorizontal: 20,
  },
  tabBar: {
    flexDirection: 'row',
    borderRadius: 28,
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderWidth: 1,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
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
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    gap: 2,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
  },
});
