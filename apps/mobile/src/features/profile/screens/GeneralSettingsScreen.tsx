import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, Alert, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../core/theme/ThemeContext';
import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';
import { getInMemoryAccessToken, getInMemoryRefreshToken } from '../../../core/networking/session';

export default function GeneralSettingsScreen({ navigation }: any) {
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const { themeMode, setThemeMode, isDark, colors } = useTheme();

  useEffect(() => {
    SecureStore.getItemAsync('biometric_enabled').then(value => setBiometricEnabled(value === 'true'));
  }, []);

  const updateBiometric = async (enabled: boolean) => {
    if (enabled) {
      const [hardware, enrolled, token] = await Promise.all([
        LocalAuthentication.hasHardwareAsync(),
        LocalAuthentication.isEnrolledAsync(),
        SecureStore.getItemAsync('access_token'),
      ]);
      if (!hardware || !enrolled) {
        Alert.alert('Biometrics unavailable', 'Set up face or fingerprint unlock in your device settings first.');
        return;
      }
      const accessToken = getInMemoryAccessToken() || token;
      const refreshToken = getInMemoryRefreshToken() || await SecureStore.getItemAsync('refresh_token');
      if (!accessToken || !refreshToken) {
        Alert.alert('Log in first', 'Log in to your school account before enabling biometric login.');
        return;
      }
      const result = await LocalAuthentication.authenticateAsync({ promptMessage: 'Confirm biometric login setup', cancelLabel: 'Cancel', disableDeviceFallback: true });
      if (!result.success) return;
      await Promise.all([
        SecureStore.setItemAsync('access_token', accessToken),
        SecureStore.setItemAsync('refresh_token', refreshToken),
      ]);
    }
    setBiometricEnabled(enabled);
    await SecureStore.setItemAsync('biometric_enabled', enabled ? 'true' : 'false');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>General Settings</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        
        {/* Appearance */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.subText }]}>Appearance (Dark Mode)</Text>
          <View style={[styles.themeSelector, { backgroundColor: isDark ? '#374151' : '#E5E7EB' }]}>
            <TouchableOpacity 
              style={[styles.themeBtn, themeMode === 'light' && [styles.themeBtnActive, { backgroundColor: colors.card }]]} 
              onPress={() => setThemeMode('light')}
            >
              <Text style={[styles.themeBtnText, { color: themeMode === 'light' ? colors.text : colors.subText }]}>Light</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.themeBtn, themeMode === 'dark' && [styles.themeBtnActive, { backgroundColor: colors.card }]]} 
              onPress={() => setThemeMode('dark')}
            >
              <Text style={[styles.themeBtnText, { color: themeMode === 'dark' ? colors.text : colors.subText }]}>Dark</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.themeBtn, themeMode === 'system' && [styles.themeBtnActive, { backgroundColor: colors.card }]]} 
              onPress={() => setThemeMode('system')}
            >
              <Text style={[styles.themeBtnText, { color: themeMode === 'system' ? colors.text : colors.subText }]}>System</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Security */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.subText }]}>Security</Text>
          
          <View style={[styles.settingItem, { backgroundColor: colors.card }]}>
            <Text style={[styles.settingText, { color: colors.text }]}>Biometric Login</Text>
            <Switch value={biometricEnabled} onValueChange={updateBiometric} trackColor={{ false: '#D1D5DB', true: colors.primary }} />
          </View>

          <TouchableOpacity style={[styles.settingButton, { backgroundColor: colors.card }]} onPress={() => navigation.navigate('Profile')}>
            <Text style={[styles.settingText, { color: colors.text }]}>Change Password</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.subText} />
          </TouchableOpacity>
        </View>

        {/* Advanced */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.subText }]}>Advanced</Text>
          <TouchableOpacity style={[styles.settingButton, { backgroundColor: colors.card }]} onPress={() => Alert.alert('Device Logs', 'No crash logs found on this device.')}>
            <Text style={[styles.settingText, { color: colors.text }]}>Device Logs</Text>
            <Ionicons name="document-text-outline" size={20} color={colors.subText} />
          </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1 },
  backButton: { padding: 8 },
  headerTitle: { fontSize: 18, fontWeight: '600' },
  content: { flex: 1 },
  section: { marginTop: 24, paddingHorizontal: 16 },
  sectionTitle: { fontSize: 14, fontWeight: '600', marginBottom: 12, textTransform: 'uppercase' },
  settingItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderRadius: 12, marginBottom: 8 },
  settingText: { fontSize: 16, fontWeight: '500' },
  settingButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderRadius: 12, marginBottom: 8 },
  themeSelector: { flexDirection: 'row', borderRadius: 12, padding: 4 },
  themeBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8 },
  themeBtnActive: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 },
  themeBtnText: { fontSize: 15, fontWeight: '600' }
});
