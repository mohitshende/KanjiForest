import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  FlatList,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, SlideInUp } from 'react-native-reanimated';
import { useThemeColors } from '@/hooks/useTheme';
import {
  useNotificationStore,
  AppNotification,
} from '@/stores/useNotificationStore';

interface Props {
  visible: boolean;
  onClose: () => void;
}

function timeAgo(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function NotificationDropdown({ visible, onClose }: Props) {
  const colors = useThemeColors();
  const { notifications, dismissNotification, clearAll, markAllAsRead } =
    useNotificationStore();

  const handleOpen = () => {
    markAllAsRead();
  };

  React.useEffect(() => {
    if (visible) handleOpen();
  }, [visible]);

  const renderItem = ({ item }: { item: AppNotification }) => (
    <View
      style={[
        styles.notifItem,
        { borderBottomColor: colors.border },
      ]}
    >
      <View style={styles.notifContent}>
        <View style={styles.notifHeader}>
          <Text
            style={[
              styles.notifTitle,
              { color: colors.textPrimary, fontWeight: item.read ? '500' : '700' },
            ]}
          >
            {item.title}
          </Text>
          <Text style={[styles.notifTime, { color: colors.textMuted }]}>
            {timeAgo(item.timestamp)}
          </Text>
        </View>
        <Text style={[styles.notifBody, { color: colors.textSecondary }]}>
          {item.body}
        </Text>
      </View>
      <Pressable
        onPress={() => dismissNotification(item.id)}
        style={styles.dismissBtn}
        hitSlop={8}
      >
        <Ionicons name="close" size={16} color={colors.textMuted} />
      </Pressable>
    </View>
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Animated.View entering={FadeIn.duration(150)}>
          <Pressable
            style={[
              styles.dropdown,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
              },
            ]}
            onPress={() => {}} // prevent close on dropdown tap
          >
            {/* Header */}
            <View style={[styles.dropdownHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.dropdownTitle, { color: colors.textPrimary }]}>
                Notifications
              </Text>
              {notifications.length > 0 && (
                <Pressable onPress={clearAll} hitSlop={8}>
                  <Text style={[styles.clearText, { color: colors.accentRed }]}>
                    Clear All
                  </Text>
                </Pressable>
              )}
            </View>

            {/* List */}
            {notifications.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons
                  name="notifications-off-outline"
                  size={32}
                  color={colors.textMuted}
                />
                <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                  No notifications
                </Text>
              </View>
            ) : (
              <FlatList
                data={notifications}
                keyExtractor={(item) => item.id}
                renderItem={renderItem}
                style={styles.list}
                showsVerticalScrollIndicator={false}
              />
            )}
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 100,
    paddingRight: 16,
  },
  dropdown: {
    width: 320,
    maxHeight: 400,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    boxShadow: '0px 8px 20px rgba(0,0,0,0.12)',
    elevation: 16,
  },
  dropdownHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  dropdownTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  clearText: {
    fontSize: 13,
    fontWeight: '600',
  },
  list: {
    maxHeight: 320,
  },
  notifItem: {
    flexDirection: 'row',
    padding: 14,
    borderBottomWidth: 1,
    gap: 10,
  },
  notifContent: {
    flex: 1,
  },
  notifHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  notifTitle: {
    fontSize: 14,
    flex: 1,
  },
  notifTime: {
    fontSize: 11,
    marginLeft: 8,
  },
  notifBody: {
    fontSize: 13,
    lineHeight: 18,
  },
  dismissBtn: {
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    padding: 32,
    alignItems: 'center',
    gap: 8,
  },
  emptyText: {
    fontSize: 14,
  },
});
