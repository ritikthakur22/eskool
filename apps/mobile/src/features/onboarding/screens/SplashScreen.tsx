import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useEffect } from 'react';
import { StyleSheet, View, Text } from 'react-native';
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
      
      <View style={styles.illustrationContainer}>
        {/* Simplified vector illustration representing the school building from goal.png */}
        <View style={styles.building}>
          <View style={styles.roof} />
          <View style={styles.buildingBody}>
            <View style={styles.signBoard}>
              <Text style={styles.signText}>SCHOILL</Text>
            </View>
            <View style={styles.door} />
          </View>
        </View>
        <View style={styles.ground} />
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
  
  illustrationContainer: { height: 250, alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 20 },
  building: { alignItems: 'center', zIndex: 10 },
  roof: { 
    width: 0, height: 0, 
    borderLeftWidth: 100, borderLeftColor: 'transparent',
    borderRightWidth: 100, borderRightColor: 'transparent',
    borderBottomWidth: 60, borderBottomColor: '#EF4444',
  },
  buildingBody: { width: 180, height: 120, backgroundColor: '#F3F4F6', borderWidth: 2, borderColor: '#E5E7EB', borderTopWidth: 0, alignItems: 'center', padding: 20 },
  signBoard: { backgroundColor: '#FCD34D', paddingHorizontal: 16, paddingVertical: 4, borderRadius: 4, marginBottom: 20 },
  signText: { color: '#B45309', fontWeight: 'bold', fontSize: 12, letterSpacing: 1 },
  door: { width: 40, height: 60, backgroundColor: '#374151', borderTopLeftRadius: 20, borderTopRightRadius: 20, position: 'absolute', bottom: 0 },
  ground: { width: '100%', height: 60, backgroundColor: '#10B981', position: 'absolute', bottom: 0, borderTopLeftRadius: 500, borderTopRightRadius: 500, transform: [{ scaleX: 2 }] }
});
