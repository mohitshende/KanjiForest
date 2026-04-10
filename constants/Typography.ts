import { Platform, TextStyle } from 'react-native';

const systemFont = Platform.select({
  ios: 'System',
  android: 'Roboto',
  default: 'System',
});

export const FontFamily = {
  kanjiDisplay: 'NotoSansJP-Bold',
  readings: 'NotoSansJP-Regular',
  heading: systemFont,
  body: systemFont,
  japanese: 'NotoSansJP-Regular',
  japaneseBold: 'NotoSansJP-Bold',
} as const;

export const FontSize = {
  xs: 11,
  sm: 13,
  base: 15,
  md: 17,
  lg: 20,
  xl: 24,
  '2xl': 32,
  '3xl': 48,
  hero: 96,
} as const;

export const Typography = {
  hero: {
    fontFamily: FontFamily.kanjiDisplay,
    fontSize: FontSize.hero,
    lineHeight: 110,
  } as TextStyle,

  kanjiLarge: {
    fontFamily: FontFamily.kanjiDisplay,
    fontSize: FontSize['3xl'],
    lineHeight: 56,
  } as TextStyle,

  h1: {
    fontSize: FontSize['2xl'],
    fontWeight: '700',
    lineHeight: 40,
  } as TextStyle,

  h2: {
    fontSize: FontSize.xl,
    fontWeight: '600',
    lineHeight: 32,
  } as TextStyle,

  h3: {
    fontSize: FontSize.lg,
    fontWeight: '600',
    lineHeight: 28,
  } as TextStyle,

  body: {
    fontSize: FontSize.base,
    fontWeight: '400',
    lineHeight: 22,
  } as TextStyle,

  bodyMedium: {
    fontSize: FontSize.md,
    fontWeight: '400',
    lineHeight: 24,
  } as TextStyle,

  caption: {
    fontSize: FontSize.sm,
    fontWeight: '400',
    lineHeight: 18,
  } as TextStyle,

  small: {
    fontSize: FontSize.xs,
    fontWeight: '400',
    lineHeight: 16,
  } as TextStyle,

  reading: {
    fontFamily: FontFamily.readings,
    fontSize: FontSize.base,
    lineHeight: 22,
  } as TextStyle,

  readingLarge: {
    fontFamily: FontFamily.readings,
    fontSize: FontSize.lg,
    lineHeight: 28,
  } as TextStyle,

  badge: {
    fontSize: FontSize.xs,
    fontWeight: '600',
    lineHeight: 16,
  } as TextStyle,
} as const;

export default Typography;
