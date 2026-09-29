/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

// Palette Pharmacie Guinée (issue des maquettes) : pas de variante sombre
// dediee pour le MVP, le mode sombre reutilise donc les memes tons de base.
export const Colors = {
  light: {
    text: '#1C2420',
    background: '#FAF8F3',
    backgroundElement: '#FFFFFF',
    backgroundSelected: '#F1ECDE',
    textSecondary: '#5B6560',
  },
  dark: {
    text: '#1C2420',
    background: '#FAF8F3',
    backgroundElement: '#FFFFFF',
    backgroundSelected: '#F1ECDE',
    textSecondary: '#5B6560',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

// Couleurs sémantiques de la marque, utilisées directement dans les écrans
// (statuts de stock, boutons d'action, etc.) — pas de variante light/dark,
// la palette est volontairement fixe pour le MVP.
export const Brand = {
  border: '#E4DFD3',
  textFaint: '#8A8578',

  primary: '#145C4B',
  primaryDark: '#0E4238',
  accent: '#D97A3D',

  success: '#2F7D52',
  successBg: '#EAF2EF',
  warning: '#B8791A',
  warningBg: '#FBF1E4',
  danger: '#B4402A',
  dangerBg: '#FDF4F1',

  chipBg: '#F1ECDE',
  navInactive: '#9A968A',
  headerDark: '#1C2420',
} as const;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;