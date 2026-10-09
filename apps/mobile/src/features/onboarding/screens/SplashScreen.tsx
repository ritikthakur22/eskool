import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useEffect } from 'react';
import { StyleSheet, View, Text, ActivityIndicator } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../core/theme/ThemeContext';
import { api } from '../../../core/networking/api';
import { setInMemoryAccessToken, setInMemoryRefreshToken } from '../../../core/networking/session';

type Props = {
  navigation: NativeStackNavigationProp<any>;
};

export default function SplashScreen({ navigation }: Props) {
  const { colors } = useTheme();
  useEffect(() => {
    let cancelled = false;
    const bootstrap = async () => {
      try {
        const [completed, refreshToken] = await Promise.all([
          SecureStore.getItemAsync('onboarding_complete'),
          SecureStore.getItemAsync('refresh_token'),
        ]);
        const [biometricEnabled, keepSignedIn] = await Promise.all([
          SecureStore.getItemAsync('biometric_enabled'),
          SecureStore.getItemAsync('keep_signed_in'),
        ]);
        if (refreshToken && (biometricEnabled === 'true' || keepSignedIn === 'true')) {
          const { data } = await api.post('/auth/refresh', { refresh_token: refreshToken });
          await Promise.all([
            SecureStore.setItemAsync('access_token', data.access_token),
            SecureStore.setItemAsync('refresh_token', data.refresh_token),
            SecureStore.setItemAsync('user_data', JSON.stringify(data.user)),
          ]);
          setInMemoryAccessToken(data.access_token);
          setInMemoryRefreshToken(data.refresh_token);
          if (!cancelled) navigation.replace('Dashboard');
          return;
        }
        if (!cancelled) navigation.replace(completed === 'true' ? 'Login' : 'Onboarding');
      } catch {
        await Promise.all([SecureStore.deleteItemAsync('access_token'), SecureStore.deleteItemAsync('refresh_token')]);
        setInMemoryAccessToken(null);
        setInMemoryRefreshToken(null);
        const completed = await SecureStore.getItemAsync('onboarding_complete');
        if (!cancelled) navigation.replace(completed === 'true' ? 'Login' : 'Onboarding');
      }
    };
    bootstrap();
    return () => { cancelled = true; };
  }, [navigation]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <Ionicons name="school" size={80} color={colors.primary} />
        </View>
        <Text style={[styles.title, { color: colors.primary }]}>eSkool</Text>
        <Text style={[styles.subtitle, { color: colors.subText }]}>Learn • Manage • Grow</Text>
      </View>
      
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 80 },
  logoContainer: { marginBottom: 20 },
  title: { fontSize: 40, fontWeight: 'bold', color: '#2F80ED', marginBottom: 12 },
  subtitle: { fontSize: 16, color: '#6B7280', fontWeight: '500', letterSpacing: 1 },
  loaderContainer: { height: 250, alignItems: 'center', justifyContent: 'center', paddingBottom: 20 },
});
