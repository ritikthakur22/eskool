import { GoogleSignin } from '@react-native-google-signin/google-signin';
GoogleSignin.configure({ webClientId: '228295306473-t6cv4gac9pn81pbcgk6av05roi9j2662.apps.googleusercontent.com' });
import { ThemeProvider, useTheme } from '@/context/ThemeContext';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { PortalHost } from '@rn-primitives/portal';
import '../../global.css';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NAV_THEME } from '@/lib/theme';
import { ThemeProvider as NavThemeProvider } from 'expo-router/react-navigation';

function RootNavigator() {
  const { isDark, colors } = useTheme();
  return (
    <>
      <NavThemeProvider value={NAV_THEME[isDark ? 'dark' : 'light']}>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.background },
          }}
        />
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <PortalHost />
      </NavThemeProvider>
    </>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <RootNavigator />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
