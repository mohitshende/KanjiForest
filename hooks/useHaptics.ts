import * as Haptics from 'expo-haptics';
import { useSettingsStore } from '@/stores/useSettingsStore';

export function useHaptics() {
  const enabled = useSettingsStore((s) => s.hapticFeedbackEnabled);

  const light = () => {
    if (enabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const medium = () => {
    if (enabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const heavy = () => {
    if (enabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  };

  const success = () => {
    if (enabled) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const error = () => {
    if (enabled) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  };

  return { light, medium, heavy, success, error };
}
