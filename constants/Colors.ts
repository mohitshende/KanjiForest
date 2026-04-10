const Colors = {
  light: {
    background: '#FAFAF8',
    surface: '#FFFFFF',
    surfaceElevated: '#F4F3EF',
    border: '#E8E6E0',
    textPrimary: '#1A1A1A',
    textSecondary: '#6B6B6B',
    textMuted: '#ABABAB',

    accentRed: '#E84855',
    accentBlue: '#3A7BD5',
    accentGreen: '#27AE60',
    accentOrange: '#F4A261',
    accentPurple: '#7C5CBF',

    xpGold: '#F2B705',
    streakFlame: '#FF6B35',

    // Aliases for compatibility
    tint: '#3A7BD5',
    text: '#1A1A1A',
  },
  dark: {
    background: '#0A0A0A',
    surface: '#141414',
    surfaceElevated: '#1E1E1E',
    border: '#2C2C2C',
    textPrimary: '#F0EFE9',
    textSecondary: '#9A9A9A',
    textMuted: '#555555',

    accentRed: '#D44050',
    accentBlue: '#4A8BE5',
    accentGreen: '#2EBD6A',
    accentOrange: '#E89955',
    accentPurple: '#8B6BCF',

    xpGold: '#F2B705',
    streakFlame: '#FF6B35',

    // Aliases
    tint: '#4A8BE5',
    text: '#F0EFE9',
  },
};

export type ThemeColors = typeof Colors.light;
export default Colors;
