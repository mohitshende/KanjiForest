import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  timestamp: number;
  read: boolean;
}

interface NotificationState {
  notifications: AppNotification[];
  unreadCount: number;

  addNotification: (title: string, body: string) => void;
  dismissNotification: (id: string) => void;
  clearAll: () => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  loadNotifications: () => Promise<void>;
}

const STORAGE_KEY = 'kanjiforest_notifications';

const DEFAULT_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'welcome',
    title: 'Welcome to KanjiForest!',
    body: 'Start your journey by learning your first kanji. Tap any unlocked kanji in the tree to begin.',
    timestamp: Date.now(),
    read: false,
  },
  {
    id: 'feature_srs',
    title: 'Smart Reviews',
    body: 'KanjiForest uses spaced repetition to help you remember kanji long-term. Review regularly to build lasting memory.',
    timestamp: Date.now() - 1000,
    read: false,
  },
  {
    id: 'feature_writing',
    title: 'Practice Writing',
    body: 'Head to Practice > Writing to draw kanji stroke by stroke. Ghost hints are available if you get stuck.',
    timestamp: Date.now() - 2000,
    read: false,
  },
];

const persist = async (notifications: AppNotification[]) => {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
};

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,

  addNotification: (title, body) => {
    const notification: AppNotification = {
      id: `notif_${Date.now()}`,
      title,
      body,
      timestamp: Date.now(),
      read: false,
    };
    const updated = [notification, ...get().notifications];
    set({
      notifications: updated,
      unreadCount: updated.filter((n) => !n.read).length,
    });
    persist(updated);
  },

  dismissNotification: (id) => {
    const updated = get().notifications.filter((n) => n.id !== id);
    set({
      notifications: updated,
      unreadCount: updated.filter((n) => !n.read).length,
    });
    persist(updated);
  },

  clearAll: () => {
    set({ notifications: [], unreadCount: 0 });
    persist([]);
  },

  markAsRead: (id) => {
    const updated = get().notifications.map((n) =>
      n.id === id ? { ...n, read: true } : n
    );
    set({
      notifications: updated,
      unreadCount: updated.filter((n) => !n.read).length,
    });
    persist(updated);
  },

  markAllAsRead: () => {
    const updated = get().notifications.map((n) => ({ ...n, read: true }));
    set({ notifications: updated, unreadCount: 0 });
    persist(updated);
  },

  loadNotifications: async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: AppNotification[] = JSON.parse(stored);
        set({
          notifications: parsed,
          unreadCount: parsed.filter((n) => !n.read).length,
        });
      } else {
        // First launch — seed default notifications
        set({
          notifications: DEFAULT_NOTIFICATIONS,
          unreadCount: DEFAULT_NOTIFICATIONS.length,
        });
        persist(DEFAULT_NOTIFICATIONS);
      }
    } catch (e) {
      console.error('Failed to load notifications:', e);
    }
  },
}));
