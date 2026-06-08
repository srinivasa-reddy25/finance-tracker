import { useThemeStore } from '../stores/themeStore';

// Paisa — Design Tokens
// Foundation: warm paper + ink, one signature deep green accent.
// Light is canonical; dark overrides follow the same key names.

export const colors = {
  // Surfaces
  canvas: '#F4F2EC', // app background behind cards
  surface: '#FFFFFF', // primary card / sheet
  surface2: '#FBFAF6', // inset fields, subtle wells

  // Ink
  ink: '#1A1714', // primary text + primary buttons
  ink2: '#6B655C', // secondary text
  ink3: '#9C968C', // tertiary / placeholder

  // Hairlines
  line: '#EAE6DD',
  line2: '#DCD7CB',

  // Signature accent — deep money green
  accent: '#0E7B53',
  accentPress: '#0B6444',
  accentSoft: '#E4F1EA',
  accentInk: '#FFFFFF',

  // Semantics
  income: '#0E7B53',
  incomeSoft: '#E4F1EA',
  expense: '#C5392C',
  expenseSoft: '#FAEAE7',
  warn: '#B07514',
  warnSoft: '#F7EFDC',

  // Category palette
  catFood: '#DA8400',
  catFoodBg: '#FAF0DB',
  catTransport: '#2F6BE2',
  catTransportBg: '#E8EFFD',
  catEntertain: '#7C5CFF',
  catEntertainBg: '#EEEAFF',
  catHealth: '#E0484D',
  catHealthBg: '#FBEAEB',
  catShopping: '#D6308C',
  catShoppingBg: '#FAE6F1',
  catBills: '#0E9F8E',
  catBillsBg: '#E0F4F1',
  catOthers: '#7A746B',
  catOthersBg: '#EFEDE7',

  // Dark mode overrides (use via theme context when dark mode is active)
  dark: {
    canvas: '#0E0E0F',
    surface: '#1A1A1B',
    surface2: '#232324',
    ink: '#F5F2EC',
    ink2: '#A39E95',
    ink3: '#6E6962',
    line: 'rgba(255,255,255,0.09)',
    line2: 'rgba(255,255,255,0.15)',
    accent: '#2ED68A',
    accentPress: '#25B574',
    accentSoft: 'rgba(46,214,138,0.14)',
    accentInk: '#06150E',
    income: '#2ED68A',
    incomeSoft: 'rgba(46,214,138,0.14)',
    expense: '#FF6E60',
    expenseSoft: 'rgba(255,110,96,0.15)',
    warn: '#E5A640',
    warnSoft: 'rgba(229,166,64,0.15)',
  },
};

export type TColors = Omit<typeof colors, 'dark'> & typeof colors.dark;

export function catBg(bg: string, iconColor: string, isDark: boolean): string {
  if (!isDark) return bg;
  const r = parseInt(iconColor.slice(1, 3), 16);
  const g = parseInt(iconColor.slice(3, 5), 16);
  const b = parseInt(iconColor.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, 0.18)`;
}

export function useColors(): TColors {
  const isDark = useThemeStore(s => s.isDark);
  if (!isDark) return colors as unknown as TColors;
  return { ...colors, ...colors.dark } as TColors;
}

export const spacing = {
  s1: 4,
  s2: 8,
  s3: 12,
  s4: 16,
  s5: 20,
  s6: 24,
  s8: 32,
  s10: 40,
  // aliases
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
};

export const radius = {
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  '2xl': 30,
  full: 999,
};

export const typography = {
  regular: 'HankenGrotesk-Regular',
  medium: 'HankenGrotesk-Medium',
  semibold: 'HankenGrotesk-SemiBold',
  bold: 'HankenGrotesk-Bold',
  extrabold: 'HankenGrotesk-ExtraBold',
};

export const shadow = {
  sm: {
    shadowColor: '#1A1714',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  card: {
    shadowColor: '#1A1714',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 3,
  },
  strong: {
    shadowColor: '#1A1714',
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.16,
    shadowRadius: 48,
    elevation: 8,
  },
  accent: {
    shadowColor: '#0E7B53',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 6,
  },
};
