import { Pressable, Text, View } from 'react-native';
import { useTheme } from '@/context/ThemeContext';

const MODES = ['light', 'dark', 'system'] as const;

type Props = {
  variant?: 'segmented' | 'button';
  className?: string;
};

export function ThemeSwitcher({ variant = 'segmented', className = '' }: Props) {
  const { themeMode, setThemeMode, isDark } = useTheme();

  if (variant === 'button') {
    return (
      <Pressable
        onPress={() => setThemeMode(isDark ? 'light' : 'dark')}
        className={`rounded-lg bg-primary p-3 ${className}`}>
        <Text className="text-center text-white">
          {isDark ? 'Switch to light' : 'Switch to dark'}
        </Text>
      </Pressable>
    );
  }

  return (
    <View className={`flex-row rounded-xl bg-mutedSurface p-1 ${className}`}>
      {MODES.map((mode) => (
        <Pressable
          key={mode}
          onPress={() => setThemeMode(mode)}
          className={`flex-1 rounded-lg py-2 ${themeMode === mode ? 'bg-primary' : ''}`}>
          <Text
            className={`text-center capitalize ${
              themeMode === mode ? 'text-white' : 'text-subText'
            }`}>
            {mode}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}