import { vars } from 'nativewind';

export const lightColors = {
  background: '#F9FAFB',
  card: '#FFFFFF',
  text: '#1F2937',
  subText: '#6B7280',
  border: '#F3F4F6',
  primary: '#2F80ED',
  danger: '#EF4444',
  success: '#10B981',
  warning: '#F59E0B',
  mutedSurface: '#F3F4F6',
};

export const darkColors: typeof lightColors = {
  background: '#111827',
  card: '#1F2937',
  text: '#F9FAFB',
  subText: '#9CA3AF',
  border: '#374151',
  primary: '#3B82F6',
  danger: '#F87171',
  success: '#34D399',
  warning: '#FBBF24',
  mutedSurface: '#374151',
};

// '#2F80ED' -> '47 128 237' (space-separated so opacity like bg-primary/50 works)
const toRgb = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return `${(n >> 16) & 255} ${(n >> 8) & 255} ${n & 255}`;
};

const toVars = (colors: Record<string, string>) =>
  vars(
    Object.fromEntries(Object.entries(colors).map(([k, v]) => [`--color-${k}`, toRgb(v)]))
  );

export const themeVars = {
  light: toVars(lightColors),
  dark: toVars(darkColors),
};