import React from 'react';
import { View, Pressable, StyleSheet, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '@/hooks/useTheme';
import { useNotificationStore } from '@/stores/useNotificationStore';

interface Props {
  onPress: () => void;
}

export default function NotificationBell({ onPress }: Props) {
  const colors = useThemeColors();
  const unreadCount = useNotificationStore((s) => s.unreadCount);

  return (
    <Pressable onPress={onPress} style={styles.button}>
      <Ionicons
        name={unreadCount > 0 ? 'notifications' : 'notifications-outline'}
        size={22}
        color={unreadCount > 0 ? colors.accentBlue : colors.textMuted}
      />
      {unreadCount > 0 && (
        <View style={[styles.badge, { backgroundColor: colors.accentRed }]}>
          <Text style={styles.badgeText}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: 4,
    right: 2,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '700',
  },
});
