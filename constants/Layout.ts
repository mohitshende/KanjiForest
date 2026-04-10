import { Dimensions } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export const Layout = {
  screen: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },

  padding: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 20,
    xl: 24,
    '2xl': 32,
  },

  radius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    pill: 999,
  },

  card: {
    borderRadius: 16,
    padding: 16,
    paddingPrimary: 20,
    shadow: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
      elevation: 3,
    },
  },

  button: {
    height: 52,
    borderRadius: 12,
    minTapTarget: 44,
  },

  progressBar: {
    height: 3,
  },

  heatmap: {
    squareSize: 8,
    gap: 4,
  },

  tabBar: {
    height: 85,
    paddingBottom: 25,
  },

  iconSize: {
    sm: 16,
    md: 20,
    lg: 24,
    xl: 28,
  },
} as const;

export default Layout;
