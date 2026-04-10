import { useColorScheme } from 'react-native';
import Colors from '@/constants/Colors';

export function useThemeColors() {
  const colorScheme = useColorScheme() ?? 'light';
  return Colors[colorScheme];
}

export function useTheme() {
  const colorScheme = useColorScheme() ?? 'light';
  return {
    colorScheme,
    colors: Colors[colorScheme],
    isDark: colorScheme === 'dark',
  };
}
